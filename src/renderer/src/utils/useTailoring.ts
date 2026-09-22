import { useState, useEffect, useCallback, useRef } from 'react'
import { useAppStore, TailoringStatus, ResolutionQuestion } from '../lib/zustandStore'
import type { RequirementAnalysis } from '../../../utils/zodSchema'
import Logger from '@utils/logger'

/**
 * Format structured tailored resume data into clean text/markdown.
 * Kept here so the hook is self-contained; TailoredResumeViewer retains
 * its own copy for the export utilities that depend on it directly.
 */
function formatTailoredResumeToText(data: any): string {
  if (!data || typeof data !== 'object') return ''

  if (Array.isArray(data.sections)) {
    const lines: string[] = []
    const meta = data.metadata || {}
    if (meta.name) lines.push(meta.name.toUpperCase())

    const contactParts: string[] = []
    if (meta.email) contactParts.push(meta.email)
    if (meta.phone) contactParts.push(meta.phone)
    if (meta.location) contactParts.push(meta.location)
    if (meta.linkedin) contactParts.push(meta.linkedin)
    if (meta.github) contactParts.push(meta.github)
    if (meta.portfolio) contactParts.push(meta.portfolio)
    if (contactParts.length > 0) lines.push(contactParts.join(' • '))
    lines.push('')

    data.sections.forEach((sec: any) => {
      if (!sec) return
      if (sec.title) lines.push(sec.title.toUpperCase())
      if (Array.isArray(sec.elements)) {
        sec.elements.forEach((el: any) => {
          const content = typeof el === 'string' ? el : el?.content
          if (!content || typeof content !== 'string') return
          const isHeader =
            el.type === 'experience' ||
            el.type === 'education' ||
            el.type === 'project' ||
            el.type === 'heading' ||
            /(?:experience|project|education)_[0-9]+$/.test(el.id || '')
          if (isHeader) {
            lines.push('')
            lines.push(content)
          } else {
            lines.push(`• ${content}`)
          }
        })
      }
      lines.push('')
    })
    return lines.join('\n').trim()
  }

  const lines: string[] = []
  if (data.name) lines.push(data.name.toUpperCase())
  if (data.title) lines.push(data.title)
  if (data.contact) lines.push(data.contact)
  lines.push('')
  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(data.summary)
    lines.push('')
  }
  if (data.skills && Array.isArray(data.skills)) {
    lines.push('TECHNICAL SKILLS')
    data.skills.forEach((s: any) => lines.push(`• ${s.category}: ${s.items}`))
    lines.push('')
  }
  if (data.experience && Array.isArray(data.experience)) {
    lines.push('PROFESSIONAL EXPERIENCE')
    data.experience.forEach((exp: any) => {
      lines.push(`${exp.role} | ${exp.company} | ${exp.period}`)
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b: string) => lines.push(`• ${b}`))
      }
      lines.push('')
    })
  }
  if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
    lines.push('PROJECTS')
    data.projects.forEach((proj: any) => lines.push(`• ${proj.title}: ${proj.desc}`))
    lines.push('')
  }
  return lines.join('\n').trim()
}



function getUnresolvedRequirements(
  requirementList?: RequirementAnalysis[]
): string[] {
  if (!requirementList || requirementList.length === 0) return []
  
  const cannotFix = requirementList
    .filter((item) => item.recommendationType === 'CANNOT_FIX_WITH_REWRITE' || item.recommendationType === 'ADD_EVIDENCE_IF_TRUE')
    .map((item) => item.requirement)
  if (cannotFix.length > 0) return cannotFix

  const gaps = requirementList
    .filter(
      (item) =>
        item.match !== 'MATCHED' ||
        item.recommendationType === 'ADD_EVIDENCE_IF_TRUE'
    )
    .map((item) => item.requirement)
  if (gaps.length > 0) return gaps

  return requirementList.map((item) => item.requirement)
}

