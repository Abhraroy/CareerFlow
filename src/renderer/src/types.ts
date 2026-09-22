export interface ProfileDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  customFields?: { id: string; label: string; value: string }[]
}

export interface StructuredResume {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  portfolio?: string
  experience?: Array<{
    company: string
    role: string
    duration?: string
    location?: string
    description?: string
  }>
  education?: Array<{
    institution: string
    degree: string
    duration?: string
    grade?: string
  }>
  projects?: Array<{
    title: string
    description?: string
    technologies?: string
    link?: string
  }>
  skills?: string[]
  summary?: string
  certifications?: Array<{
    name: string
    issuer?: string
    date?: string
  }>
  languages?: string[]
  publications?: Array<{
    title: string
    publisher?: string
    date?: string
    link?: string
  }>
  awards?: string[]
  [customKey: string]: any
}

import type {
  ResumeDocumentMetadata,
  ResumeDocumentElement,
  ResumeDocumentSection,
  ResumeDocument
} from '@utils/applyEditPlan'

export type {
  ResumeDocumentMetadata,
  ResumeDocumentElement,
  ResumeDocumentSection,
  ResumeDocument
}

export interface Resume {
  id?: string
  name: string
  fileName?: string
  fileSize?: string | number
  rawResumeData?: string
  uploadedData?: string
  structuredData?: ResumeDocument | StructuredResume | Record<string, any>
  originalStructuredData?: ResumeDocument | StructuredResume | Record<string, any>
  profileDetails: ProfileDetails
  parentResumeId?: string
  targetJobId?: string
  embedding?: number[]
  createdAt?: string
  updatedAt?: string
  tailoringMetadata?: {
    changes: { section: string; action: string; detail: string }[]
    unsupportedRequirements: string[]
    validationMetrics: { truthfulness: number; keywordCoverage: number; atsQuality: number }
  }
  [key: string]: any
}

export interface Portal {
  id: string
  label: string
  url: string
  logo: string
}

export interface StructuredItem {
  role?: string
  company?: string
  duration?: string
  location?: string
  description?: string
  link?: string
  title?: string
  technologies?: string
  institution?: string
  degree?: string
  grade?: string
}

export interface Job {
  id?: string
  title: string
  company?: string
  description?: string
  parsed_data?: {
    required_skills?: string[]
    preferred_skills?: string[]
    responsibilities?: string[]
    years_experience?: number
    education?: string[]
    seniority?: string
    location?: string
    employment_type?: string
  }
  embedding?: number[]
  created_at?: string
}

export interface JobRequirement {
  id?: string
  job_id: string
  requirement: string
  type: 'required_skill' | 'preferred_skill' | 'responsibility' | 'experience' | 'education'
  importance?: string
  embedding?: number[]
}

export interface ResumeEvidence {
  id?: string
  resume_id: string
  section_type: 'summary' | 'skills' | 'experience' | 'projects' | 'education'
  content: string
  embedding?: number[]
}

export interface JobMatch {
  id?: string
  job_id: string
  resume_id: string
  score: number
  skill_score?: number
  experience_score?: number
  semantic_score?: number
  evidence?: {
    requirements: {
      text: string
      type: string
      status: 'MATCH' | 'PARTIAL' | 'UNKNOWN' | 'GAP'
      evidence: string
      confidence: number
    }[]
  }
  gaps?: string[]
  created_at?: string
}

export interface CandidateFact {
  id?: string
  user_id: string
  fact: string
  category: string
  context?: string
  source: 'resume' | 'user_confirmed' | 'user_rejected' | 'user_corrected'
  confidence?: number
  verified?: boolean
  created_at?: string
  updated_at?: string
}

// ─── BYOK: API Usage & Key Management ────────────────────────────────────────

export type AIFeature =
  | 'RESUME_TAILOR'
  | 'JOB_ANALYZE'
  | 'RESUME_MATCH'
  | 'COVER_LETTER'
  | 'AI_INTERVIEW'
  | 'RESUME_PARSE'
  | 'RESUME_EMBED'

export const AI_FEATURE_LABELS: Record<AIFeature, string> = {
  RESUME_TAILOR: 'Resume Tailor',
  JOB_ANALYZE: 'Job Analyze',
  RESUME_MATCH: 'Resume Match',
  COVER_LETTER: 'Cover Letter',
  AI_INTERVIEW: 'AI Interview',
  RESUME_PARSE: 'Resume Parse',
  RESUME_EMBED: 'Resume Embed'
}

export interface OpenAIKey {
  id: string
  user_id: string
  encrypted_key: string
  key_last4?: string
  is_active?: boolean
  type?: string
  created_at: string
  updated_at?: string
}

export interface AIUsage {
  id: string
  api_key_id?: string
  openai_key_id?: string
  user_id: string
  feature: AIFeature
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  created_at: string
}

/** Returned from the main process after a tracked OpenAI call */
export interface AIUsageInfo {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
}

/** Aggregated data for the API Usage page */
export interface APIUsageData {
  connected: boolean
  keyLast4?: string
  keyId?: string
  summary: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  byFeature: { feature: AIFeature; totalTokens: number }[]
  history: {
    timestamp: string
    feature: AIFeature
    model: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }[]
}
