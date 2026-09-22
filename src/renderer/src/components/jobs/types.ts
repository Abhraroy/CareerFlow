import { Resume } from '../../types'

export interface JobItem {
  id: string
  jobId?: string
  resumeId?: string
  company: string
  companyLogo?: string | null
  jobTitle: string
  location?: string
  employmentType?: string
  postedDate?: string
  matchScore: number
  potentialScore?: number
  description?: string
  rawMatch?: any
  isDemo?: boolean
}

export type SortMode =
  | 'score_desc'
  | 'score_asc'
  | 'date_desc'
  | 'company_asc'
  | 'title_asc'

export interface FilterState {
  resumeId: string
  minScore: number
  employmentType: string
}

export interface JobsPageProps {
  matches?: any[]
  resumes?: Resume[]
  isLoading?: boolean
  onSelectMatch?: (matchId: string) => void
  onRefreshMatches?: () => void | Promise<void>
}

