import { generateText as aiGenerateText, Output } from 'ai'
import Logger from './logger'
import {
  writeToFile,
  readPromptFile,
  LLM_RUN_FILE,
  TAILOR_RUN_FILE,
  EDIT_PLAN_FILE,
  SYSTEM_PROMPT_FILE,
  USER_PROMPT_FILE,
  TAILOR_SYSTEM_PROMPT_FILE,
  TAILOR_USER_PROMPT_FILE,
  COVER_LETTER_SYSTEM_PROMPT_FILE,
  COVER_LETTER_USER_PROMPT_FILE
} from './FileOperations'
import { llmAnalysisSchema } from './zodSchema'
import { EditPlanSchema } from './tailoredResumeSchema'
import { redis } from './redis'
import { analyzeSemanticResults } from './semantic_analyzer'
import type { LLMProgressCallback, LLMProgressStatus } from './LLMInitializer'

// ─── emitProgress helper ──────────────────────────────────────────────────────

function emitProgress(
  status: LLMProgressStatus,
  onProgress?: LLMProgressCallback,
  userId?: string,
  message?: string,
  data?: unknown
) {
  onProgress?.({ status, message, data })

  if (message && redis) {
    const redisKey = `jobmatch:status:${userId || 'default'}`
    redis.set(redisKey, message).catch((err) => {
      Logger.error('LLMFuntions.ts', 'emitProgress', 'Failed to update status in Redis', err)
    })
  }
}

// ─── runResumeMatchAnalysis ───────────────────────────────────────────────────
// Contains all match/analysis logic previously inside LLMInitializer.openAI().
// Called from index.ts after obtaining the OpenAI client and model from LLMInitializer.

export async function runResumeMatchAnalysis(
  client: ReturnType<typeof import('@ai-sdk/openai').createOpenAI>,
  model: string,
  jobData: unknown,
  resumeData: unknown,
  onProgress?: LLMProgressCallback,
  userId?: string
) {
  emitProgress('preparing', onProgress, userId, 'Preparing resume and job data')

  // ── System prompt ──────────────────────────────────────────────────────────
  let systemPrompt = ''
  try {
    systemPrompt = await readPromptFile(SYSTEM_PROMPT_FILE)
  } catch (err) {
    Logger.error('LLMFuntions.ts', 'runResumeMatchAnalysis', `Failed to read system prompt from src/prompts/${SYSTEM_PROMPT_FILE}`, err)
    systemPrompt = ''
  }

  // ── Resume data ────────────────────────────────────────────────────────────
  const resumeDataStr =
    typeof resumeData === 'string'
      ? resumeData
      : (JSON.stringify(resumeData ?? '', null, 2) ?? '')

  // ── Job data ───────────────────────────────────────────────────────────────
  let jobDataToSend: any = jobData
  if (typeof jobData === 'string') {
    try {
      const parsed = JSON.parse(jobData)
      if (parsed && typeof parsed === 'object') {
        jobDataToSend = parsed
      }
    } catch (e) {
      // Keep as string if it is not valid JSON
    }
  }

  if (jobDataToSend && typeof jobDataToSend === 'object') {
    const { jobTitle, company, aboutJob, aboutCompany } = jobDataToSend
    jobDataToSend = { jobTitle, company, aboutJob, aboutCompany }
  }

  const jobDataStr =
    typeof jobDataToSend === 'string'
      ? jobDataToSend
      : (JSON.stringify(jobDataToSend ?? '', null, 2) ?? '')

  Logger.info('LLMFuntions.ts', 'runResumeMatchAnalysis', 'LLM Request Stats', {
    resumeDataLength: resumeDataStr.length,
    jobDataLength: jobDataStr.length
  })

  // ── User prompt template ───────────────────────────────────────────────────
  let userPromptTemplate = ''
  try {
    userPromptTemplate = await readPromptFile(USER_PROMPT_FILE)
  } catch (err) {
    Logger.error('LLMFuntions.ts', 'runResumeMatchAnalysis', `Failed to read user prompt from src/prompts/${USER_PROMPT_FILE}`, err)
    throw new Error(
      `User prompt template file is missing or unreadable in src/prompts/${USER_PROMPT_FILE}`
    )
  }

  const customprompt = userPromptTemplate
    .replace('{{RESUME_DATA}}', resumeDataStr)
    .replace('{{JOB_DATA}}', jobDataStr)

  // ── Build output schema ────────────────────────────────────────────────────
  const output = Output.object({
    schema: llmAnalysisSchema
  })

  emitProgress('started', onProgress, userId, 'Sending analysis request to LLM')

  // ── Call LLM ───────────────────────────────────────────────────────────────
  const result = await aiGenerateText({
    model: client(model),
    system: systemPrompt,
    prompt: customprompt,
    temperature: 0,
    output: output
  })

  emitProgress('completed', onProgress, userId, 'LLM analysis completed', {
    usage: result.usage,
    totalUsage: (result as any).totalUsage,
    finishReason: result.finishReason
  })

  Logger.info('LLMFuntions.ts', 'runResumeMatchAnalysis', 'LLM Analysis Raw Result', result)

  // ── Post-process results ───────────────────────────────────────────────────
  const json_result = result.output as { requirements: any[] }
  const requirements = json_result.requirements || []

  const payload = analyzeSemanticResults(requirements, jobData)
  if (result.usage) {
    payload.usage = {
      inputTokens: result.usage.inputTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
      totalTokens: result.usage.totalTokens ?? 0
    }
  }
  const { requirements: _, llmAnalysis: __, result: ___, ...backendCalculation } = payload

  await writeToFile(LLM_RUN_FILE, {
    timestamp: new Date().toISOString(),
    systemPrompt,
    userPrompt: customprompt,
    llmResult: json_result,
    backendCalculation
  })

  return payload
}


