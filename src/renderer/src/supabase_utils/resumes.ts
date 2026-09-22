import { supabase } from './client'
import { Database } from './database.types'
import Logger from '@utils/logger'

export type ResumeRow = Database['public']['Tables']['resumes']['Row']
export type ResumeInsert = Database['public']['Tables']['resumes']['Insert']
export type ResumeUpdate = Database['public']['Tables']['resumes']['Update']

/**
 * Fetch all base resumes for a specific user, ordered newest first.
 */
export async function getUserResumes(userId: string): Promise<ResumeRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    Logger.error('resumes.ts', 'getUserResumes', 'Error fetching user resumes from public.resumes', error)
    throw error
  }

  return data || []
}



/**
 * Insert a new resume into public.resumes.
 */
export async function insertResume(resume: ResumeInsert): Promise<ResumeRow> {
  if (!supabase) {
    throw new Error('Supabase client is not initialized')
  }

  const { data, error } = await supabase
    .from('resumes')
    .insert(resume)
    .select('*')
    .single()

  if (error) {
    Logger.error('resumes.ts', 'insertResume', 'Error inserting resume into public.resumes', error)
    throw error
  }

  return data
}

/**
 * Update an existing resume row.
 */
export async function updateResume(
  resumeId: string,
  updates: ResumeUpdate
): Promise<ResumeRow | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', resumeId)
    .select('*')
    .single()

  if (error) {
    Logger.error('resumes.ts', 'updateResume', 'Error updating resume in public.resumes', error)
    throw error
  }

  return data
}

/**
 * Delete a resume by ID from public.resumes.
 */
export async function deleteResume(resumeId: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)

  if (error) {
    Logger.error('resumes.ts', 'deleteResume', 'Error deleting resume from public.resumes', error)
    throw error
  }
}
