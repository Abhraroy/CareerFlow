import { useState, useEffect } from 'react'
import { Resume } from '@/types'
import { supabase } from '@/lib/supabase'
import { cosineSimilarity } from '@/utils/math'
import Logger from '@utils/logger'
import {
  runTailoringPipeline,
  generateTailoringQuestions,
  TailoringResult,
  TailoringQuestion,
  UserContextAnswer
} from '@/utils/tailorEngine'
import { callOpenAIChat, callOpenAIEmbed, getActiveKey } from '@/utils/apiUsageService'
import { useAppStore } from '@/lib/zustandStore'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'
import { analyzeSemanticResults } from '../../../../../utils/semantic_analyzer'
import { useNavigation } from '@/navigation/useNavigation'
import {
  JobMatchDetailViewProps,
  DetailTab,
  TailoringFlowState,
  TailoringStageInfo,
  ComparisonMatch
} from './types'

/**
 * Custom hook encapsulating state, data derivation, and async actions
 * for the Job Match Detail View.
 */
export function useJobMatchDetail({
  match,
  resumes,
  userId,
  onRefreshMatches,
  onResumeAdded
}: JobMatchDetailViewProps) {
  const storeLlmResult = useAppStore((state) => state.llmResult)
  const resetTailoringState = useAppStore((s) => s.resetTailoringState)
  const navigate = useNavigation()

  // Reset tailoring state on match mount/change
  useEffect(() => {
    resetTailoringState()
  }, [match.id, resetTailoringState])

  // Dynamic LLM Analysis Output populated from the new semantic analyzer pipeline
  const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysisOutput | null>(storeLlmResult || null)

  useEffect(() => {
    async function fetchAndAnalyze() {
      if (!match?.job_id || !match?.resume_id || !supabase) return

      const { data, error } = await supabase
        .from('llm_analysis')
        .select('requirements')
        .eq('job_id', match.job_id)
        .eq('resume_id', match.resume_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data?.requirements) {
        try {
          const requirements = typeof data.requirements === 'string' ? JSON.parse(data.requirements) : data.requirements
          const semanticResult = analyzeSemanticResults(requirements, match.jobs)
          setLlmAnalysis(semanticResult)
        } catch (err) {
          Logger.error('useJobMatchDetail.ts', 'fetchAndAnalyze', 'Failed to parse requirements or run semantic analyzer', err)
        }
      }
    }
    fetchAndAnalyze()
  }, [match.job_id, match.resume_id, match.jobs])

  // UI tabs & copy states
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false)
  const [copiedDescription, setCopiedDescription] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  // Contextual HITL tailoring flow
  const [tailoringFlow, setTailoringFlow] = useState<TailoringFlowState>('idle')
  const [contextQuestions, setContextQuestions] = useState<TailoringQuestion[]>([])
  const [contextAnswers, setContextAnswers] = useState<Record<string, string>>({})

  // Tailoring pipeline execution state
  const [tailoring, setTailoring] = useState(false)
  const [tailoredResult, setTailoredResult] = useState<TailoringResult | null>(null)
  const [tailoringStages, setTailoringStages] = useState<Record<string, TailoringStageInfo>>({
    prioritize: { status: 'pending' },
    retrieve: { status: 'pending' },
    strategy: { status: 'pending' },
    rewrite: { status: 'pending' },
    validate: { status: 'pending' },
    ats: { status: 'pending' }
  })
  const [comparisonMatch, setComparisonMatch] = useState<ComparisonMatch | null>(null)

  // Derived metrics
  const legacyRequirements = llmAnalysis?.requirements || []
  const currentFitScore = llmAnalysis?.fitScore ?? match.fit_score ?? 0
  const potentialFitScore = llmAnalysis?.executiveSummary?.potentialFitScore ?? currentFitScore

  const coverLetter = match.jobs?.parsed_data?.coverLetter || ''

  const verdictDecision =
    currentFitScore >= 85
      ? 'Strongly Recommended to Apply'
      : currentFitScore >= 70
        ? 'Recommended to Apply'
        : currentFitScore >= 55
          ? 'Apply After Targeted Resume Improvements'
          : currentFitScore >= 40
            ? 'Stretch Opportunity'
            : 'Low Match'

  const rationale = llmAnalysis?.scoreExplanation || ''
  const legacyResumeImprovements = llmAnalysis?.resumeImprovements || []
  const warnings: string[] = []

  /**
   * Evaluates the newly generated tailored resume against the target job requirements,
   * generates section embeddings, computes similarity and saves a new job match record.
   */
  const handleMatchTailoredResume = async (
    tailoredResume: Resume,
    tailoringRes: TailoringResult
  ): Promise<void> => {
    if (!supabase || !match.job_id) return
    try {
      // 1. Fetch Job Requirements from DB
      const { data: requirementsDb, error: reqsErr } = await supabase
        .from('job_requirements')
        .select('*')
        .eq('job_id', match.job_id)

      if (reqsErr || !requirementsDb) {
        Logger.error('useJobMatchDetail.ts', 'handleMatchTailoredResume', 'Error fetching requirements for tailored match', reqsErr)
        return
      }

      // 2. Fetch/Prepare Resume Section Embeddings
      const insertData: any[] = []
      const resumeEvidences: { section_type: string; content: string; embedding: number[] }[] = []

      const queueSegment = async (type: string, content: string): Promise<void> => {
        if (!content || content.trim().length === 0) return
        try {
          const emb = await callOpenAIEmbed(supabase!, userId, 'RESUME_EMBED', content)
          resumeEvidences.push({ section_type: type, content, embedding: emb })
          insertData.push({
            resume_id: tailoredResume.id,
            section_type: type,
            content,
            embedding: emb
          })
        } catch (err) {
          Logger.error('useJobMatchDetail.ts', 'queueSegment', `Embedding failed for tailored section ${type}`, err)
        }
      }

      if (tailoringRes.tailoredResumeData.summary) {
        await queueSegment('summary', tailoringRes.tailoredResumeData.summary)
      }
      if (tailoringRes.tailoredResumeData.skills) {
        await queueSegment('skills', tailoringRes.tailoredResumeData.skills)
      }

      const parseAndQueueArray = async (items: any[], type: string): Promise<void> => {
        for (const item of items) {
          let text = ''
          if (type === 'experience') {
            text = `${item.role || ''} at ${item.company || ''} (${item.duration || ''}): ${item.description || ''}`
          } else if (type === 'projects') {
            text = `${item.title || ''} (${item.technologies || ''}): ${item.description || ''}`
          } else {
            text = `${item.degree || ''} from ${item.institution || ''} (${item.duration || ''}) - Grade: ${item.grade || ''}`
          }
          await queueSegment(type, text)
        }
      }

      if (Array.isArray(tailoringRes.tailoredResumeData.experience)) {
        await parseAndQueueArray(tailoringRes.tailoredResumeData.experience, 'experience')
      }
      if (Array.isArray(tailoringRes.tailoredResumeData.projects)) {
        await parseAndQueueArray(tailoringRes.tailoredResumeData.projects, 'projects')
      }
      if (Array.isArray(tailoringRes.tailoredResumeData.education)) {
        await parseAndQueueArray(tailoringRes.tailoredResumeData.education, 'education')
      }

      if (insertData.length > 0) {
        await supabase.from('resume_evidence').insert(insertData)
      }

      // 3. Compute Cosine Similarity
      const validationRequirements = requirementsDb.map((req) => {
        const sectionsWithSim = resumeEvidences.map((ev) => ({
          content: ev.content,
          section_type: ev.section_type,
          sim: cosineSimilarity(req.embedding as unknown as number[], ev.embedding)
        }))
        sectionsWithSim.sort((a, b) => b.sim - a.sim)
        const topSections = sectionsWithSim.slice(0, 2)
        const contextStr = topSections.map((s) => `[${s.section_type}] ${s.content}`).join('\n')

        return {
          text: req.requirement,
          type: req.type,
          evidenceContext: contextStr
        }
      })

      const reqsListStr = validationRequirements
        .map(
          (r, i) =>
            `Requirement #${i + 1}: "${r.text}"\nPotential Evidence:\n${r.evidenceContext}\n`
        )
        .join('\n')

      const candidateName =
        `${tailoredResume.profileDetails.firstName || ''} ${tailoredResume.profileDetails.lastName || ''}`.trim() ||
        'Candidate'
      const candidateContact = [
        tailoredResume.profileDetails.email ? `Email: ${tailoredResume.profileDetails.email}` : '',
        tailoredResume.profileDetails.phone ? `Phone: ${tailoredResume.profileDetails.phone}` : ''
      ]
        .filter(Boolean)
        .join('\n')

      const validationPrompt = `You are a recruitment engine. Inspect the potential evidence for each job requirement and determine if there is a MATCH, PARTIAL, or GAP. Provide a brief 1-sentence explanation for each.

Rules:
- If there is strong evidence in the resume for the requirement, classify it as MATCH.
- If there is partial/related evidence, classify it as PARTIAL.
- If there is NO evidence at all in the resume for this requirement, classify it as GAP.

Job Requirements & Candidate Evidence:
---
${reqsListStr}
---

Respond ONLY with a valid JSON object matching the following structure:
{
  "requirements": [
    {
      "text": "The exact requirement text from the list above",
      "status": "MATCH" | "PARTIAL" | "GAP",
      "evidence": "1-sentence explanation of evidence found, or explanation of gap"
    }
  ],
  "coverLetter": "Generate a tailored cover letter for this role. Sign off directly using: ${candidateName} ${candidateContact ? '\n' + candidateContact : ''}"
}`

      const systemPromptVal = 'You are a recruitment assistant. Output only raw JSON.'
      const validationStr = await callOpenAIChat(supabase!, userId, 'RESUME_MATCH', {
        text: validationPrompt,
        systemMessage: systemPromptVal,
        jsonMode: true
      })
      const validation = JSON.parse(validationStr)
      const validatedReqs: any[] = validation.requirements || []

      // 4. Calculate dynamic weighted score
      let requiredSkillMatchCount = 0
      let requiredSkillTotal = 0
      let preferredSkillMatchCount = 0
      let preferredSkillTotal = 0
      let responsibilityMatchCount = 0
      let responsibilityTotal = 0
      let experienceMatchCount = 0
      let experienceTotal = 0
      let otherMatchCount = 0
      let otherTotal = 0

      validatedReqs.forEach((vr) => {
        const matchingReq = requirementsDb.find((r) => r.requirement === vr.text)
        const type = matchingReq ? matchingReq.type : 'required_skill'

        let val = 0
        if (vr.status === 'MATCH') val = 1
        else if (vr.status === 'PARTIAL') val = 0.5

        if (type === 'required_skill') {
          requiredSkillMatchCount += val
          requiredSkillTotal++
        } else if (type === 'preferred_skill') {
          preferredSkillMatchCount += val
          preferredSkillTotal++
        } else if (type === 'responsibility') {
          responsibilityMatchCount += val
          responsibilityTotal++
        } else if (type === 'experience') {
          experienceMatchCount += val
          experienceTotal++
        } else {
          otherMatchCount += val
          otherTotal++
        }
      })

      const required_skill_score =
        requiredSkillTotal > 0 ? (requiredSkillMatchCount / requiredSkillTotal) * 100 : 100
      const preferred_skill_score =
        preferredSkillTotal > 0 ? (preferredSkillMatchCount / preferredSkillTotal) * 100 : 100
      const responsibility_score =
        responsibilityTotal > 0 ? (responsibilityMatchCount / responsibilityTotal) * 100 : 100
      const experience_score =
        experienceTotal > 0 ? (experienceMatchCount / experienceTotal) * 100 : 100
      const other_score = otherTotal > 0 ? (otherMatchCount / otherTotal) * 100 : 100

      let semantic_score = 75
      const { data: jobDb } = await supabase
        .from('jobs')
        .select('embedding')
        .eq('id', match.job_id)
        .single()
      const tailoredEmbedding = tailoredResume.embedding

      if (jobDb?.embedding && tailoredEmbedding) {
        const sim = cosineSimilarity(jobDb.embedding as unknown as number[], tailoredEmbedding)
        semantic_score = Math.min(100, Math.max(0, Math.round(((sim - 0.3) / 0.5) * 100)))
      }

      const final_score = Math.round(
        required_skill_score * 0.3 +
          experience_score * 0.2 +
          responsibility_score * 0.2 +
          semantic_score * 0.15 +
          preferred_skill_score * 0.1 +
          other_score * 0.05
      )

      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await supabase.from('scores').insert({
          job_id: match.job_id,
          resume_id: tailoredResume.id,
          user_id: userData.user.id,
          fit_score: final_score,
          potential_score: final_score
        })
      }

      setComparisonMatch({
        originalScore: match.score,
        tailoredScore: final_score
      })

      onRefreshMatches?.()
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleMatchTailoredResume', 'Failed to run match for tailored resume', err)
    }
  }

  /**
   * Executes the full AI Resume Tailoring pipeline with optional Human-In-The-Loop answers.
   */
  const handleTailorResume = async (userAnswers?: UserContextAnswer[]): Promise<void> => {
    const currentResume = resumes.find((r) => r.id === match.resume_id)
    if (!currentResume) {
      alert('Original resume not found.')
      return
    }

    setTailoring(true)
    setTailoringFlow('tailoring')
    setTailoredResult(null)
    setComparisonMatch(null)
    setTailoringStages({
      prioritize: { status: 'pending' },
      retrieve: { status: 'pending' },
      strategy: { status: 'pending' },
      rewrite: { status: 'pending' },
      validate: { status: 'pending' },
      ats: { status: 'pending' }
    })

    try {
      const matchResultObj = {
        matchScore: match.score,
        detailedRequirements: legacyRequirements,
        keyMatches: legacyRequirements
          .filter((r: any) => r.status === 'MATCH')
          .map((r: any) => r.text),
        keyGaps: legacyRequirements.filter((r: any) => r.status === 'GAP').map((r: any) => r.text)
      }

      const jobData = {
        title: match.jobs?.job_title || match.jobs?.title || '',
        company: match.jobs?.company_name || match.jobs?.company || '',
        description: match.jobs?.job_description || match.jobs?.description || ''
      }

      const activeKey = await getActiveKey(supabase!, userId)
      if (!activeKey) {
        throw new Error('No OpenAI API key connected. Go to API Usage to connect your key.')
      }

      const result = await runTailoringPipeline(
        currentResume,
        jobData,
        matchResultObj,
        activeKey.encrypted_key,
        userAnswers,
        (update) => {
          setTailoringStages((prev) => ({
            ...prev,
            [update.stage]: { status: update.status, message: update.message }
          }))
        }
      )

      setTailoredResult(result)

      if (supabase) {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (user) {
          const tailoredTextContent = `${result.tailoredResumeData.summary || ''}\n\nSkills:\n${result.tailoredResumeData.skills || ''}\n\nExperience:\n${(result.tailoredResumeData.experience || []).map((e) => `${e.role} at ${e.company}: ${e.description}`).join('\n')}`
          const tailoredEmbedding = await callOpenAIEmbed(
            supabase!,
            userId,
            'RESUME_TAILOR',
            tailoredTextContent
          )

          const { data: newResume, error: resumeErr } = await supabase
            .from('resumes')
            .insert({
              user_id: user.id,
              name: (() => {
                const tailoredCount = resumes.filter(
                  (r) => r.parentResumeId === currentResume.id
                ).length
                const nextNum = tailoredCount + 1
                const formattedName = currentResume.name.replace(/\s+/g, '_').toUpperCase()
                const formattedCompany = (match.jobs?.company_name || match.jobs?.company || '').replace(/\s+/g, '_').toUpperCase()
                return `${nextNum}_${formattedName}_${formattedCompany}`
              })(),
              file_name: 'Tailored Resume',
              file_size: 'N/A',
              uploaded_data: tailoredTextContent,
              embedding: tailoredEmbedding,
              parent_resume_id: currentResume.id,
              target_job_id: match.job_id,
              tailoring_metadata: {
                changes: result.changes,
                unsupportedRequirements: result.unsupportedRequirements,
                validationMetrics: result.validationMetrics
              }
            })
            .select()
            .single()

          if (resumeErr) {
            Logger.error('useJobMatchDetail.ts', 'handleTailorResume', 'Error saving tailored resume', resumeErr)
          } else if (newResume) {
            const standardFields = [
              {
                resume_id: newResume.id,
                label: 'firstName',
                value: currentResume.profileDetails.firstName
              },
              {
                resume_id: newResume.id,
                label: 'lastName',
                value: currentResume.profileDetails.lastName
              },
              {
                resume_id: newResume.id,
                label: 'email',
                value: currentResume.profileDetails.email
              },
              {
                resume_id: newResume.id,
                label: 'phone',
                value: currentResume.profileDetails.phone
              },
              {
                resume_id: newResume.id,
                label: 'location',
                value: currentResume.profileDetails.location
              },
              {
                resume_id: newResume.id,
                label: 'linkedin',
                value: currentResume.profileDetails.linkedin
              },
              {
                resume_id: newResume.id,
                label: 'github',
                value: currentResume.profileDetails.github
              },
              {
                resume_id: newResume.id,
                label: 'portfolio',
                value: currentResume.profileDetails.portfolio
              },
              {
                resume_id: newResume.id,
                label: 'summary',
                value: result.tailoredResumeData.summary || ''
              },
              {
                resume_id: newResume.id,
                label: 'skills',
                value: result.tailoredResumeData.skills || ''
              },
              {
                resume_id: newResume.id,
                label: 'experience',
                value: JSON.stringify(result.tailoredResumeData.experience || [])
              },
              {
                resume_id: newResume.id,
                label: 'projects',
                value: JSON.stringify(result.tailoredResumeData.projects || [])
              },
              {
                resume_id: newResume.id,
                label: 'education',
                value: JSON.stringify(result.tailoredResumeData.education || [])
              }
            ]

            const { error: itemsErr } = await supabase.from('resume_items').insert(standardFields)
            if (itemsErr) Logger.error('useJobMatchDetail.ts', 'handleTailorResume', 'Error saving tailored resume items', itemsErr)

            onResumeAdded?.()
            await handleMatchTailoredResume(newResume, result)
          }
        }
      }
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleTailorResume', 'Resume tailoring failed', err)
      alert('An error occurred during resume tailoring. Check console for details.')
    } finally {
      setTailoring(false)
      setTailoringFlow('idle')
    }
  }

  /**
   * Initiates the tailoring flow by analyzing the resume and generating clarifying questions.
   */
  const handleStartTailoring = async (): Promise<void> => {
    const currentResume = resumes.find((r) => r.id === match.resume_id)
    if (!currentResume) {
      alert('Original resume not found.')
      return
    }

    setTailoringFlow('generating_questions')
    setContextQuestions([])
    setContextAnswers({})

    try {
      const matchResultObj = {
        matchScore: match.score,
        detailedRequirements: legacyRequirements,
        keyMatches: legacyRequirements
          .filter((r: any) => r.status === 'MATCH')
          .map((r: any) => r.text),
        keyGaps: legacyRequirements.filter((r: any) => r.status === 'GAP').map((r: any) => r.text)
      }

      const jobData = {
        title: match.jobs?.job_title || match.jobs?.title || '',
        company: match.jobs?.company_name || match.jobs?.company || '',
        description: match.jobs?.job_description || match.jobs?.description || ''
      }

      const activeKey2 = await getActiveKey(supabase!, userId)
      if (!activeKey2) {
        throw new Error('No OpenAI API key connected.')
      }
      const questions = await generateTailoringQuestions(
        currentResume,
        jobData,
        matchResultObj,
        activeKey2.encrypted_key
      )

      if (questions.length > 0) {
        setContextQuestions(questions)
        setTailoringFlow('awaiting_user_input')
      } else {
        await handleTailorResume([])
      }
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleStartTailoring', 'Failed during question generation', err)
      await handleTailorResume([])
    }
  }

  /**
   * Copies the generated or extracted cover letter to the user's clipboard.
   */
  const handleCopyCoverLetter = async (): Promise<void> => {
    if (!coverLetter) return
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopiedCoverLetter(true)
      setTimeout(() => setCopiedCoverLetter(false), 1500)
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleCopyCoverLetter', 'Copy failed', err)
    }
  }

  /**
   * Copies the job description text to the user's clipboard.
   */
  const handleCopyDescription = async (): Promise<void> => {
    const description = match.jobs?.description
    if (!description) return
    try {
      await navigator.clipboard.writeText(description)
      setCopiedDescription(true)
      setTimeout(() => setCopiedDescription(false), 1500)
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleCopyDescription', 'Copy failed', err)
    }
  }

  /**
   * Generates a comprehensive markdown report of the match analysis and copies it to clipboard.
   */
  const handleCopyReport = async (): Promise<void> => {
    let report = `# Job Analysis & Tailoring Report: ${match.jobs?.company_name || match.jobs?.company || 'Unknown Company'} - ${match.jobs?.job_title || match.jobs?.title}\n\n`

    if (llmAnalysis) {
      report += `## Job Fit Score: ${llmAnalysis.fitScore}%\n\n`

      if (llmAnalysis.strongMatches?.length) {
        report += `## Strong Matches\n`
        llmAnalysis.strongMatches.forEach((m) => {
          report += `- ${m}\n`
        })
        report += `\n`
      }

      if (llmAnalysis.keyGaps?.length) {
        report += `## Key Gaps\n`
        llmAnalysis.keyGaps.forEach((g) => {
          report += `- ${g}\n`
        })
        report += `\n`
      }

      if (llmAnalysis.resumeImprovements?.length) {
        report += `## Recommended Resume Improvements\n`
        llmAnalysis.resumeImprovements.forEach((imp) => {
          report += `- ${imp}\n`
        })
        report += `\n`
      }
    } else {
      report += `**Overall Score**: ${match.score}%\n`
      report += `**Acceptance Chance**: ${verdictDecision}\n\n`
      if (rationale) report += `## Rationale\n${rationale}\n\n`

      report += `## Category Breakdown\n`
      report += `- **Skills Match**: ${match.skill_score}%\n`
      report += `- **Experience Match**: ${match.experience_score}%\n`
      report += `- **Semantic Similarity**: ${match.semantic_score}%\n\n`

      if (legacyRequirements.length > 0) {
        report += `## Requirements Checklist\n`
        legacyRequirements.forEach((req: any) => {
          report += `### [${req.status}] ${req.text}\n`
          if (req.evidence) report += `*Evidence/Details*: ${req.evidence}\n`
          report += `\n`
        })
      }

      if (legacyResumeImprovements.length > 0) {
        report += `## Tailoring Suggestions\n`
        legacyResumeImprovements.forEach((imp: string) => {
          report += `- ${imp}\n`
        })
        report += `\n`
      }

      if (coverLetter) {
        report += `## Cover Letter\n\`\`\`\n${coverLetter}\n\`\`\`\n`
      }
    }

    try {
      await navigator.clipboard.writeText(report)
      setCopiedReport(true)
      setTimeout(() => setCopiedReport(false), 1500)
    } catch (err) {
      Logger.error('useJobMatchDetail.ts', 'handleCopyReport', 'Copy failed', err)
    }
  }

  /**
   * Sets store state and navigates to the Dedicated Tailor Resume Workspace.
   */
  const handleNavigateToTailorResume = (): void => {
    resetTailoringState()
    useAppStore.getState().setCurrentJob({
      id: match.job_id || match.id,
      title: match.jobs?.job_title || match.jobs?.title || '',
      company: match.jobs?.company_name || match.jobs?.company || '',
      description: match.jobs?.job_description || match.jobs?.description || ''
    })
    useAppStore.getState().setScrapedJob({
      jobTitle: match.jobs?.job_title || match.jobs?.title || '',
      company: match.jobs?.company_name || match.jobs?.company || '',
      aboutJob: match.jobs?.job_description || match.jobs?.description || ''
    })
    if (match.evidence) {
      useAppStore.getState().setLlmResult(match.evidence)
    }
    navigate.goToTailorResume()
  }

  const clearComparison = (): void => {
    setTailoredResult(null)
    setComparisonMatch(null)
  }

  return {
    llmAnalysis,
    activeTab,
    setActiveTab,
    copiedCoverLetter,
    copiedDescription,
    copiedReport,
    tailoringFlow,
    contextQuestions,
    contextAnswers,
    setContextAnswers,
    tailoring,
    tailoredResult,
    tailoringStages,
    comparisonMatch,
    legacyRequirements,
    currentFitScore,
    potentialFitScore,
    coverLetter,
    verdictDecision,
    rationale,
    legacyResumeImprovements,
    warnings,
    handleMatchTailoredResume,
    handleTailorResume,
    handleStartTailoring,
    handleCopyCoverLetter,
    handleCopyDescription,
    handleCopyReport,
    handleNavigateToTailorResume,
    clearComparison
  }
}
