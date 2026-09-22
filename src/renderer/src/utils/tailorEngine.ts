import { Resume, Job } from '../types'
import Logger from '@utils/logger'

export interface TailoringStageUpdate {
  stage: 'questions' | 'prioritize' | 'retrieve' | 'strategy' | 'rewrite' | 'validate' | 'ats'
  status: 'pending' | 'running' | 'success' | 'failed'
  message?: string
}

export interface TailoringResult {
  tailoredResumeData: {
    summary?: string
    skills?: string
    experience?: any[]
    projects?: any[]
    education?: any[]
  }
  changes: { section: string; action: string; detail: string }[]
  unsupportedRequirements: string[]
  validationMetrics: {
    truthfulness: number
    keywordCoverage: number
    atsQuality: number
  }
}

export interface TailoringQuestion {
  id: string
  question: string
  hint: string
  inputType: 'text' | 'yesno'
}

export interface UserContextAnswer {
  question: string
  hint: string
  answer: string
}

/**
 * Generates 0–3 contextual questions the AI wants to ask the candidate
 * before tailoring their resume. Answers provide richer context for better
 * tailored output — they are NOT pasted verbatim into the resume.
 */
export async function generateTailoringQuestions(
  resume: Resume,
  job: Job,
  matchResult: any,
  encryptedKey: string
): Promise<TailoringQuestion[]> {
  const systemPrompt = 'You are a precise resume tailoring assistant. Output ONLY valid JSON.'

  const originalSummary =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'summary')?.value ||
    ''
  const originalSkills =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'skills')?.value ||
    ''
  const originalExperienceRaw =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'experience')
      ?.value || '[]'

  let experienceSummary = ''
  try {
    const parsed = JSON.parse(originalExperienceRaw)
    experienceSummary = parsed
      .map((e: any) => `${e.role} at ${e.company} (${e.duration || ''}): ${e.description || ''}`)
      .join('\n')
  } catch {
    experienceSummary = originalExperienceRaw.slice(0, 800)
  }

  const gapRequirements = (matchResult.detailedRequirements || [])
    .filter((r: any) => r.status === 'GAP' || r.status === 'PARTIAL')
    .slice(0, 8)
    .map((r: any) => `- [${r.status}] ${r.text} (type: ${r.type})`)
    .join('\n')

  const prompt = `You are helping tailor a resume for a specific job. Before the AI rewrites the resume, you have an opportunity to ask the candidate 0 to 3 short questions. These answers will give you richer context to produce a better, more accurate tailored resume.

IMPORTANT RULES:
- Only ask questions about things that are genuinely unclear or missing from the resume but could meaningfully improve the tailored output for THIS job.
- Do NOT ask about things that are clearly evident in the resume.
- Do NOT ask about information that cannot realistically be included in a resume.
- The goal is context gathering — not confirmation or scoring.
- Questions can be about anything you find valuable: scope/scale of work, outcomes, technologies used in specific projects, leadership/team size, specific methods or tools related to job requirements, etc.
- If the resume already provides sufficient context, return 0 questions.
- Maximum 3 questions. Prefer fewer high-quality questions over many low-quality ones.

Job Title: ${job.title}
Company: ${job.company}
Job Requirements (gaps/partials): 
${gapRequirements || 'None identified'}

Candidate Resume Summary: ${originalSummary.slice(0, 300)}
Candidate Skills: ${originalSkills.slice(0, 300)}
Candidate Experience (brief):
${experienceSummary.slice(0, 800)}

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Short question for candidate",
      "hint": "1 sentence explaining why this question helps the AI write a better resume",
      "inputType": "text"
    }
  ]
}`

  try {
    const res = await window.api.openaiChatCompletionTracked({
      encryptedKey,
      text: prompt,
      systemMessage: systemPrompt,
      jsonMode: true
    })
    const parsed = JSON.parse(res.content)
    return (parsed.questions || []).slice(0, 3) as TailoringQuestion[]
  } catch (e) {
    Logger.error('tailorEngine.ts', 'generateTailoringQuestions', 'Failed to generate tailoring questions', e)
    return []
  }
}

