import { supabase } from '../lib/supabase'
import { Database } from './database.types'
import Logger from '@utils/logger'

export type AiUsageRow = Database['public']['Tables']['ai_usages']['Row']
export type AiUsageInsert = Database['public']['Tables']['ai_usages']['Insert']

/**
 * Record an AI usage event into public.ai_usages
 */
export async function recordAiUsage(
  usage: AiUsageInsert
): Promise<AiUsageRow | null> {
  if (!supabase) throw new Error('Supabase client is not initialized')

  const { data, error } = await supabase
    .from('ai_usages')
    .insert(usage)
    .select()
    .single()

  if (error) {
    Logger.error('aiUsages.ts', 'recordAiUsage', 'Error inserting AI usage', error)
    return null
  }

  return data
}

/**
 * Get AI usage events for a user with optional date and feature filters
 */
export async function getUserAiUsages(
  userId: string,
  options?: {
    startDate?: string
    feature?: string
  }
): Promise<AiUsageRow[]> {
  if (!supabase) throw new Error('Supabase client is not initialized')

  let query = supabase
    .from('ai_usages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate)
  }

  if (options?.feature && options.feature !== 'ALL') {
    query = query.eq('feature', options.feature)
  }

  const { data, error } = await query

  if (error) {
    Logger.error('aiUsages.ts', 'getUserAiUsages', 'Error querying AI usage', error)
    throw error
  }

  return data || []
}
