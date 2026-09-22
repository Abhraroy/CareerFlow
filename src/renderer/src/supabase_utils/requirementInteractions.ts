import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import Logger from '@utils/logger'

type RequirementInteractionRow = Database['public']['Tables']['requirement_interactions']['Row']
type RequirementInteractionInsert = Database['public']['Tables']['requirement_interactions']['Insert']

export interface RequirementInteractionInput {
  requirement_id: string
  requirement: string
  has_experience: boolean
  user_evidence?: string | null
  question?: string | null
  hint?: string | null
  answer?: string | null
}

/**
 * Saves (upserts) a batch of user requirement interactions for a given llm_analysis record.
 * Uses the unique constraint (llm_analysis_id, requirement_id) for conflict resolution.
 */
export async function saveRequirementInteractions(
  supabase: SupabaseClient,
  userId: string,
  llmAnalysisId: string,
  interactions: RequirementInteractionInput[]
): Promise<RequirementInteractionRow[]> {
  if (interactions.length === 0) return []

  const rows: RequirementInteractionInsert[] = interactions.map((item) => ({
    llm_analysis_id: llmAnalysisId,
    user_id: userId,
    requirement_id: item.requirement_id,
    requirement: item.requirement,
    has_experience: item.has_experience,
    user_evidence: item.user_evidence || null,
    question: item.question || null,
    hint: item.hint || null,
    answer: item.answer || null
  }))

  const { data, error } = await supabase
    .from('requirement_interactions')
    .upsert(rows, {
      onConflict: 'llm_analysis_id,requirement_id',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    Logger.error('requirementInteractions.ts', 'saveRequirementInteractions', 'Upsert error', error)
    return []
  }

  return (data as RequirementInteractionRow[]) || []
}

/**
 * Fetches all requirement interactions for a given llm_analysis_id.
 */
export async function fetchRequirementInteractions(
  supabase: SupabaseClient,
  llmAnalysisId: string
): Promise<RequirementInteractionRow[]> {
  const { data, error } = await supabase
    .from('requirement_interactions')
    .select('*')
    .eq('llm_analysis_id', llmAnalysisId)
    .order('created_at', { ascending: true })

  if (error) {
    Logger.error('requirementInteractions.ts', 'fetchRequirementInteractions', 'Fetch error', error)
    return []
  }

  return (data as RequirementInteractionRow[]) || []
}

/**
 * Converts persisted requirement interactions into the Record<string, string>
 * format expected by the tailoring prompt.
 */
export function interactionsToResolvedContext(
  interactions: RequirementInteractionRow[]
): Record<string, string> {
  const context: Record<string, string> = {}
  for (const row of interactions) {
    if (row.has_experience && row.user_evidence && row.user_evidence.trim()) {
      context[row.requirement] = row.user_evidence.trim()
    }
  }
  return context
}