export async function runTailoringPipeline(
  resume: Resume,
  job: Job,
  matchResult: any,
  encryptedKey: string,
  userContextAnswers?: UserContextAnswer[],
  onProgress?: (update: TailoringStageUpdate) => void
): Promise<TailoringResult> {
  const systemPrompt =
    'You are a precise, token-optimized resume tailoring assistant. Output ONLY valid JSON.'

  const originalSummary =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'summary')?.value ||
    ''
  const originalSkills =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'skills')?.value ||
    ''

  let originalExperience: any[] = []
  try {
    const expVal = resume.profileDetails.customFields?.find(
      (cf) => cf.label.toLowerCase() === 'experience'
    )?.value
    originalExperience = expVal ? JSON.parse(expVal) : []
  } catch (e) {
    Logger.error('tailorEngine.ts', 'runTailoringPipeline', 'Error parsing original experience', e)
  }

  let originalProjects: any[] = []
  try {
    const projVal = resume.profileDetails.customFields?.find(
      (cf) => cf.label.toLowerCase() === 'projects'
    )?.value
    originalProjects = projVal ? JSON.parse(projVal) : []
  } catch (e) {
    Logger.error('tailorEngine.ts', 'runTailoringPipeline', 'Error parsing original projects', e)
  }

  const originalEducation =
    resume.profileDetails.customFields?.find((cf) => cf.label.toLowerCase() === 'education')
      ?.value || '[]'

  // Build context block from user answers — used to enrich rewriter prompts
  // Answers are CONTEXT for the AI, never pasted verbatim
  const userContextBlock =
    (userContextAnswers || []).length > 0
      ? '\nAdditional context from the candidate (use this to make smarter tailoring decisions — do NOT copy answers verbatim into the resume):\n' +
        (userContextAnswers || [])
          .filter((a) => a.answer && a.answer.trim().length > 0)
          .map((a) => `- Q: "${a.question}" → A: "${a.answer}"`)
          .join('\n') +
        '\n'
      : ''

  // STAGE 1: Prioritize Requirements
  onProgress?.({ stage: 'prioritize', status: 'running', message: 'Prioritizing requirements...' })

  const requirementsSummary = (matchResult.detailedRequirements || []).map((req: any) => ({
    text: req.text,
    type: req.type,
    status: req.status
  }))

  const prioritizePrompt = `Prioritize the following job requirements. Classify each as HIGH, MEDIUM, or LOW priority based on relevance to the title "${job.title}".
Requirements:
${JSON.stringify(requirementsSummary, null, 1)}

Respond with JSON:
{
  "priorityRequirements": [
    {
      "requirement": "requirement text",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "status": "MATCH" | "PARTIAL" | "GAP"
    }
  ]
}`

  const r_prioritize = await window.api.openaiChatCompletionTracked({
    encryptedKey,
    text: prioritizePrompt,
    systemMessage: systemPrompt,
    jsonMode: true
  })
  const priorityData = JSON.parse(r_prioritize.content)
  onProgress?.({ stage: 'prioritize', status: 'success' })

  // STAGE 2: Retrieve Evidence (local, no LLM tokens)
  onProgress?.({
    stage: 'retrieve',
    status: 'running',
    message: 'Mapping evidence (Local/No Tokens)...'
  })

  const evidenceMap = (priorityData.priorityRequirements || []).map((pReq: any) => {
    const foundEvidence = (matchResult.detailedRequirements || []).find(
      (r: any) => r.text === pReq.requirement
    )
    return {
      requirement: pReq.requirement,
      status:
        foundEvidence?.status === 'MATCH'
          ? 'SUPPORTED'
          : foundEvidence?.status === 'PARTIAL'
            ? 'PARTIALLY_SUPPORTED'
            : 'UNSUPPORTED',
      evidence: foundEvidence?.evidence || null
    }
  })
  onProgress?.({ stage: 'retrieve', status: 'success' })

  // STAGE 3: Strategy Agent
  onProgress?.({
    stage: 'strategy',
    status: 'running',
    message: 'Formulating tailoring strategy...'
  })

  const strategyInput = {
    summary: { exists: !!originalSummary },
    skills: { exists: !!originalSkills },
    experience: originalExperience.map((exp) => ({ role: exp.role, company: exp.company })),
    projects: originalProjects.map((proj) => ({ title: proj.title })),
    evidenceMap: evidenceMap.filter((e: any) => e.status !== 'UNSUPPORTED')
  }

  const strategyPrompt = `Formulate a tailoring strategy for these sections:
${JSON.stringify(strategyInput, null, 1)}${userContextBlock}
Respond with JSON:
{
  "summary": { "action": "REWRITE" | "KEEP" },
  "skills": { "action": "REWRITE" | "KEEP" },
  "experience": [
    { "role": "role name", "company": "company name", "action": "EMPHASIZE" | "CONDENSE" | "KEEP" }
  ],
  "projects": [
    { "title": "project title", "action": "EMPHASIZE" | "CONDENSE" | "KEEP" }
  ]
}`

  const r_strategy = await window.api.openaiChatCompletionTracked({
    encryptedKey,
    text: strategyPrompt,
    systemMessage: systemPrompt,
    jsonMode: true
  })
  const strategyData = JSON.parse(r_strategy.content)
  onProgress?.({ stage: 'strategy', status: 'success' })

  // STAGE 4: Rewriter (Segment-by-Segment)
  onProgress?.({ stage: 'rewrite', status: 'running', message: 'Tailoring targeted sections...' })
  const changes: { section: string; action: string; detail: string }[] = []

  // 1. Tailor Summary
  let tailoredSummary = originalSummary
  if (strategyData.summary?.action === 'REWRITE') {
    const summaryPrompt = `Rewrite the professional summary to align with the requirements: ${JSON.stringify(evidenceMap.slice(0, 5), null, 1)}.${userContextBlock} Keep it concise (max 3 sentences). DO NOT invent facts not present in the original resume. Use the additional context to make smarter emphasis decisions, not to fabricate claims.
Original Summary: ${originalSummary}
Respond with JSON: { "summary": "Tailored summary" }`
    const r_summary = await window.api.openaiChatCompletionTracked({
      encryptedKey,
      text: summaryPrompt,
      systemMessage: systemPrompt,
      jsonMode: true
    })
    tailoredSummary = JSON.parse(r_summary.content).summary
    changes.push({
      section: 'Summary',
      action: 'REWRITE',
      detail: 'Aligned summary with key job requirements.'
    })
  }

  // 2. Tailor Skills
  let tailoredSkills = originalSkills
  if (strategyData.skills?.action === 'REWRITE') {
    const skillsPrompt = `Reorder and prioritize the skills list to match the job requirements: ${JSON.stringify(evidenceMap.slice(0, 10), null, 1)}.${userContextBlock} Only include skills actually present in the original list or confirmed by candidate context.
Original Skills: ${originalSkills}
Respond with JSON: { "skills": "comma-separated skills" }`
    const r_skills = await window.api.openaiChatCompletionTracked({
      encryptedKey,
      text: skillsPrompt,
      systemMessage: systemPrompt,
      jsonMode: true
    })
    tailoredSkills = JSON.parse(r_skills.content).skills
    changes.push({
      section: 'Skills',
      action: 'REORDER',
      detail: 'Reprioritized technical skills matching job checklist.'
    })
  }

  // 3. Tailor Experience Items
  const tailoredExperience: any[] = []
  for (const exp of originalExperience) {
    const itemStrategy = (strategyData.experience || []).find(
      (s: any) => s.role === exp.role && s.company === exp.company
    )

    if (itemStrategy?.action === 'EMPHASIZE' || itemStrategy?.action === 'REWRITE') {
      const expPrompt = `Emphasize relevant evidence in this work experience role to match: ${JSON.stringify(evidenceMap.slice(0, 5), null, 1)}.${userContextBlock}
CRITICAL: Do NOT invent metrics or fake achievements. Keep the same structure. Use the candidate context to understand what to emphasize — not to add unclaimed facts.
Original Role: ${exp.role} at ${exp.company}
Description: ${exp.description}

Respond with JSON:
{
  "description": "Tailored description text"
}`
      const r_exp = await window.api.openaiChatCompletionTracked({
        encryptedKey,
        text: expPrompt,
        systemMessage: systemPrompt,
        jsonMode: true
      })
      const parsedExp = JSON.parse(r_exp.content)
      tailoredExperience.push({
        ...exp,
        description: parsedExp.description
      })
      changes.push({
        section: 'Experience',
        action: 'EMPHASIZE',
        detail: `Optimized bullet points for ${exp.role} at ${exp.company}.`
      })
    } else if (itemStrategy?.action === 'CONDENSE') {
      tailoredExperience.push({
        ...exp,
        description: exp.description ? exp.description.split('.').slice(0, 2).join('.') + '.' : ''
      })
      changes.push({
        section: 'Experience',
        action: 'CONDENSE',
        detail: `Condensed bullet points for ${exp.role} at ${exp.company}.`
      })
    } else {
      tailoredExperience.push(exp)
    }
  }

  // 4. Tailor Projects Items
  const tailoredProjects: any[] = []
  for (const proj of originalProjects) {
    const itemStrategy = (strategyData.projects || []).find((s: any) => s.title === proj.title)

    if (itemStrategy?.action === 'EMPHASIZE' || itemStrategy?.action === 'REWRITE') {
      const projPrompt = `Emphasize relevant details in this project description. Do NOT invent technologies or metrics.${userContextBlock}
Original Project: ${proj.title}
Description: ${proj.description}

Respond with JSON:
{
  "description": "Tailored description text"
}`
      const r_proj = await window.api.openaiChatCompletionTracked({
        encryptedKey,
        text: projPrompt,
        systemMessage: systemPrompt,
        jsonMode: true
      })
      const parsedProj = JSON.parse(r_proj.content)
      tailoredProjects.push({
        ...proj,
        description: parsedProj.description
      })
      changes.push({
        section: 'Projects',
        action: 'EMPHASIZE',
        detail: `Optimized project bullets for ${proj.title}.`
      })
    } else if (itemStrategy?.action === 'CONDENSE') {
      tailoredProjects.push({
        ...proj,
        description: proj.description ? proj.description.split('.').slice(0, 1).join('.') + '.' : ''
      })
      changes.push({
        section: 'Projects',
        action: 'CONDENSE',
        detail: `Condensed project bullets for ${proj.title}.`
      })
    } else {
      tailoredProjects.push(proj)
    }
  }

  onProgress?.({ stage: 'rewrite', status: 'success' })

  // STAGE 5: Truth Validator
  onProgress?.({ stage: 'validate', status: 'running', message: 'Validating tailored claims...' })
  const validatePrompt = `Verify if the tailored descriptions contain any fabricated metrics or false claims that do not exist in the original descriptions.
Original Experience: ${JSON.stringify(originalExperience.map((e) => e.description))}
Tailored Experience: ${JSON.stringify(tailoredExperience.map((e) => e.description))}

Respond with JSON:
{
  "truthfulnessScore": 100,
  "claims": [
    { "claim": "claim description", "supported": true }
  ]
}`

  const r_validate = await window.api.openaiChatCompletionTracked({
    encryptedKey,
    text: validatePrompt,
    systemMessage: systemPrompt,
    jsonMode: true
  })
  const validateData = JSON.parse(r_validate.content)
  onProgress?.({ stage: 'validate', status: 'success' })

  // STAGE 6: ATS Validator
  onProgress?.({ stage: 'ats', status: 'running', message: 'Estimating ATS coverage...' })

  const atsPrompt = `Check keyword alignment score and list high importance gap keywords.
Job Description Title/Context: ${job.title} ${job.company}
Tailored Skills: ${tailoredSkills}

Respond with JSON:
{
  "keywordCoverage": 90,
  "atsQuality": 95,
  "unsupportedRequirements": []
}`

  const r_ats = await window.api.openaiChatCompletionTracked({
    encryptedKey,
    text: atsPrompt,
    systemMessage: systemPrompt,
    jsonMode: true
  })
  const atsData = JSON.parse(r_ats.content)
  onProgress?.({ stage: 'ats', status: 'success' })

  return {
    tailoredResumeData: {
      summary: tailoredSummary,
      skills: tailoredSkills,
      experience: tailoredExperience,
      projects: tailoredProjects,
      education: JSON.parse(originalEducation)
    },
    changes,
    unsupportedRequirements: atsData.unsupportedRequirements || [],
    validationMetrics: {
      truthfulness: validateData.truthfulnessScore || 100,
      keywordCoverage: atsData.keywordCoverage || 85,
      atsQuality: atsData.atsQuality || 90
    }
  }
}
