import { supabase } from '../lib/supabase'
import Logger from '@utils/logger'

export type ApplicationInsert = {
  user_id: string
  job_id: string
  resume_id?: string | null
  tailored_resume_id?: string | null
  shortlisted?: boolean
  status?: 'in_progress' | 'applied' | 'shortlisted' | 'interviewing' | 'offer' | 'rejected'
  notes?: string | null
  applied_at?: string
}

export type ApplicationUpdate = Partial<ApplicationInsert>

export interface JoinedApplicationData {
  id: string
  user_id: string
  job_id: string
  resume_id: string | null
  tailored_resume_id: string | null
  shortlisted: boolean
  status: 'in_progress' | 'applied' | 'shortlisted' | 'interviewing' | 'offer' | 'rejected'
  notes: string | null
  applied_at: string
  created_at: string
  updated_at: string
  calculatedFitScore?: number
  jobs?: {
    id: string
    job_title: string
    company_name: string | null
    job_description: string | null
    job_link: string | null
    logo: string | null
  } | null
  resumes?: {
    id: string
    name: string | null
    file_name: string | null
  } | null
  tailored_resumes?: {
    id: string
    name: string
    fit_score: number
  } | null
}

/**
 * Fetch all applications for the current user with joined job, resume, tailored resume, and score details.
 * Rule:
 * - If application uses tailored_resumes -> fit score comes from tailored_resumes.fit_score
 * - If application uses base resumes -> fit score comes from scores table matching user_id + job_id + resume_id
 */
export async function fetchApplications(userId?: string): Promise<JoinedApplicationData[]> {
  if (!supabase) return []

  try {
    let query = supabase
      .from('applications')
      .select(
        `
        *,
        jobs (
          id,
          job_title,
          company_name,
          job_description,
          job_link,
          logo
        ),
        resumes (
          id,
          name,
          file_name
        ),
        tailored_resumes (
          id,
          name,
          fit_score
        )
      `
      )
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: rawApps, error } = await query

    if (error) {
      Logger.error('applications.ts', 'fetchApplications', 'Error fetching applications from Supabase', error)
      return []
    }

    const apps = (rawApps as unknown as JoinedApplicationData[]) || []

    // Fetch scores from `scores` table to resolve fit_score for base resumes
    let scoresMap = new Map<string, number>()
    if (userId) {
      const { data: scoresData } = await supabase
        .from('scores')
        .select('job_id, resume_id, fit_score')
        .eq('user_id', userId)

      if (scoresData) {
        scoresData.forEach((s) => {
          const key = `${s.job_id}:${s.resume_id}`
          scoresMap.set(key, s.fit_score)
        })
      }
    }

    // Attach calculatedFitScore to each application item
    return apps.map((app) => {
      let score: number | undefined

      if (app.tailored_resumes && app.tailored_resumes.fit_score !== undefined) {
        // Fit score from tailored_resumes table
        score = Number(app.tailored_resumes.fit_score)
      } else if (app.resume_id && app.job_id) {
        // Fit score from scores table
        const key = `${app.job_id}:${app.resume_id}`
        if (scoresMap.has(key)) {
          score = Number(scoresMap.get(key))
        }
      }

      return {
        ...app,
        calculatedFitScore: score
      }
    })
  } catch (err) {
    Logger.error('applications.ts', 'fetchApplications', 'Failed to fetch applications', err)
    return []
  }
}

/**
 * Insert a new application record in Supabase
 */
export async function createApplication(
  applicationData: ApplicationInsert
): Promise<JoinedApplicationData | null> {
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select(
        `
        *,
        jobs (
          id,
          job_title,
          company_name,
          job_description,
          job_link,
          logo
        ),
        resumes (
          id,
          name,
          file_name
        ),
        tailored_resumes (
          id,
          name,
          fit_score
        )
      `
      )
      .single()

    if (error) {
      Logger.error('applications.ts', 'createApplication', 'Error creating application', error)
      return null
    }

    return (data as unknown as JoinedApplicationData) || null
  } catch (err) {
    Logger.error('applications.ts', 'createApplication', 'Failed to create application', err)
    return null
  }
}

/**
 * Update application status, shortlisted, or notes
 */
export async function updateApplication(
  id: string,
  updates: ApplicationUpdate
): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('applications')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      Logger.error('applications.ts', 'updateApplication', `Error updating application ${id}`, error)
      return false
    }

    return true
  } catch (err) {
    Logger.error('applications.ts', 'updateApplication', `Failed to update application ${id}`, err)
    return false
  }
}

/**
 * Toggle shortlisted flag for an application
 */
export async function toggleApplicationShortlist(
  id: string,
  currentShortlisted: boolean
): Promise<boolean> {
  const newShortlistState = !currentShortlisted
  const updates: ApplicationUpdate = {
    shortlisted: newShortlistState
  }
  if (newShortlistState) {
    updates.status = 'shortlisted'
  }
  return updateApplication(id, updates)
}

/**
 * Delete an application by ID
 */
export async function deleteApplication(id: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase.from('applications').delete().eq('id', id)

    if (error) {
      Logger.error('applications.ts', 'deleteApplication', `Error deleting application ${id}`, error)
      return false
    }

    return true
  } catch (err) {
    Logger.error('applications.ts', 'deleteApplication', `Failed to delete application ${id}`, err)
    return false
  }
}
