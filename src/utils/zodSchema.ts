import { z } from 'zod'

const requirementAnalysisSchema = z.object({
  id: z.string(),

  requirement: z.string(),

  priority: z.enum([
    'CRITICAL',
    'REQUIRED',
    'PREFERRED',
    'CONTEXTUAL'
  ]),

  match: z.enum([
    'MATCHED',
    'PARTIAL',
    'NOT_MENTIONED',
    'CONFLICTING'
  ]),

  evidenceLevel: z.enum([
    'NONE',
    'LISTED',
    'DEMONSTRATED',
    'PROFESSIONAL',
    'PRODUCTION'
  ]),

  resumeEvidence: z.string(),

  gapType: z.enum([
    'NONE',
    'RESUME_POSITIONING_GAP',
    'EXPERIENCE_GAP',
    'SKILL_GAP',
    'QUALIFICATION_GAP',
    'UNKNOWN'
  ]),

  recommendationType: z.enum([
    'NONE',
    'REWRITE_NOW',
    'ADD_EVIDENCE_IF_TRUE',
    'CANNOT_FIX_WITH_REWRITE'
  ]),

  resumeAction: z.string()
})

export const llmAnalysisSchema = z.object({
  requirements: z
    .array(requirementAnalysisSchema)
    .min(1)
    .max(15)
})

export type LLMAnalysisRaw = z.infer<typeof llmAnalysisSchema>

export type RequirementAnalysis = z.infer<typeof requirementAnalysisSchema>

export interface LLMAnalysisOutput extends LLMAnalysisRaw {
  fitScore: number 

  fitLabel: string
  
  strongMatches: string[]
  keyGaps: string[]
  resumeImprovements: string[]
  scoreExplanation: string
  executiveSummary?: {
    jobTitle: string
    company: string
    currentFitScore: number
    potentialFitScore: number
    recommendation: string
    biggestStrength?: string
    biggestGap?: string
  }
  atsKeywordAnalysis?: {
    importantKeywordsMissing?: string[]
  }
  finalVerdict?: {
    decision: string
  }
  missingUnclearRequirements?: {
    missing: string[]
  }
  top5ChangesBeforeApplying?: string[]
  llmAnalysis?: {
    requirements: any[]
  }
  result?: {
    fitScore: number
    fitLabel: string
    strongMatches: string[]
    keyGaps: string[]
    resumeImprovements: string[]
    scoreExplanation: string
  }
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}