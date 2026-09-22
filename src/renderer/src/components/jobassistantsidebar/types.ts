import type { Resume } from '../../types'

export interface MatchResult {
  matchScore: number
  acceptanceChance: string
  rationale: string
  keyMatches: string[]
  keyGaps: string[]
  resumeImprovements: string[]
  coverLetter: string
  skillScore?: number
  experienceScore?: number
  responsibilityScore?: number
  semanticScore?: number
  detailedRequirements?: {
    text: string
    type: string
    status: 'MATCH' | 'PARTIAL' | 'GAP'
    evidence: string
  }[]
  warnings?: string[]
}

export interface JobAssistantSidebarProps {
  resumes: Resume[]
  selectedResumeName: string
  setSelectedResumeName: (name: string) => void
  currentResumeForAssistant: Resume | undefined
  copiedField: string | null
  handleCopy: (key: string, val: string) => void
  handleCopyAll: (resume: Resume | undefined) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  getFields?: (resume: Resume | undefined) => { key: string; label: string; value: string }[]
  userId: string
  onMatchComplete?: () => void
  onResumeAdded?: () => void
  onViewFullAnalysis?: () => void
  width?: number
  headerPlaceholder?: string
}

export interface ResumeSelectDropdownProps {
  resumes: Resume[]
  selectedResumeName: string
  onSelectResume: (name: string) => void
}

export interface SemicircleFitScoreGaugeProps {
  score: number
  potentialScore?: number
  elapsedTime?: number
  totalTokens?: number
}

export interface TopChangesListProps {
  changes: string[]
  onViewFullAnalysis?: () => void
}

export interface MatchResumeTabProps {
  matching: boolean
  matchstatus: string
  elapsedTime: number
  handleMatchResume: () => Promise<void>
  handleCopyAllMatchData: () => Promise<void>
  copiedAllMatchData: boolean
  onViewFullAnalysis?: () => void
}

export interface QuickFillTabProps {
  currentResumeForAssistant: Resume | undefined
  copiedField: string | null
  handleCopy: (key: string, val: string) => void
  handleCopyAll: (resume: Resume | undefined) => void
}
