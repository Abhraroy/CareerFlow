/**
 * apiUsageService.ts
 *
 * Centralized renderer-side service for BYOK (Bring Your Own Key) API usage.
 * Handles:
 *  - Fetching the active OpenAI key for the current user from public.api_key_table
 *  - Persisting usage events to Supabase (public.ai_usages table)
 *  - Querying aggregated usage data for the API Usage page
 *
 * The raw/decrypted API key never appears in storage — encryption/decryption is
 * handled exclusively in the Electron main process via safeStorage IPC.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { AIFeature, AIUsageInfo, APIUsageData, OpenAIKey } from '../types'
import {
  getUserApiKey,
  saveUserApiKey,
  deleteUserApiKey
} from '../supabase_utils/apiKey'
import { recordAiUsage, getUserAiUsages } from '../supabase_utils/aiUsages'
import Logger from '@utils/logger'

// ─── BYOK AI Call Wrappers ────────────────────────────────────────────────────
// These are the primary entry points components should use for OpenAI calls.
// Key resolution (encrypted → decrypted in main process) is handled here.

/**
 * Resolve the encrypted/hashed key for the current user.
 * Returns null if no key is connected — callers should show a "connect key" prompt.
 */
export async function resolveEncryptedKey(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const key = await getActiveKey(supabase, userId)
  return key?.encrypted_key ?? null
}

/**
 * BYOK-aware OpenAI chat completion.
 * Resolves the key, calls the tracked IPC, fires usage tracking, returns content.
 * Throws if no key is connected.
 */
export async function callOpenAIChat(
  supabase: SupabaseClient,
  userId: string,
  feature: AIFeature,
  params: {
    text: string
    systemMessage: string
    model?: string
    jsonMode?: boolean
  }
): Promise<string> {
  const key = await getActiveKey(supabase, userId)
  if (!key || !key.encrypted_key) {
    Logger.warn('apiUsageService.ts', 'callOpenAIChat', 'No API key found')
    throw new Error('No OpenAI API key connected. Go to API Usage to connect your key.')
  }

  const result = await window.api.openaiChatCompletionTracked({
    encryptedKey: key.encrypted_key,
    text: params.text,
    systemMessage: params.systemMessage,
    model: params.model,
    jsonMode: params.jsonMode
  })

  // Fire-and-forget usage tracking
  trackUsage(supabase, key.id, userId, feature, result.usage).catch((e) =>
    Logger.error('apiUsageService.ts', 'callOpenAIChat', 'trackUsage failed', e)
  )

  return result.content
}

/**
 * BYOK-aware OpenAI embeddings.
 * Resolves the key, calls the tracked IPC, fires usage tracking, returns embedding.
 * Throws if no key is connected.
 */
export async function callOpenAIEmbed(
  supabase: SupabaseClient,
  userId: string,
  feature: AIFeature,
  text: string,
  model?: string
): Promise<number[]> {
  const key = await getActiveKey(supabase, userId)
  if (!key || !key.encrypted_key) {
    throw new Error('No OpenAI API key connected. Go to API Usage to connect your key.')
  }

  const result = await window.api.openaiEmbeddingsTracked({
    encryptedKey: key.encrypted_key,
    text,
    model
  })

  // Fire-and-forget usage tracking
  trackUsage(supabase, key.id, userId, feature, result.usage).catch((e) =>
    Logger.error('apiUsageService.ts', 'callOpenAIEmbed', 'trackUsage failed', e)
  )

  return result.embedding
}

// ─── Key Management ───────────────────────────────────────────────────────────

/**
 * Fetch the active OpenAI key record for a user from public.api_key_table.
 */
export async function getActiveKey(
  _supabase: SupabaseClient,
  userId: string
): Promise<OpenAIKey | null> {
  try {
    const keyRow = await getUserApiKey(userId, 'openai')
    if (!keyRow || !keyRow.hashed_api_key) {
      return null
    }

    return {
      id: keyRow.id,
      user_id: keyRow.user_id,
      encrypted_key: keyRow.hashed_api_key,
      is_active: true,
      created_at: keyRow.created_at,
      type: keyRow.type
    }
  } catch (error) {
    Logger.error('apiUsageService.ts', 'getActiveKey', 'getActiveKey error', error)
    return null
  }
}

/**
 * Connect (store) a new OpenAI API key for a user in public.api_key_table.
 * Validates → encrypts (via IPC) → saves into public.api_key_table.
 * Returns { success, error? }
 */
export async function connectKey(
  _supabase: SupabaseClient,
  userId: string,
  rawKey: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate via IPC (main process calls OpenAI /v1/models)
  const validation = await window.api.validateOpenAIKey(rawKey)
  if (!validation.valid) {
    return { success: false, error: validation.error || 'Invalid API key.' }
  }

  // 2. Encrypt via IPC (main process uses Electron safeStorage)
  let encrypted: { encryptedKey: string; keyLast4: string }
  try {
    encrypted = await window.api.encryptOpenAIKey(rawKey)
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Encryption failed.'
    }
  }

  // 3. Save into Supabase public.api_key_table
  try {
    await saveUserApiKey(userId, encrypted.encryptedKey, 'openai')
    return { success: true }
  } catch (error) {
    Logger.error('apiUsageService.ts', 'connectKey', 'connectKey error', error)
    return {
      success: false,
      error: 'Failed to save API key to database. Please try again.'
    }
  }
}