export interface TailoringHookReturn {
  handleUnResolvedRequirements: () => Promise<ResolutionQuestion[] | string[]>
  handleTailoring: (customRequirementContext?: Record<string, string>, skipResolution?: boolean) => Promise<void>
  handleReset: () => void
  isProcessing: boolean
  isGeneratingQuestions: boolean
  apiKeyError: string | null
  clearApiKeyError: () => void
  redisSynced: boolean
  currentStepLabel: string
  tailoringProgress: number
}

/**
 * Shared hook for all resume tailoring orchestration.
 *
 * Pass `ownsLifecycle = true` to exactly ONE instance (TailoredResumeViewer).
 * That instance owns the mount-reset and Redis polling effects.
 * The Quick Fit card passes no argument (defaults to false) and simply
 * calls handleTailoring — all state updates flow through Zustand.
 */
export function useTailoring(ownsLifecycle = false): TailoringHookReturn {
  const {
    tailoringStatus,
    tailoringProgress,
    setTailoringStatus,
    setTailoringProgress,
    resetTailoringState,
    llmResult,
    currentResume,
    resumes,
    selectedResumeName,
    userId,
    setTailoredResume,
    setTailoredResumeText,
    currentJob,
    isGeneratingQuestions,
    setResolutionQuestions,
    setIsGeneratingQuestions,
    currentLlmAnalysisId
  } = useAppStore()

  const [redisSynced, setRedisSynced] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)

  const statusSteps: { id: TailoringStatus; label: string }[] = [
    { id: 'idle', label: 'Idle / Ready' },
    { id: 'resolving_requirements', label: 'Resolving Requirements' },
    { id: 'analyzing', label: 'Analyzing JD Requirements' },
    { id: 'rewriting', label: 'Re-engineering Experience' },
    { id: 'keywords', label: 'Injecting Target ATS Terms' },
    { id: 'formatting', label: 'Finalizing Layout & Styling' },
    { id: 'completed', label: 'Tailoring Complete' }
  ]

  const currentStepLabel =
    statusSteps.find((s) => s.id === tailoringStatus)?.label ?? 'Idle / Ready'

  // ── Redis helpers ──────────────────────────────────────────────────────────

  const syncToRedis = useCallback(async (status: TailoringStatus, progress: number) => {
    if (window.api && window.api.redisSet) {
      try {
        await window.api.redisSet('tailoring:state:default', {
          status,
          progress,
          updatedAt: new Date().toISOString()
        })
        await window.api.redisSet('tailoring:status', status)
        await window.api.redisSet('tailoring:progress', progress)
        setRedisSynced(true)
      } catch (err) {
        Logger.warn('useTailoring.ts', 'syncToRedis', 'Redis set error', err)
        setRedisSynced(false)
      }
    }
  }, [])

  // ── Lifecycle: mount-reset & Redis polling (lifecycle owner only) ──────────

  const tailoringStatusRef = useRef<TailoringStatus>(tailoringStatus)
  const tailoringProgressRef = useRef<number>(tailoringProgress)

  useEffect(() => {
    tailoringStatusRef.current = tailoringStatus
    tailoringProgressRef.current = tailoringProgress
  }, [tailoringStatus, tailoringProgress])

  useEffect(() => {
    if (!ownsLifecycle) return
    resetTailoringState()
    syncToRedis('idle', 0)
    return () => {
      resetTailoringState()
      syncToRedis('idle', 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownsLifecycle])

  useEffect(() => {
    if (!ownsLifecycle) return
    let isMounted = true
    const checkRedis = async (): Promise<void> => {
      if (tailoringStatusRef.current !== 'idle') {
        setRedisSynced(true)
        return
      }
      if (window.api && window.api.redisGet) {
        try {
          const cached = await window.api.redisGet('tailoring:state:default')
          if (cached && typeof cached === 'object' && cached.status && isMounted) {
            setRedisSynced(true)
            if (
              cached.status !== tailoringStatusRef.current ||
              cached.progress !== tailoringProgressRef.current
            ) {
              setTailoringStatus(cached.status as TailoringStatus)
              setTailoringProgress(cached.progress)
            }
          } else {
            const redisStatus = await window.api.redisGet('tailoring:status')
            const redisProgress = await window.api.redisGet('tailoring:progress')
            if (redisStatus && isMounted) {
              setRedisSynced(true)
              if (redisStatus !== tailoringStatusRef.current) {
                setTailoringStatus(redisStatus as TailoringStatus)
              }
              if (
                redisProgress !== undefined &&
                redisProgress !== tailoringProgressRef.current
              ) {
                setTailoringProgress(Number(redisProgress))
              }
            }
          }
        } catch (err) {
          if (isMounted) setRedisSynced(false)
        }
      }
    }
    checkRedis()
    const interval = setInterval(checkRedis, 3000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [ownsLifecycle, setTailoringStatus, setTailoringProgress])

  // ── Core tailoring action ─────────────────────────────────────────────────

  const handleTailoring = async (
    customRequirementContext?: Record<string, string>,
    skipResolution = false
  ): Promise<void> => {
    setApiKeyError(null)
    setTailoringStatus('analyzing')
    setTailoringProgress(15)
    syncToRedis('analyzing', 15)
    Logger.info('useTailoring.ts', 'handleTailoring', 'Starting resume tailoring', { llmResult, skipResolution })

    try {
      // 1. Get active resume
      const activeResume =
        currentResume ||
        resumes.find((r) => r.name === selectedResumeName) ||
        resumes[0]

      if (!activeResume) {
        setApiKeyError('No resume found. Please select or upload a resume first.')
        return
      }

      // 2. Load structured resume strictly from storage/resumes/ — DO NOT pass raw resume text
      let structuredResumeObj: any = null

      // A. Try loading from storage/resumes/${activeResume.id}.json
      if (activeResume.id && window.api?.getParsedResume) {
        try {
          const stored = await window.api.getParsedResume(activeResume.id)
          if (stored && typeof stored === 'object') {
            structuredResumeObj = stored
            Logger.info('useTailoring.ts', 'handleTailoring', `Retrieved structured resume from storage/resumes/${activeResume.id}.json`)
          }
        } catch (storageErr) {
          Logger.warn('useTailoring.ts', 'handleTailoring', 'Could not read structured resume from storage', storageErr)
        }
      }

      // B. If not in storage file yet, check if structuredData exists on resume object (e.g. from Supabase) and persist to storage
      if (!structuredResumeObj && activeResume.structuredData && typeof activeResume.structuredData === 'object') {
        structuredResumeObj = activeResume.structuredData
        if (activeResume.id && window.api?.saveParsedResume) {
          try {
            await window.api.saveParsedResume(activeResume.id, structuredResumeObj)
            Logger.info('useTailoring.ts', 'handleTailoring', `Persisted structured resume to storage/resumes/${activeResume.id}.json`)
          } catch (saveErr) {
            Logger.warn('useTailoring.ts', 'handleTailoring', 'Failed saving structured resume to storage', saveErr)
          }
        }
      }

      // C. Fallback: check if any other structured resume files exist in storage/resumes/
      if (!structuredResumeObj && window.api?.listParsedResumes) {
        try {
          const availableFiles = await window.api.listParsedResumes()
          if (availableFiles && availableFiles.length > 0) {
            const firstId = availableFiles[0].replace(/\.json$/, '')
            const fallbackStructured = await window.api.getParsedResume(firstId)
            if (fallbackStructured && typeof fallbackStructured === 'object') {
              structuredResumeObj = fallbackStructured
              Logger.info('useTailoring.ts', 'handleTailoring', `Using structured resume found in storage/resumes/${firstId}.json`)
            }
          }
        } catch (listErr) {
          Logger.warn('useTailoring.ts', 'handleTailoring', 'Error listing storage/resumes files', listErr)
        }
      }

      // D. If not found in storage, but raw resume text exists, parse and persist to storage/resumes
      if (!structuredResumeObj) {
        const rawText = activeResume.rawResumeData || activeResume.uploadedData
        if (rawText && activeResume.id) {
          try {
            Logger.info('useTailoring.ts', 'handleTailoring', 'Parsing resume on-the-fly to create storage/resumes entry...')
            const { ResumeStructuredParser } = await import('./ResumeStructuredParser')
            const { supabase } = await import('../lib/supabase')
            const { getActiveKey } = await import('./apiUsageService')
            if (supabase && userId) {
              const keyRec = await getActiveKey(supabase, userId)
              const parsedOutput = await ResumeStructuredParser.parseAndSave(
                supabase,
                userId,
                activeResume.id,
                rawText,
                keyRec?.encrypted_key
              )
              if (parsedOutput) {
                structuredResumeObj = parsedOutput
                Logger.info('useTailoring.ts', 'handleTailoring', `Successfully parsed and saved resume to storage/resumes/${activeResume.id}.json`)
              }
            }
          } catch (parseErr) {
            Logger.error('useTailoring.ts', 'handleTailoring', 'Failed to parse resume into structured format', parseErr)
          }
        }
      }

      // STRICT CHECK: Raw resume text is NEVER passed to the tailoring pipeline
      if (!structuredResumeObj) {
        setApiKeyError(
          'Structured resume data not found in storage/resumes. Please ensure the resume is parsed into structured format first (raw resumes cannot be tailored).'
        )
        return
      }

      const cleanedResumeData = JSON.stringify(structuredResumeObj, null, 2)

      // 3. Resolve BYOK OpenAI key
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
        Logger.error('useTailoring.ts', 'handleTailoring', 'Failed resolving user API key from Supabase', err)
      }

      if (!activeApiKey) {
        setApiKeyError(
          'No active OpenAI API key found. Please connect your API key in Settings / API Usage to proceed.'
        )
        return
      }

      // 4. Determine tailoring target data
      let dataToTailor: any =
        (llmResult as any)?.llmAnalysis?.requirements ||
        (llmResult as any)?.requirements ||
        currentJob?.parsed_data?.required_skills ||
        currentJob?.description ||
        llmResult ||
        {}

      // Inject candidate-provided evidence for resolved requirements if present
      let resolvedContext =
        customRequirementContext ||
        useAppStore.getState().resolvedRequirementsData ||
        undefined

      // Fallback: if no context provided and not skipping, fetch saved interactions from Supabase
      if (!skipResolution && (!resolvedContext || Object.keys(resolvedContext).length === 0) && currentLlmAnalysisId) {
        try {
          const { supabase } = await import('../lib/supabase')
          if (supabase) {
            const { fetchRequirementInteractions, interactionsToResolvedContext } =
              await import('../supabase_utils/requirementInteractions')
            const savedInteractions = await fetchRequirementInteractions(supabase, currentLlmAnalysisId)
            if (savedInteractions.length > 0) {
              resolvedContext = interactionsToResolvedContext(savedInteractions)
              Logger.info('useTailoring.ts', 'handleTailoring', 'Loaded saved interactions as resolved context', { count: Object.keys(resolvedContext).length })
            }
          }
        } catch (fetchErr) {
          Logger.error('useTailoring.ts', 'handleTailoring', 'Failed to fetch saved interactions for tailoring', fetchErr)
        }
      }

      if (resolvedContext && Object.keys(resolvedContext).length > 0) {
        if (typeof dataToTailor === 'object' && !Array.isArray(dataToTailor)) {
          dataToTailor = {
            ...dataToTailor,
            candidateProvidedEvidence: resolvedContext
          }
        } else {
          dataToTailor = {
            requirements: dataToTailor,
            candidateProvidedEvidence: resolvedContext
          }
        }
      }

      // 5. Start progress
      setTailoringStatus('analyzing')
      setTailoringProgress(25)
      syncToRedis('analyzing', 25)

      // 6. IPC progress listener
      const removeProgressListener = window.api.onLLMProgress?.((progress: any) => {
        Logger.info('useTailoring.ts', 'handleTailoring', 'Tailoring progress event in renderer', progress)
        if (progress?.status === 'started') {
          setTailoringStatus('rewriting')
          setTailoringProgress(55)
          syncToRedis('rewriting', 55)
        } else if (progress?.status === 'completed') {
          setTailoringStatus('keywords')
          setTailoringProgress(80)
          syncToRedis('keywords', 80)
        }
      })

      // 7. Invoke IPC
      Logger.info('useTailoring.ts', 'handleTailoring', 'INVOKING LLM TAILORING', {
        resumeDataLength: cleanedResumeData.length,
        dataToTailor,
        resolvedContext
      })

      const resolvedRequirementsPayload = resolvedContext
        ? (typeof resolvedContext === 'string' ? resolvedContext : JSON.stringify(resolvedContext, null, 2))
        : ''

      const tailoredResult = await window.api.LLMResumeTailoring(
        'openai',
        cleanedResumeData,
        activeApiKey,
        typeof dataToTailor === 'string' ? dataToTailor : JSON.stringify(dataToTailor),
        resolvedRequirementsPayload,
        userId || undefined,
        activeResume.id || undefined
      )

      removeProgressListener?.()
      Logger.info('useTailoring.ts', 'handleTailoring', 'TAILORED RESULT RECEIVED', tailoredResult)

      if (tailoredResult) {
        const { usage, tailoredResume: editedDoc, ...cleanResumeData } = tailoredResult
        const finalTailoredDoc = {
          ...(editedDoc || cleanResumeData),
          edits: tailoredResult.edits || (cleanResumeData as any)?.edits || (editedDoc as any)?.edits || []
        }
        setTailoredResume(finalTailoredDoc)

        // Sync to current active resume in store while preserving the pristine original base resume in originalStructuredData
        if (activeResume && activeResume.id) {
          const originalData =
            (activeResume as any).originalStructuredData ||
            activeResume.structuredData ||
            structuredResumeObj
          useAppStore.getState().setCurrentResume({
            ...activeResume,
            originalStructuredData: originalData,
            structuredData: finalTailoredDoc
          })
        }

        const formattedText = formatTailoredResumeToText(finalTailoredDoc)
        if (formattedText) setTailoredResumeText(formattedText)

        setTailoringStatus('completed')
        setTailoringProgress(100)
        syncToRedis('completed', 100)

        // Track API usage
        if (activeKeyRecord && usage) {
            try {
            const { trackApiUsage } = await import('./trackUsage')
            trackApiUsage(userId || '', 'RESUME_TAILOR', {
              inputTokens:
                usage.inputTokens || usage.promptTokens || 0,
              outputTokens:
                usage.outputTokens || usage.completionTokens || 0,
              totalTokens: usage.totalTokens || 0,
              model: usage.model || 'gpt-4o-mini'
            }).catch((trackErr: any) =>
              Logger.error('useTailoring.ts', 'handleTailoring', 'Failed to log resume tailoring usage', trackErr)
            )
          } catch (importErr) {
            Logger.error('useTailoring.ts', 'handleTailoring', 'Failed importing trackApiUsage', importErr)
          }
        }

        // Save tailored analysis to llm_analysis table
        const currentJobId = useAppStore.getState().currentJobId
        if (currentJobId && userId) {
          try {
            const { supabase } = await import('../lib/supabase')
            if (supabase) {
              const { saveLlmAnalysis } = await import('../supabase_utils/llmAnalysis')
              // Extract requirements from the tailored result if available
              const tailorRequirements =
                (cleanResumeData as any)?.requirements ||
                (llmResult as any)?.requirements ||
                (llmResult as any)?.llmAnalysis?.requirements ||
                []
              const resumeId =
                currentResume?.id ||
                resumes.find((r) => r.name === selectedResumeName)?.id ||
                null
              await saveLlmAnalysis(
                supabase,
                userId,
                currentJobId,
                tailorRequirements,
                resumeId,
                null // tailorResumeId not available at this point — will be linked when resume is saved
              )
              Logger.info('useTailoring.ts', 'handleTailoring', '[Supabase] Saved tailored LLM analysis')
            }
          } catch (saveErr) {
            Logger.error('useTailoring.ts', 'handleTailoring', 'Failed to save tailored LLM analysis', saveErr)
          }
        }
      } else {
        setTailoringStatus('idle')
        setTailoringProgress(0)
        syncToRedis('idle', 0)
        setApiKeyError('Tailoring returned empty result. Please try again.')
      }
    } catch (error: any) {
      Logger.error('useTailoring.ts', 'handleTailoring', 'Error tailoring resume', error)
      setTailoringStatus('idle')
      setTailoringProgress(0)
      syncToRedis('idle', 0)
      setApiKeyError(error?.message || 'Error occurred during AI tailoring.')
    }
  }

  const handleReset = (): void => {
    resetTailoringState()
    syncToRedis('idle', 0)
    setApiKeyError(null)
  }

  const isProcessing =
    tailoringStatus === 'analyzing' ||
    tailoringStatus === 'rewriting' ||
    tailoringStatus === 'keywords' ||
    tailoringStatus === 'formatting'

  const handleUnResolvedRequirements = async (): Promise<ResolutionQuestion[] | string[]> => {
    // Guard: prevent concurrent calls across all hook instances
    if (useAppStore.getState().isGeneratingQuestions) {
      Logger.warn('useTailoring.ts', 'handleUnResolvedRequirements', 'Question generation already in progress, skipping duplicate call')
      return []
    }
    setIsGeneratingQuestions(true)

    const reqs =
      llmResult?.requirements ||
      (llmResult as any)?.llmAnalysis?.requirements ||
      []
    const unResolved = getUnresolvedRequirements(reqs)
    setTailoringStatus('resolving_requirements')
    syncToRedis('resolving_requirements', 10)

    // Resolve active OpenAI key if available
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
      Logger.error('useTailoring.ts', 'handleUnResolvedRequirements', 'Failed resolving user API key from Supabase for questions', err)
    }

    try {
      if (unResolved.length > 0 && activeApiKey && window.api?.resolvingRequirements) {
        const result = await window.api.resolvingRequirements(
          unResolved,
          activeApiKey,
          userId || undefined
        )

        // Guard: if user clicked "Skip all & Tailor" or started tailoring while questions were being generated, ignore result
        if (useAppStore.getState().tailoringStatus !== 'resolving_requirements') {
          Logger.info('useTailoring.ts', 'handleUnResolvedRequirements', 'Tailoring already started, ignoring generated questions')
          return []
        }

        if (result?.questions && Array.isArray(result.questions) && result.questions.length > 0) {
          setResolutionQuestions(result.questions)

          // Track API usage for question generation
          if (activeKeyRecord && result.usage && userId) {
            try {
              const { trackApiUsage } = await import('./trackUsage')
              trackApiUsage(userId, 'RESUME_TAILOR', {
                inputTokens: result.usage.inputTokens || 0,
                outputTokens: result.usage.outputTokens || 0,
                totalTokens: result.usage.totalTokens || 0,
                model: result.usage.model || 'gpt-4o-mini'
              }).catch((trackErr: any) =>
                Logger.error('useTailoring.ts', 'handleUnResolvedRequirements', 'Failed to log requirement resolution usage', trackErr)
              )
            } catch (importErr) {
              Logger.error('useTailoring.ts', 'handleUnResolvedRequirements', 'Failed importing trackApiUsage for requirement resolution', importErr)
            }
          }

          return result.questions
        }
      }

      // Fallback questions derived from unresolved requirements
      if (unResolved.length > 0) {
        const fallbackQuestions: ResolutionQuestion[] = unResolved.map((req) => ({
          requirement: req,
          question: `Do you have professional experience with: ${req}?`,
          step1Type: 'YES_NO' as const,
          options: ['Yes', 'No'],
          followUp: `Please provide brief context or project details where you used ${req}.`
        }))
        setResolutionQuestions(fallbackQuestions)
        return fallbackQuestions
      }

      // When no unresolved requirements exist
      setResolutionQuestions([])
      return []
    } catch (err: any) {
      Logger.error('useTailoring.ts', 'handleUnResolvedRequirements', 'Error generating resolution questions', err)
      setResolutionQuestions([])
      return []
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  return {
    handleUnResolvedRequirements,
    handleTailoring,
    handleReset,
    isProcessing,
    isGeneratingQuestions,
    apiKeyError,
    clearApiKeyError: () => setApiKeyError(null),
    redisSynced,
    currentStepLabel,
    tailoringProgress
  }
}
