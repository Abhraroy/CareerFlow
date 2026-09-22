import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import Logger from '@utils/logger'

type JobRow = Database['public']['Tables']['jobs']['Row']

export interface ScrapedJobInput {
  jobTitle?: string | null
  company?: string | null
  aboutJob?: string | null
  aboutCompany?: string | null
  logo?: string | null
  jobLink?: string | null
}

/**
 * Saves a scraped job to the `jobs` table.
 * If a job with the same title + company already exists for this user, returns the existing record.
 * Otherwise creates a new record.
 */
export async function saveScrapedJob(
  supabase: SupabaseClient,
  userId: string,
  scrapedJob: ScrapedJobInput
): Promise<JobRow | null> {
  const jobTitle = scrapedJob.jobTitle?.trim() || 'Untitled Job'
  const companyName = scrapedJob.company?.trim() || null

  // Check if a matching job already exists for this user
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('job_title', jobTitle)

  if (companyName) {
    query = query.eq('company_name', companyName)
  }

  const { data: existingJobs, error: fetchError } = await query.limit(1)

  if (fetchError) {
    Logger.error('jobsUtils.ts', 'saveScrapedJob', 'Fetch existing error', fetchError)
  }

  if (existingJobs && existingJobs.length > 0) {
    Logger.info('jobsUtils.ts', 'saveScrapedJob', `Found existing job: ${existingJobs[0].id}`)
    return existingJobs[0] as JobRow
  }

  // Create new job record
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      job_title: jobTitle,
      company_name: companyName,
      job_description: scrapedJob.aboutJob || null,
      company_description: scrapedJob.aboutCompany || null,
      logo: scrapedJob.logo || null,
      job_link: scrapedJob.jobLink || null
    })
    .select()
    .single()

  if (error) {
    Logger.error('jobsUtils.ts', 'saveScrapedJob', 'Insert error', error)
    return null
  }

  Logger.info('jobsUtils.ts', 'saveScrapedJob', `Created new job: ${data.id}`)
  return data as JobRow
}

/**
 * Deletes a job record from Supabase and cleans up all related records
 * (applications, requirement_interactions, llm_analysis, tailored_resumes, scores).
 */
export async function deleteJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // 1. Applications
    const { error: appError } = await supabase.from('applications').delete().eq('job_id', jobId)
    if (appError) {
      Logger.warn('jobsUtils.ts', 'deleteJob', 'Applications cleanup warning', appError)
    }

    // 2. Requirement interactions & LLM analysis
    try {
      const { data: analyses } = await supabase
        .from('llm_analysis')
        .select('id')
        .eq('job_id', jobId)

      if (analyses && analyses.length > 0) {
        const analysisIds = analyses.map((a) => a.id)
        await supabase
          .from('requirement_interactions')
          .delete()
          .in('llm_analysis_id', analysisIds)
      }
      await supabase.from('llm_analysis').delete().eq('job_id', jobId)
    } catch (llmErr) {
      Logger.warn('jobsUtils.ts', 'deleteJob', 'LLM analysis cleanup warning', llmErr)
    }

    // 3. Tailored resumes
    const { error: tailoredError } = await supabase
      .from('tailored_resumes')
      .delete()
      .eq('job_id', jobId)
    if (tailoredError) {
      Logger.warn('jobsUtils.ts', 'deleteJob', 'Tailored resumes cleanup warning', tailoredError)
    }

    // 4. Scores
    const { error: scoreError } = await supabase.from('scores').delete().eq('job_id', jobId)
    if (scoreError) {
      Logger.warn('jobsUtils.ts', 'deleteJob', 'Scores cleanup warning', scoreError)
    }

    // 5. Jobs table
    const { error: jobError } = await supabase.from('jobs').delete().eq('id', jobId)
    if (jobError) {
      Logger.error('jobsUtils.ts', 'deleteJob', 'Failed to delete job from jobs table', jobError)
      return { success: false, error: jobError }
    }

    Logger.info('jobsUtils.ts', 'deleteJob', `Successfully deleted job: ${jobId}`)
    return { success: true }
  } catch (err) {
    Logger.error('jobsUtils.ts', 'deleteJob', 'Unexpected exception deleting job', err)
    return { success: false, error: err }
  }
}
