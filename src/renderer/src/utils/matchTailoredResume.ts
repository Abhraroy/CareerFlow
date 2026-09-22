import { cleanJobText } from './cleanJobText'
import type { LLMAnalysisOutput } from '../../../utils/zodSchema'
import type { ScrapedJobData } from '../lib/zustandStore'
import Logger from '@utils/logger'

export interface MatchTailoredResumeParams {
  tailoredResumeText: string
  scrapedJob: ScrapedJobData | null
  currentJobDescription?: string
  userId?: string | null
  onStatusUpdate?: (status: string) => void
}

/**
 * Executes deep LLM match analysis using the tailored resume and the job description stored in Zustand / active portal.
 */
export async function matchTailoredResume({
  tailoredResumeText,
  scrapedJob,
  currentJobDescription,
  userId,
  onStatusUpdate
}: MatchTailoredResumeParams): Promise<LLMAnalysisOutput> {
  // 1. Validate tailored resume text
  const cleanedResume = cleanJobText(tailoredResumeText || '')
  if (!cleanedResume || cleanedResume.trim().length === 0) {
    throw new Error('No tailored resume content found to analyze. Please ensure the tailored resume is generated.')
  }

  // 2. Resolve job description data (Zustand scrapedJob -> portal activeText -> currentJobDescription fallback)
  let jobData: any = null
  if (scrapedJob && (scrapedJob.fullText || scrapedJob.aboutJob || scrapedJob.jobTitle)) {
    jobData = scrapedJob
  } else {
    onStatusUpdate?.('Extracting job description...')
    try {
      const activeText = await window.api.getActiveText()
      if (activeText && (typeof activeText === 'string' || typeof activeText === 'object')) {
        jobData = activeText
      }
    } catch (err) {
      Logger.warn('matchTailoredResume.ts', 'matchTailoredResume', 'Could not extract active page text', err)
    }
  }

  if (!jobData && currentJobDescription) {
    jobData = currentJobDescription
  }

  if (!jobData) {
    throw new Error('No job description found in Zustand or active portal. Please select or load a job description.')
  }

  // 3. Resolve active OpenAI API key
  onStatusUpdate?.('Initializing AI engine...')
  let activeApiKey = ''
  let activeKeyRecord: any = null

  try {
    const { supabase } = await import('../lib/supabase')
    const { getActiveKey } = await import('./apiUsageService')
    if (supabase && userId) {
      activeKeyRecord = await getActiveKey(supabase, userId)
      if (activeKeyRecord?.encrypted_key) {
        activeApiKey = activeKeyRecord.encrypted_key
      }
    }
  } catch (err) {
    Logger.error('matchTailoredResume.ts', 'matchTailoredResume', 'Failed resolving user API key', err)
  }

  onStatusUpdate?.('Analyzing tailored resume fit against job description...')

  // Listen for LLM progress updates
  const removeProgressListener = window.api.onLLMProgress?.((progress) => {
    if (progress?.message) {
      onStatusUpdate?.(progress.message)
    }
  })

  try {
    const LLMResponse = await window.api.LLMResponse(
      'openai',
      cleanedResume,
      activeApiKey,
      jobData,
      userId || undefined
    )

    if (!LLMResponse || typeof LLMResponse !== 'object') {
      throw new Error('AI match analysis returned an invalid response.')
    }

    // Fire-and-forget API usage tracking
    if (activeKeyRecord && LLMResponse.usage && userId) {
      try {
        const { trackApiUsage } = await import('./trackUsage')
        trackApiUsage(userId, 'JOB_ANALYZE', {
          inputTokens: LLMResponse.usage.promptTokens || LLMResponse.usage.inputTokens || 0,
          outputTokens: LLMResponse.usage.completionTokens || LLMResponse.usage.outputTokens || 0,
          totalTokens: LLMResponse.usage.totalTokens || 0,
          model: LLMResponse.usage.model || 'gpt-4o-mini'
        }).catch((trackErr) => Logger.error('matchTailoredResume.ts', 'matchTailoredResume', 'Failed to log tailored match usage', trackErr))
      } catch (importErr) {
        Logger.error('matchTailoredResume.ts', 'matchTailoredResume', 'Failed importing trackApiUsage', importErr)
      }
    }

    return LLMResponse as LLMAnalysisOutput
  } finally {
    removeProgressListener?.()
  }
}
