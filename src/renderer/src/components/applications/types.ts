export type ApplicationStage = 'in_progress' | 'applied' | 'shortlisted' | 'interviewing' | 'offer' | 'rejected'

export interface ApplicationItem {
  id: string
  jobId: string
  resumeId: string | null
  tailoredResumeId: string | null
  company: string
  companyLogo: string | null
  jobTitle: string
  location: string
  resumeName: string
  shortlisted: boolean
  status: ApplicationStage
  appliedDate: string
  updatedDate?: string
  matchScore?: number
  notes?: string | null
  jobLink?: string | null
  salaryEstimate?: string
  isDemo?: boolean
}

export type ViewMode = 'kanban' | 'table'

export interface ApplicationFilterState {
  searchQuery: string
  stage: 'all' | ApplicationStage
  shortlistedOnly: boolean
  resumeId: string
  sortBy: 'date_desc' | 'date_asc' | 'score_desc' | 'company'
}