// ─── runResumeTailor ───────────────────────────────────────────────────
// Generates a fully structured, canvas-ready tailored resume.
// Does NOT accept raw job data — pass the analyzed tailoring requirements instead.
export async function runResumeTailor(
  client: ReturnType<typeof import('@ai-sdk/openai').createOpenAI>,
  model: string,
  resumeData: string,
  tailoringRequirements: string,
  resolvedRequirements?: string[] | string,
  onProgress?: LLMProgressCallback,
  userId?: string
) {
  emitProgress('preparing', onProgress, userId, 'Preparing resume for tailoring')

  // ── System prompt (tailor_resume_system_prompt.txt) ────────────────────────
  let systemPrompt = ''
  try {
    systemPrompt = await readPromptFile(TAILOR_SYSTEM_PROMPT_FILE)
  } catch (err) {
    Logger.error('LLMFuntions.ts', 'runResumeTailor', `Failed to read tailor system prompt from src/prompts/${TAILOR_SYSTEM_PROMPT_FILE}`, err)
    systemPrompt = ''
  }

  // ── Resume data — strictly structured JSON from storage/resumes ───────────
  const resumeDataStr =
    typeof resumeData === 'string'
      ? resumeData
      : (JSON.stringify(resumeData ?? '', null, 2) ?? '')

  // Enforce structured resume data (no raw resumes permitted)
  let isStructured = false
  try {
    const parsed = JSON.parse(resumeDataStr)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      isStructured = true
    }
  } catch {
    isStructured = false
  }

  if (!isStructured) {
    Logger.error(
      'LLMFuntions.ts',
      'runResumeTailor',
      'Raw resume text detected in tailoring pipeline. Structured resume from storage/resumes is required.'
    )
    throw new Error(
      'Tailoring pipeline error: Structured resume data from storage/resumes is required. Raw resumes are not permitted in the tailoring pipeline.'
    )
  }

  // ── Tailoring requirements — passed as-is, no raw job data processing ──────
  const requirementsStr =
    typeof tailoringRequirements === 'string'
      ? tailoringRequirements
      : (JSON.stringify(tailoringRequirements ?? '', null, 2) ?? '')

  // ── Resolved requirements ──────────────────────────────────────────────────
  const resolvedRequirementsStr =
    typeof resolvedRequirements === 'string'
      ? resolvedRequirements
      : (JSON.stringify(resolvedRequirements ?? '', null, 2) ?? '')

  Logger.info('LLMFuntions.ts', 'runResumeTailor', 'Tailor LLM Request Stats', {
    resumeDataLength: resumeDataStr.length,
    isStructuredResume: isStructured,
    requirementsLength: requirementsStr.length,
    resolvedRequirementsLength: resolvedRequirementsStr.length
  })

  // ── User prompt template (tailor_resume_user_prompt.txt) ──────────────────
  let userPromptTemplate = ''
  try {
    userPromptTemplate = await readPromptFile(TAILOR_USER_PROMPT_FILE)
  } catch (err) {
    Logger.error('LLMFuntions.ts', 'runResumeTailor', `Failed to read tailor user prompt from src/prompts/${TAILOR_USER_PROMPT_FILE}`, err)
    throw new Error(
      `Tailor user prompt template is missing or unreadable in src/prompts/${TAILOR_USER_PROMPT_FILE}`
    )
  }

  const finalPrompt = userPromptTemplate
    .replace('{{RESUME_DATA}}', resumeDataStr)
    .replace('{{DATA_TO_TAILOR}}', requirementsStr)
    .replace('{{RESOLVED_REQUIREMENTS}}', resolvedRequirementsStr)

  // ── Build output schema (EditPlanSchema) ───────────────────────────────────
  const output = Output.object({
    schema: EditPlanSchema
  })

  emitProgress('started', onProgress, userId, 'Sending tailoring request to LLM')

  Logger.info('LLMFuntions.ts', 'runResumeTailor', '[AI RESUME TAILORING] DATA SENT TO AI', {
    model,
    systemPromptLength: systemPrompt.length,
    finalPromptLength: finalPrompt.length,
    resolvedRequirementsStr
  })

  // ── Call LLM ───────────────────────────────────────────────────────────────
  const result = await aiGenerateText({
    model: client(model),
    system: systemPrompt,
    prompt: finalPrompt,
    temperature: 0,
    output: output
  })

  emitProgress('completed', onProgress, userId, 'Resume tailoring complete', {
    usage: result.usage,
    totalUsage: (result as any).totalUsage,
    finishReason: result.finishReason
  })

  Logger.info('LLMFuntions.ts', 'runResumeTailor', '[AI RESUME TAILORING] DATA RECEIVED FROM AI', {
    finishReason: result.finishReason,
    usage: result.usage,
    output: result.output
  })

  const tailorResult = {
    ...result.output,
    usage: {
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
      model: model || 'gpt-4o-mini'
    }
  }

  // ── Store output in storage/ ───────────────────────────────────────────────
  try {
    await writeToFile(TAILOR_RUN_FILE, {
      timestamp: new Date().toISOString(),
      systemPrompt,
      userPrompt: finalPrompt,
      llmResult: result.output,
      usage: tailorResult.usage
    })
    await writeToFile(EDIT_PLAN_FILE, result.output)
    Logger.info(
      'LLMFuntions.ts',
      'runResumeTailor',
      `Saved tailoring output to storage/${TAILOR_RUN_FILE} and storage/${EDIT_PLAN_FILE}`
    )
  } catch (err) {
    Logger.error('LLMFuntions.ts', 'runResumeTailor', 'Failed to write tailor output to storage', err)
  }

  return tailorResult
}

