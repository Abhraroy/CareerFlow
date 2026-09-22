import { supabase } from '../lib/supabase'
import { getActiveKey, trackUsage } from './apiUsageService'
import { AIFeature, AIUsageInfo } from '../types'
import Logger from '@utils/logger'

/**
 * Helper utility to track API usage in a simple, readable manner.
 * Automatically fetches the active key ID for the user and logs the usage event.
 */
export async function trackApiUsage(
  userId: string,
  feature: AIFeature,
  usage: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    model?: string
  }
): Promise<void> {
  try {
    if (!supabase) {
      Logger.warn('trackUsage.ts', 'trackApiUsage', 'Supabase client is not initialized')
      return
    }

    const keyRecord = await getActiveKey(supabase, userId)
    if (!keyRecord) {
      Logger.warn('trackUsage.ts', 'trackApiUsage', `No active key connected for user: ${userId}`)
      return
    }

    const usageInfo: AIUsageInfo = {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      totalTokens: usage.totalTokens ?? 0,
      model: usage.model ?? 'unknown'
    }

    await trackUsage(supabase, keyRecord.id, userId, feature, usageInfo)
    Logger.info('trackUsage.ts', 'trackApiUsage', `Logged ${feature} token usage`, usageInfo)
  } catch (error) {
    Logger.error('trackUsage.ts', 'trackApiUsage', `Failed to log token usage for ${feature}`, error)
  }
}
