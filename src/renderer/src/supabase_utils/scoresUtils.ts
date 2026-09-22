import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import Logger from '@utils/logger'

type ScoreRow = Database['public']['Tables']['scores']['Row']
type ScoreInsert = Database['public']['Tables']['scores']['Insert']

/**
 * Saves (inserts or updates) a score record in Supabase scores table.
 * If a score row already exists for user_id + job_id + resume_id, it updates it.
 * Otherwise, it creates a new score record.
 */
export async function saveOrUpdateScore(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  resumeId: string,
  fitScore: number,
  potentialScore?: number
): Promise<ScoreRow | null> {
  const potScore = potentialScore ?? fitScore

  try {
    // Check if score record already exists for this user, job, and resume combo
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .eq('resume_id', resumeId)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from('scores')
        .update({
          fit_score: fitScore,
          potential_score: potScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        Logger.error('scoresUtils.ts', 'saveOrUpdateScore', 'Update error', error)
        return null
      }
      return data as ScoreRow
    } else {
      const insertPayload: ScoreInsert = {
        user_id: userId,
        job_id: jobId,
        resume_id: resumeId,
        fit_score: fitScore,
        potential_score: potScore
      }

      const { data, error } = await supabase
        .from('scores')
        .insert(insertPayload)
        .select()
        .single()

      if (error) {
        Logger.error('scoresUtils.ts', 'saveOrUpdateScore', 'Insert error', error)
        return null
      }
      return data as ScoreRow
    }
  } catch (err) {
    Logger.error('scoresUtils.ts', 'saveOrUpdateScore', 'Unexpected error', err)
    return null
  }
}
