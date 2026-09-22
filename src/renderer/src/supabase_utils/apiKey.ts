// import { supabase } from '../lib/supabase'
import { Database } from './database.types'
import Logger from '@utils/logger'

export type ApiKeyRow = Database['public']['Tables']['api_key_table']['Row']
export type ApiKeyInsert = Database['public']['Tables']['api_key_table']['Insert']
export type ApiKeyUpdate = Database['public']['Tables']['api_key_table']['Update']

/**
 * Fetch the active API key record for a user by provider type (defaults to 'openai')
 */
export async function getUserApiKey(
  userId: string,
  type = 'openai'
): Promise<ApiKeyRow | null> {
  // DB code commented out per user request:
  /*
  if (!supabase) throw new Error('Supabase client is not initialized')

  const { data, error } = await supabase
    .from('api_key_table')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    Logger.error('apiKey.ts', 'getUserApiKey', 'Error fetching API key', error)
    return null
  }

  return data
  */

  // Local storage implementation:
  try {
    const storageKey = `jobpilot_api_key_${userId}_${type}`
    const storedData = localStorage.getItem(storageKey)
    if (!storedData) return null
    return JSON.parse(storedData) as ApiKeyRow
  } catch (error) {
    Logger.error('apiKey.ts', 'getUserApiKey', 'Error fetching API key from localStorage', error)
    return null
  }
}

/**
 * Insert or replace an API key for a user and provider type in api_key_table
 */
export async function saveUserApiKey(
  userId: string,
  hashedApiKey: string,
  type = 'openai'
): Promise<ApiKeyRow> {
  // DB code commented out per user request:
  /*
  if (!supabase) throw new Error('Supabase client is not initialized')

  // Remove any existing key for this user & type first
  await supabase
    .from('api_key_table')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)

  // Insert fresh record
  const { data, error } = await supabase
    .from('api_key_table')
    .insert({
      user_id: userId,
      type: type,
      hashed_api_key: hashedApiKey
    })
    .select()
    .single()

  if (error) {
    Logger.error('apiKey.ts', 'saveUserApiKey', 'Error inserting API key', error)
    throw error
  }

  return data
  */

  // Local storage implementation:
  try {
    const storageKey = `jobpilot_api_key_${userId}_${type}`
    const record: ApiKeyRow = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      user_id: userId,
      type: type,
      hashed_api_key: hashedApiKey,
      created_at: new Date().toISOString()
    }
    localStorage.setItem(storageKey, JSON.stringify(record))
    return record
  } catch (error) {
    Logger.error('apiKey.ts', 'saveUserApiKey', 'Error saving API key to localStorage', error)
    throw error
  }
}

/**
 * Delete API key for a user and provider type
 */
export async function deleteUserApiKey(
  userId: string,
  type = 'openai'
): Promise<boolean> {
  // DB code commented out per user request:
  /*
  if (!supabase) throw new Error('Supabase client is not initialized')

  const { error } = await supabase
    .from('api_key_table')
    .delete()
    .eq('user_id', userId)
    .eq('type', type)

  if (error) {
    Logger.error('apiKey.ts', 'deleteUserApiKey', 'Error deleting API key', error)
    throw error
  }

  return true
  */

  // Local storage implementation:
  try {
    const storageKey = `jobpilot_api_key_${userId}_${type}`
    localStorage.removeItem(storageKey)
    return true
  } catch (error) {
    Logger.error('apiKey.ts', 'deleteUserApiKey', 'Error deleting API key from localStorage', error)
    throw error
  }
}