/**
 * Replace the existing key with a new one in public.api_key_table.
 * Validates the new key FIRST, then replaces the key record.
 * Returns { success, error? }
 */
export async function replaceKey(
  _supabase: SupabaseClient,
  userId: string,
  rawKey: string
): Promise<{ success: boolean; error?: string }> {
  // Validate first — don't touch old key if new one is invalid
  const validation = await window.api.validateOpenAIKey(rawKey)
  if (!validation.valid) {
    return { success: false, error: validation.error || 'Invalid API key.' }
  }

  let encrypted: { encryptedKey: string; keyLast4: string }
  try {
    encrypted = await window.api.encryptOpenAIKey(rawKey)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Encryption failed.' }
  }

  try {
    await saveUserApiKey(userId, encrypted.encryptedKey, 'openai')
    return { success: true }
  } catch (error) {
    Logger.error('apiUsageService.ts', 'replaceKey', 'replaceKey error', error)
    return { success: false, error: 'Failed to update API key. Please try again.' }
  }
}

/**
 * Delete the user's API key from public.api_key_table.
 * Returns { success, error? }
 */
export async function deleteKey(
  _supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteUserApiKey(userId, 'openai')
    return { success: true }
  } catch (error) {
    Logger.error('apiUsageService.ts', 'deleteKey', 'deleteKey error', error)
    return { success: false, error: 'Unable to delete API key. Please try again.' }
  }
}

// ─── Usage Tracking ───────────────────────────────────────────────────────────

/**
 * Persist a usage event to Supabase public.ai_usages after a successful OpenAI call.
 * Should be called fire-and-forget style — failure is logged but does not
 * block the user from receiving their AI result.
 */
export async function trackUsage(
  _supabase: SupabaseClient,
  apiKeyId: string,
  userId: string,
  feature: AIFeature,
  usageInfo: AIUsageInfo
): Promise<void> {
  try {
    await recordAiUsage({
      api_key_id: apiKeyId,
      user_id: userId,
      feature,
      model: usageInfo.model,
      input_tokens: usageInfo.inputTokens,
      output_tokens: usageInfo.outputTokens,
      total_tokens: usageInfo.totalTokens
    })
  } catch (error) {
    Logger.error('apiUsageService.ts', 'trackUsage', 'trackUsage failed', error)
  }
}

// ─── Usage Queries ────────────────────────────────────────────────────────────

export type DateFilter = 'today' | '7days' | '30days' | 'all'

/**
 * Fetch aggregated API usage data for the API Usage page.
 * Returns APIUsageData with summary, feature breakdown, and date history.
 */
export async function getUsageData(
  supabase: SupabaseClient,
  userId: string,
  dateFilter: DateFilter = 'all',
  featureFilter: AIFeature | 'ALL' = 'ALL'
): Promise<APIUsageData> {
  // 1. Get active key
  const key = await getActiveKey(supabase, userId)
  if (!key) {
    return {
      connected: false,
      summary: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      byFeature: [],
      history: []
    }
  }

  // 2. Build date range filter
  const now = new Date()
  let fromDate: string | undefined = undefined
  if (dateFilter === 'today') {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    fromDate = start.toISOString()
  } else if (dateFilter === '7days') {
    const d = new Date(now)
    d.setDate(d.getDate() - 7)
    fromDate = d.toISOString()
  } else if (dateFilter === '30days') {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    fromDate = d.toISOString()
  }

  // 3. Query usage rows from public.ai_usages
  const usageRows = await getUserAiUsages(userId, {
    startDate: fromDate,
    feature: featureFilter
  })

  // 4. Summary
  const summary = usageRows.reduce(
    (acc, r) => ({
      inputTokens: acc.inputTokens + (r.input_tokens ?? 0),
      outputTokens: acc.outputTokens + (r.output_tokens ?? 0),
      totalTokens: acc.totalTokens + (r.total_tokens ?? 0)
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  )

  // 5. By Feature (sorted by usage desc, hide zeros)
  const featureMap: Record<string, number> = {}
  for (const r of usageRows) {
    featureMap[r.feature] = (featureMap[r.feature] ?? 0) + (r.total_tokens ?? 0)
  }
  const byFeature = (Object.entries(featureMap) as [AIFeature, number][])
    .filter(([, t]) => t > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([feature, totalTokens]) => ({ feature, totalTokens }))

  // 6. History as individual entries ordered newest first
  const history = usageRows.map((r) => ({
    id: r.id || `${r.created_at}_${Math.random()}`,
    timestamp: r.created_at,
    feature: r.feature as AIFeature,
    model: r.model || 'unknown',
    inputTokens: r.input_tokens ?? 0,
    outputTokens: r.output_tokens ?? 0,
    totalTokens: r.total_tokens ?? 0
  }))

  const keyLast4: string | undefined = key.key_last4 || (key.encrypted_key ? '••••' : undefined)

  return {
    connected: true,
    keyLast4,
    keyId: key.id,
    summary,
    byFeature,
    history
  }
}
