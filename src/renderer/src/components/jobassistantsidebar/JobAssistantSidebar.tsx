import React, { useState } from 'react'
import { JobAssistantSidebarProps } from './types'
import { cleanJobText } from '../../utils/cleanJobText'
import { useAppStore } from '../../lib/zustandStore'
import { ResumeSelectDropdown } from './ResumeSelectDropdown'
import { MatchResumeTab } from './MatchResumeTab'
import { QuickFillTab } from './QuickFillTab'
import { LuX } from '@/components/icons'
import Logger from '@utils/logger'

export function JobAssistantSidebar({
  resumes,
  selectedResumeName,
  setSelectedResumeName,
  currentResumeForAssistant,
  copiedField,
  handleCopy,
  handleCopyAll,
  setSidebarCollapsed,
  userId,
  onMatchComplete,
  onViewFullAnalysis,
  width = 320,
  headerPlaceholder = 'Placeholder'
}: JobAssistantSidebarProps): React.JSX.Element {
  const {
    setLlmResult,
    AnalyzedJD,
    setAnalyzedJD,
    setScrapedJob,
    setCurrentLlmAnalysisId,
    setCurrentJobId,
    sidebarTab,
    setSidebarTab
  } = useAppStore()

  const [matching, setMatching] = useState(false)
  const [matchstatus, setMatchstatus] = useState('')
  const [copiedAllMatchData, setCopiedAllMatchData] = useState(false)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  const handleCopyAllMatchData = async (): Promise<void> => {
    const storeState = useAppStore.getState()
    const llmResult = storeState.llmResult
    if (!llmResult) return

    let text = `# Job Assistant Match & Fit Analysis\n\n`
    text += `**Overall Match Score**: ${llmResult.fitScore}%\n\n`

    if (llmResult.strongMatches?.length) {
      text += `## Strong Matches\n`
      llmResult.strongMatches.forEach((m) => {
        text += `- ${m}\n`
      })
      text += `\n`
    }

    if (llmResult.keyGaps?.length) {
      text += `## Key Gaps\n`
      llmResult.keyGaps.forEach((g) => {
        text += `- ${g}\n`
      })
      text += `\n`
    }

    if (llmResult.resumeImprovements?.length) {
      text += `## Recommended Improvements\n`
      llmResult.resumeImprovements.forEach((imp) => {
        text += `- ${imp}\n`
      })
      text += `\n`
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedAllMatchData(true)
      setTimeout(() => setCopiedAllMatchData(false), 2000)
    } catch (err) {
      Logger.error('JobAssistantSidebar.tsx', 'handleCopyAllMatchData', 'Copy failed', err)
    }
  }

  const handleMatchResume = async (): Promise<void> => {
    setLlmResult(null)
    setScrapedJob(null)
    setElapsedTime(0)
    setMatching(true)
    const redisKey = `jobmatch:status:${userId || 'default'}`

    const updateStatus = async (status: string) => {
      setMatchstatus(status)
      if (window.api?.redisSet) {
        try {
          await window.api.redisSet(redisKey, status)
        } catch (err) {
          Logger.error('JobAssistantSidebar.tsx', 'updateStatus', 'Failed to update status in Redis', err)
        }
      }
    }

    const startTime = Date.now()
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime) / 100) / 10)
    }, 100)

    await updateStatus('Extracting Job description...')

    // Listen to real-time LLM progress events streamed over IPC
    const removeProgressListener = window.api?.onLLMProgress?.((progress) => {
      Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', 'LLM PROGRESS EVENT IN RENDERER', progress)
      if (progress?.message) {
        setMatchstatus(progress.message)
      }
    })

    // Start polling status from Redis if redis is initialized
    let pollInterval: any = null
    if (window.api?.redisGet) {
      pollInterval = setInterval(async () => {
        try {
          const status = await window.api.redisGet(redisKey)
          if (status) {
            setMatchstatus(status)
          }
        } catch (err) {
          Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed to poll status from Redis', err)
        }
      }, 500)
    }

    try {
      const resumeData = currentResumeForAssistant?.uploadedData
      if (!resumeData) {
        await updateStatus('Please select a resume first.')
        removeProgressListener?.()
        if (pollInterval) clearInterval(pollInterval)
        clearInterval(timerInterval)
        setMatching(false)
        return
      }

      Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', 'Scraping job description...')
      await updateStatus('Scraping job description...')
      const pageText = await window.api.getActiveText()
      Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', 'Extracted pageText', pageText)

      const hasJobText =
        pageText &&
        (typeof pageText === 'object'
          ? Boolean(
              (pageText.aboutJob && pageText.aboutJob.trim().length > 0) ||
              (pageText.fullText && pageText.fullText.trim().length > 0) ||
              (pageText.jobTitle && pageText.jobTitle.trim().length > 0) ||
              (pageText.company && pageText.company.trim().length > 0)
            )
          : Boolean(typeof pageText === 'string' && pageText.trim().length > 0))

      if (!hasJobText) {
        Logger.warn('JobAssistantSidebar.tsx', 'handleMatchResume', 'No job data scraped from current active page. Aborting LLM analysis.')
        await updateStatus('No job posting detected on active page. Please open a job posting in the browser.')
        removeProgressListener?.()
        if (pollInterval) clearInterval(pollInterval)
        clearInterval(timerInterval)
        setMatching(false)
        return
      }

      if (pageText && typeof pageText === 'object') {
        setScrapedJob({
          company: pageText.company || null,
          logo: pageText.logo || null,
          jobTitle: pageText.jobTitle || null,
          aboutJob: pageText.aboutJob || null,
          aboutCompany: pageText.aboutCompany || null,
          fullText: pageText.fullText || ''
        })
      }
      await updateStatus('cleaning data...')
      const cleanedResumeData = cleanJobText(resumeData)
      Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', `Cleaned resume data length: ${cleanedResumeData?.length}`)
      await updateStatus('Initializing LLM...')
      let activeApiKey = ''
      let activeKeyRecord: any = null

      try {
        const { supabase } = await import('../../lib/supabase')
        const { getActiveKey } = await import('../../utils/apiUsageService')
        if (supabase) {
          activeKeyRecord = await getActiveKey(supabase, userId)
          if (activeKeyRecord && activeKeyRecord.encrypted_key) {
            activeApiKey = activeKeyRecord.encrypted_key
          }
        }
      } catch (err) {
        Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed resolving user API key', err)
      }

      // ── Persist scraped job to Supabase & check for cached analysis ─────
      let persistedJobId: string | null = null
      const resumeId = currentResumeForAssistant?.id || null

      try {
        const { supabase } = await import('../../lib/supabase')
        if (supabase && pageText && typeof pageText === 'object') {
          const { saveScrapedJob } = await import('../../supabase_utils/jobsUtils')
          const jobRecord = await saveScrapedJob(supabase, userId, {
            jobTitle: pageText.jobTitle || null,
            company: pageText.company || null,
            aboutJob: pageText.aboutJob || null,
            aboutCompany: pageText.aboutCompany || null,
            logo: pageText.logo || null
          })
          if (jobRecord) {
            persistedJobId = jobRecord.id
            setCurrentJobId(jobRecord.id)
          }

          // Check for cached LLM analysis (same resume + same job)
          if (persistedJobId && resumeId) {
            const { fetchLlmAnalysis } = await import('../../supabase_utils/llmAnalysis')
            const cachedAnalysis = await fetchLlmAnalysis(
              supabase,
              userId,
              persistedJobId,
              resumeId
            )
            if (cachedAnalysis) {
              Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', `[Cache Hit] Found existing LLM analysis: ${cachedAnalysis.id}`)
              const cachedReqs = cachedAnalysis.requirements as any[]
              if (cachedReqs && cachedReqs.length > 0) {
                const { analyzeSemanticResults } = await import(
                  '../../../../utils/semantic_analyzer'
                )
                const cachedPayload = analyzeSemanticResults(cachedReqs, pageText)
                setLlmResult(cachedPayload)
                setCurrentLlmAnalysisId(cachedAnalysis.id)
                const companyName = cachedPayload.executiveSummary?.company
                if (companyName) {
                  setAnalyzedJD(
                    AnalyzedJD.includes(companyName) ? AnalyzedJD : [...AnalyzedJD, companyName]
                  )
                }

                // Update score entry in `scores` table
                const fitScore =
                  cachedPayload.fitScore ?? cachedPayload.executiveSummary?.currentFitScore ?? 0
                const potentialScore =
                  cachedPayload.executiveSummary?.potentialFitScore ?? fitScore
                const { saveOrUpdateScore } = await import('../../supabase_utils/scoresUtils')
                await saveOrUpdateScore(
                  supabase,
                  userId,
                  persistedJobId,
                  resumeId,
                  fitScore,
                  potentialScore
                )

                onMatchComplete?.()
                return // Skip LLM call — use cached result
              }
            }
          }
        }
      } catch (persistErr) {
        Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed to persist job or check cache', persistErr)
      }

      const LLMResponse = await window.api.LLMResponse(
        'openai',
        cleanedResumeData,
        activeApiKey,
        pageText,
        userId
      )
      Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', 'LLMResponse', LLMResponse)

      if (LLMResponse && typeof LLMResponse === 'object') {
        setLlmResult(LLMResponse)
        const companyName = LLMResponse.executiveSummary?.company
        if (companyName) {
          setAnalyzedJD(
            AnalyzedJD.includes(companyName) ? AnalyzedJD : [...AnalyzedJD, companyName]
          )
        }

        // Save LLM analysis & Score result to Supabase
        try {
          const { supabase } = await import('../../lib/supabase')
          if (supabase && persistedJobId) {
            const { saveLlmAnalysis } = await import('../../supabase_utils/llmAnalysis')
            const requirements =
              LLMResponse.requirements || (LLMResponse as any)?.llmAnalysis?.requirements || []
            const analysisRow = await saveLlmAnalysis(
              supabase,
              userId,
              persistedJobId,
              requirements,
              resumeId
            )
            if (analysisRow) {
              setCurrentLlmAnalysisId(analysisRow.id)
              Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', `[Supabase] Saved LLM analysis: ${analysisRow.id}`)
            }

            if (resumeId) {
              const fitScore =
                LLMResponse.fitScore ?? LLMResponse.executiveSummary?.currentFitScore ?? 0
              const potentialScore = LLMResponse.executiveSummary?.potentialFitScore ?? fitScore
              const { saveOrUpdateScore } = await import('../../supabase_utils/scoresUtils')
              const scoreRow = await saveOrUpdateScore(
                supabase,
                userId,
                persistedJobId,
                resumeId,
                fitScore,
                potentialScore
              )
              if (scoreRow) {
                Logger.info('JobAssistantSidebar.tsx', 'handleMatchResume', `[Supabase] Saved Score: ${scoreRow.id}`)
              }
            }
          }
        } catch (saveErr) {
          Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed to save LLM analysis or score to Supabase', saveErr)
        }

        // Fire-and-forget usage tracking
        if (activeKeyRecord && LLMResponse.usage) {
          try {
            const { trackApiUsage } = await import('../../utils/trackUsage')
            trackApiUsage(userId, 'JOB_ANALYZE', {
              inputTokens: LLMResponse.usage.promptTokens || LLMResponse.usage.inputTokens || 0,
              outputTokens:
                LLMResponse.usage.completionTokens || LLMResponse.usage.outputTokens || 0,
              totalTokens: LLMResponse.usage.totalTokens || 0,
              model: LLMResponse.usage.model || 'gpt-4o-mini'
            }).catch((trackErr) => Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed to log job match usage', trackErr))
          } catch (importErr) {
            Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Failed importing trackApiUsage', importErr)
          }
        }

        onMatchComplete?.()
      }
    } catch (error) {
      Logger.error('JobAssistantSidebar.tsx', 'handleMatchResume', 'Error during LLM match', error)
      const errorMsg =
        'Analysis failed: ' + (error instanceof Error ? error.message : String(error))
      await updateStatus(errorMsg)
    } finally {
      clearInterval(timerInterval)
      removeProgressListener?.()
      if (pollInterval) clearInterval(pollInterval)
      setMatching(false)
    }
  }

  return (
    <aside
      className="bg-[var(--bg-sidebar)] text-[var(--text-main)] p-5 flex flex-col gap-5 border-l border-[var(--border-sidebar)] shrink-0 select-text h-screen max-h-screen overflow-hidden transition-colors duration-200"
      style={{ width: `${width}px` }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span>{headerPlaceholder}</span>
        </div>
        <button
          className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
          onClick={() => setSidebarCollapsed(true)}
          title="Collapse"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>

      {/* Select Resume Minimal Dropdown */}
      <ResumeSelectDropdown
        resumes={resumes}
        selectedResumeName={selectedResumeName}
        onSelectResume={setSelectedResumeName}
      />

      {/* Navigation Tabs Menu */}
      <div className="flex border-b border-neutral-900 text-xs font-bold gap-4 pb-0.5">
        <button
          type="button"
          onClick={() => setSidebarTab('match')}
          className={`pb-2 border-b-2 transition-all cursor-pointer ${
            sidebarTab === 'match'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Match Resume
        </button>
        <button
          type="button"
          onClick={() => setSidebarTab('quickfill')}
          className={`pb-2 border-b-2 transition-all cursor-pointer ${
            sidebarTab === 'quickfill'
              ? 'border-white text-white font-semibold'
              : 'border-transparent text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Quick Fill
        </button>
      </div>

      {/* Active Tab Content */}
      {sidebarTab === 'match' && (
        <MatchResumeTab
          matching={matching}
          matchstatus={matchstatus}
          elapsedTime={elapsedTime}
          handleMatchResume={handleMatchResume}
          handleCopyAllMatchData={handleCopyAllMatchData}
          copiedAllMatchData={copiedAllMatchData}
          onViewFullAnalysis={onViewFullAnalysis}
        />
      )}

      {sidebarTab === 'quickfill' && (
        <QuickFillTab
          currentResumeForAssistant={currentResumeForAssistant}
          copiedField={copiedField}
          handleCopy={handleCopy}
          handleCopyAll={handleCopyAll}
        />
      )}
    </aside>
  )
}
