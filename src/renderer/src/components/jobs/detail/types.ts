import { Resume } from '@/types'

export interface JobMatchDetailViewProps {
  match: {
    id: string
    job_id: string
    resume_id: string
    score: number
    fit_score?: number
    skill_score: number
    experience_score: number
    semantic_score: number
    evidence: any
    gaps: any
    created_at: string
    jobs: {
      title?: string
      company?: string
      description?: string
      job_title?: string
      company_name?: string
      job_description?: string
      job_link?: string
      parsed_data?: any
    }
  }
  resumes: Resume[]
  userId: string
  onRefreshMatches?: () => void
  onResumeAdded?: () => void
  onSelectTab?: (tabName: string) => void
}

export type DetailTab =
  | 'overview'
  | 'requirements'
  | 'gaps'
  | 'ats'
  | 'improvements'
  | 'rewrites'
  | 'coverletter'
  | 'description'

export type TailoringFlowState =
  | 'idle'
  | 'generating_questions'
  | 'awaiting_user_input'
  | 'tailoring'

export interface TailoringStageInfo {
  status: 'pending' | 'running' | 'success' | 'failed'
  message?: string
}

export interface ComparisonMatch {
  originalScore: number
  tailoredScore: number
}