// ─── runCoverLetterGeneration ────────────────────────────────────────────────
// Generates a tailored cover letter given job data and global resume data.
export async function runCoverLetterGeneration(
  client: ReturnType<typeof import('@ai-sdk/openai').createOpenAI>,
  model: string,
  jobData: unknown,
  resumeData: unknown,
  onProgress?: LLMProgressCallback,
  userId?: string
) {
  emitProgress('preparing', onProgress, userId, 'Preparing data for cover letter generation')

  // ── System prompt (cover_letter_system_prompt.txt) ─────────────────────────
  let systemPrompt = ''
  try {
    systemPrompt = await readPromptFile(COVER_LETTER_SYSTEM_PROMPT_FILE)
  } catch (err) {
    Logger.error(
      'LLMFuntions.ts',
      'runCoverLetterGeneration',
      `Failed to read cover letter system prompt from src/prompts/${COVER_LETTER_SYSTEM_PROMPT_FILE}`,
      err
    )
    systemPrompt = ''
  }

  // ── Resume data ────────────────────────────────────────────────────────────
  const resumeDataStr =
    typeof resumeData === 'string'
      ? resumeData
      : (JSON.stringify(resumeData ?? '', null, 2) ?? '')

  // ── Job data ───────────────────────────────────────────────────────────────
  const jobDataStr =
    typeof jobData === 'string'
      ? jobData
      : (JSON.stringify(jobData ?? '', null, 2) ?? '')

  // ── User prompt template (cover_letter_user_prompt.txt) ────────────────────
  let userPromptTemplate = ''
  try {
    userPromptTemplate = await readPromptFile(COVER_LETTER_USER_PROMPT_FILE)
  } catch (err) {
    Logger.error(
      'LLMFuntions.ts',
      'runCoverLetterGeneration',
      `Failed to read cover letter user prompt from src/prompts/${COVER_LETTER_USER_PROMPT_FILE}`,
      err
    )
    throw new Error(
      `Cover letter user prompt template is missing or unreadable in src/prompts/${COVER_LETTER_USER_PROMPT_FILE}`
    )
  }

  const finalPrompt = userPromptTemplate
    .replace('{{RESUME_DATA}}', resumeDataStr)
    .replace('{{JOB_DATA}}', jobDataStr)

  emitProgress('started', onProgress, userId, 'Sending cover letter generation request to LLM')

  const result = await aiGenerateText({
    model: client(model),
    system: systemPrompt,
    prompt: finalPrompt,
    temperature: 0.7
  })

  emitProgress('completed', onProgress, userId, 'Cover letter generation complete', {
    usage: result.usage,
    totalUsage: (result as any).totalUsage,
    finishReason: result.finishReason
  })

  return {
    coverLetter: result.text,
    usage: {
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
      model: model || 'gpt-4o-mini'
    }
  }
}

