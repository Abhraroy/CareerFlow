import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'
import Logger from '@utils/logger'

type LlmAnalysisRow = Database['public']['Tables']['llm_analysis']['Row']
type LlmAnalysisInsert = Database['public']['Tables']['llm_analysis']['Insert']

/**
 * Saves (inserts) an LLM analysis record to Supabase.
 * Returns the inserted row including its generated `id`.
 */
export async function saveLlmAnalysis(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  requirements: unknown[],
  resumeId?: string | null,
  tailorResumeId?: string | null
): Promise<LlmAnalysisRow | null> {
  const insertPayload: LlmAnalysisInsert = {
    user_id: userId,
    job_id: jobId,
    requirements: requirements as Json,
    ...(resumeId ? { resume_id: resumeId } : {}),
    ...(tailorResumeId ? { tailor_resume_id: tailorResumeId } : {})
  }

  const { data, error } = await supabase
    .from('llm_analysis')
    .insert(insertPayload)
    .select()
    .single()

  if (error) {
    Logger.error('llmAnalysis.ts', 'saveLlmAnalysis', 'Insert error', error)
    return null
  }

  return data as LlmAnalysisRow
}

/**
 * Fetches the most recent LLM analysis for a user + job + base resume combo.
 * Used to check for cached results before re-running the LLM.
 */
export async function fetchLlmAnalysis(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  resumeId?: string | null
): Promise<LlmAnalysisRow | null> {
  let query = supabase
    .from('llm_analysis')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .is('tailor_resume_id', null) // Only base resume analyses
    .order('created_at', { ascending: false })
    .limit(1)

  if (resumeId) {
    query = query.eq('resume_id', resumeId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    Logger.error('llmAnalysis.ts', 'fetchLlmAnalysis', 'Fetch error', error)
    return null
  }

  return data as LlmAnalysisRow | null
}


