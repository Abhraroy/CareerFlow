import { supabase } from './client'
import { Database } from './database.types'
import Logger from '@utils/logger'

export type TailoredResumeRow = Database['public']['Tables']['tailored_resumes']['Row']
export type TailoredResumeInsert = Database['public']['Tables']['tailored_resumes']['Insert']
export type TailoredResumeUpdate = Database['public']['Tables']['tailored_resumes']['Update']

/**
 * Fetch all tailored resumes for a specific user, ordered newest first.
 */
export async function getUserTailoredResumes(userId: string): Promise<TailoredResumeRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('tailored_resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    Logger.error('tailoredResumes.ts', 'getUserTailoredResumes', 'Error fetching user tailored resumes from public.tailored_resumes', error)
    throw error
  }

  return data || []
}

/**
 * Insert a new tailored resume into public.tailored_resumes.
 */
export async function insertTailoredResume(
  tailored: TailoredResumeInsert
): Promise<TailoredResumeRow> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const { data, error } = await supabase
    .from('tailored_resumes')
    .insert(tailored)
    .select('*')
    .single()

  if (error) {
    Logger.error('tailoredResumes.ts', 'insertTailoredResume', 'Error inserting tailored resume into public.tailored_resumes', error)
    throw error
  }

  return data
}

/**
 * Update a tailored resume by ID.
 */
export async function updateTailoredResume(
  id: string,
  updates: TailoredResumeUpdate
): Promise<TailoredResumeRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('tailored_resumes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    Logger.error('tailoredResumes.ts', 'updateTailoredResume', 'Error updating tailored resume in public.tailored_resumes', error)
    throw error
  }

  return data
}

/**
 * Delete a tailored resume by ID.
 */
export async function deleteTailoredResume(id: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase
    .from('tailored_resumes')
    .delete()
    .eq('id', id)

  if (error) {
    Logger.error('tailoredResumes.ts', 'deleteTailoredResume', 'Error deleting tailored resume from public.tailored_resumes', error)
    throw error
  }
}
