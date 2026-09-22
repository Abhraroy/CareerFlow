import { create } from 'zustand'
import { Resume, Job, JobMatch } from '../types'
import { LLMAnalysisOutput } from '../../../utils/zodSchema'
import Logger from '@utils/logger'

export interface TailorChangeDetail {
  id: string
  sectionName: string
  title: string
  changesCount: number
  impactScore: string
  impactBadge: 'Critical' | 'High' | 'Medium'
  summaryOfChange: string
  beforeText: string
  afterText: string
  keyImprovements: string[]
  atsKeywordGains: string[]
}

export type TailoringStatus =
  | 'idle'
  | 'resolving_requirements'
  | 'analyzing'
  | 'rewriting'
  | 'keywords'
  | 'formatting'
  | 'completed'

export interface ResolutionQuestion {
  requirement: string
  question: string
  step1Type: 'YES_NO'
  options: string[]
  followUp?: string
}

export interface ScrapedJobData {
  jobTitle?: string | null
  company?: string | null
  aboutJob?: string | null
  aboutCompany?: string | null
  logo?: string | null
  fullText?: string
  [key: string]: any
}

export interface AppState {
  // User / Auth state
  /** Currently authenticated Supabase user identifier */
  userId: string | null

  // Core Data state
  /** List of user resumes uploaded or retrieved from storage */
  resumes: Resume[]
  /** Name/filename of the currently selected active resume */
  selectedResumeName: string
  /** Current active resume object with parsed sections and metadata */
  currentResume: Resume | null
  /** Current active job posting object selected or loaded */
  currentJob: Job | null
  /** Collection of job match fit scores and gap analyses */
  matches: JobMatch[]

  /** Current theme: 'light' or 'dark' */
  theme: 'light' | 'dark'
  /** Set explicit theme ('light' or 'dark') */
  setTheme: (theme: 'light' | 'dark') => void
  /** Toggle between light and dark theme */
  toggleTheme: () => void

  // UI state
  /** Toggle state determining whether the job assistant sidebar is collapsed */
  sidebarCollapsed: boolean
  /** Active navigation tab displayed in the sidebar ('match' or 'quickfill') */
  sidebarTab: 'match' | 'quickfill'
  /** Controls open/close visibility of the global outreach modal */
  isOutreachModalOpen: boolean
  /** Opens or closes the global outreach modal */
  setIsOutreachModalOpen: (open: boolean) => void

  // Loading & Processing state
  /** Indicates whether the resume-to-job matching analysis is actively in progress */
  isMatching: boolean
  /** User-facing status message reflecting the current step of matching/analysis */
  matchStatus: string
  /** Indicates whether the full resume tailoring LLM pipeline is currently running */
  isTailoring: boolean

  // Tailoring UI & Detailed Modal state
  /** Current active phase/step in the resume tailoring workflow */
  tailoringStatus: TailoringStatus
  /** Numerical percentage (0-100) indicating resume tailoring progress */
  tailoringProgress: number
  /** Selected resume change record currently previewed in the impact modal */
  activeChangeDetail: TailorChangeDetail | null
  /** Controls open/close visibility of the change impact preview modal */
  isChangeModalOpen: boolean
  /** Indicates whether the user is actively editing the tailored resume text */
  isEditingResume: boolean
  /** Full text content of the generated tailored resume */
  tailoredResumeText: string
  /** Key-value dictionary of user answers to requirement clarification questions */
  resolvedRequirementsData: Record<string, string> | null
  /** List of LLM-generated questions to clarify missing job requirements */
  resolutionQuestions: ResolutionQuestion[]
  /** Indicates whether requirement resolution questions are being generated */
  isGeneratingQuestions: boolean

  // LLM response
  /** Parsed output from the job fit and gap analysis LLM */
  llmResult: LLMAnalysisOutput | null

  // Persisted IDs for Supabase integration
  /** ID of the currently active llm_analysis row in Supabase */
  currentLlmAnalysisId: string | null
  /** ID of the currently active job record in the jobs table */
  currentJobId: string | null

  // Scraped job description & metadata
  /** Full scraped job description and portal metadata (title, company, description, logo, fullText) */
  scrapedJob: ScrapedJobData | null

  // Analyzed JD
  /** Extracted key requirements and qualifications from the job description */
  AnalyzedJD: string[]

  // Setters & Actions
  /** Updates the extracted list of job requirements */
  setAnalyzedJD: (jd: string[]) => void
  /** Updates the scraped job description and portal metadata in the global store */
  setScrapedJob: (job: ScrapedJobData | null) => void
  /** Sets the authenticated user ID */
  setUserId: (userId: string | null) => void
  /** Sets the list of user resumes */
  setResumes: (resumes: Resume[]) => void
  /** Sets the active selected resume filename */
  setSelectedResumeName: (name: string) => void
  /** Sets the currently active resume object */
  setCurrentResume: (resume: Resume | null) => void
  /** Sets the currently active job object */
  setCurrentJob: (job: Job | null) => void
  /** Sets the collection of match analysis records */
  setMatches: (matches: JobMatch[]) => void

  /** Sets the sidebar collapsed visibility state */
  setSidebarCollapsed: (collapsed: boolean) => void
  /** Sets the active sidebar view tab */
  setSidebarTab: (tab: 'match' | 'quickfill') => void

  /** Sets the matching in-progress loading state */
  setIsMatching: (isMatching: boolean) => void
  /** Updates the matching progress status message */
  setMatchStatus: (status: string) => void
  /** Sets the tailoring in-progress loading state */
  setIsTailoring: (isTailoring: boolean) => void

  // Tailoring Setters
  /** Sets the current phase of the tailoring workflow */
  setTailoringStatus: (status: TailoringStatus) => void
  /** Updates the tailoring progress percentage */
  setTailoringProgress: (progress: number) => void
  /** Sets the currently inspected resume change detail for the impact modal */
  setActiveChangeDetail: (detail: TailorChangeDetail | null) => void
  /** Opens or closes the change impact modal */
  setIsChangeModalOpen: (open: boolean) => void
  /** Sets whether the user is in resume manual editing mode */
  setIsEditingResume: (editing: boolean) => void
  /** Sets the full tailored resume text content */
  setTailoredResumeText: (text: string) => void
  /** Sets the requirement resolution answer dictionary */
  setResolvedRequirementsData: (data: Record<string, string> | null) => void
  /** Sets the list of requirement resolution questions */
  setResolutionQuestions: (questions: ResolutionQuestion[]) => void
  /** Sets the question generation loading state */
  setIsGeneratingQuestions: (isGenerating: boolean) => void
  /** Resets all tailoring-specific states back to default initial values */
  resetTailoringState: () => void

  // Tailored Resume LLM result
  /** Structured JSON payload of the tailored resume sections and details */
  tailoredResume: any | null
  /** Sets the structured tailored resume JSON result */
  setTailoredResume: (tailoredResume: any) => void

  // Post-Tailoring Match Analysis State
  /** Match analysis result for the generated tailored resume against the JD */
  postTailorLlmResult: LLMAnalysisOutput | null
  /** Indicates whether the tailored resume matching is currently running */
  isPostTailorMatching: boolean
  /** Real-time status string for tailored resume matching */
  postTailorMatchStatus: string
  /** Sets the tailored resume match analysis result */
  setPostTailorLlmResult: (result: LLMAnalysisOutput | null) => void
  /** Sets tailored resume matching loading state */
  setIsPostTailorMatching: (isMatching: boolean) => void
  /** Updates tailored resume match progress status */
  setPostTailorMatchStatus: (status: string) => void

  // Resume Template & Zoom State
  /** Selected visual styling template for the resume ('classic', 'modern', 'minimal') */
  canvasTemplate: 'classic' | 'modern' | 'minimal'
  /** Zoom scale multiplier for the interactive resume view */
  canvasZoom: number
  /** Sets the active visual resume template */
  setCanvasTemplate: (template: 'classic' | 'modern' | 'minimal') => void
  /** Sets the resume zoom scale level */
  setCanvasZoom: (zoom: number) => void

  /** Sets the parsed LLM match and gap analysis result */
  setLlmResult: (result: LLMAnalysisOutput | null) => void

  /** Sets the persisted llm_analysis row ID */
  setCurrentLlmAnalysisId: (id: string | null) => void
  /** Sets the persisted job record ID */
  setCurrentJobId: (id: string | null) => void

  /** Resets the entire store to its initial default state */
  resetStore: () => void
}

const initialTailoredResumeText = ''

const initialState = {
  userId: null,
  resumes: [],
  selectedResumeName: '',
  currentResume: null,
  currentJob: null,
  matches: [],
  sidebarCollapsed: false,
  sidebarTab: 'match' as const,
  isOutreachModalOpen: false,
  isMatching: false,
  matchStatus: '',
  isTailoring: false,
  tailoringStatus: 'idle' as TailoringStatus,
  tailoringProgress: 0,
  activeChangeDetail: null as TailorChangeDetail | null,
  isChangeModalOpen: false,
  isEditingResume: false,
  tailoredResumeText: initialTailoredResumeText,
  resolvedRequirementsData: null as Record<string, string> | null,
  resolutionQuestions: [] as ResolutionQuestion[],
  isGeneratingQuestions: false,
  tailoredResume: null as any,
  postTailorLlmResult: null as LLMAnalysisOutput | null,
  isPostTailorMatching: false,
  postTailorMatchStatus: '',
  llmResult: null as LLMAnalysisOutput | null,
  currentLlmAnalysisId: null as string | null,
  currentJobId: null as string | null,
  AnalyzedJD: [] as string[],
  scrapedJob: null as ScrapedJobData | null,
  theme: (typeof window !== 'undefined' && (window.localStorage.getItem('jobpilot-theme') as 'light' | 'dark')) || 'light',
  canvasTemplate: 'classic' as 'classic' | 'modern' | 'minimal',
  canvasZoom: 1.0
}

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('jobpilot-theme', theme)
    }
    set({ theme })
  },
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('jobpilot-theme', nextTheme)
      }
      return { theme: nextTheme }
    })
  },

  setUserId: (userId) => set({ userId }),
  setResumes: (resumes) =>
    set((state) => ({
      resumes,
      currentResume: state.currentResume || (resumes.length > 0 ? resumes[0] : null),
      selectedResumeName: state.selectedResumeName || (resumes.length > 0 ? resumes[0].name : '')
    })),
  setSelectedResumeName: (selectedResumeName) =>
    set((state) => {
      const found = state.resumes.find((r) => r.name === selectedResumeName) || null
      return {
        selectedResumeName,
        currentResume: found || state.currentResume
      }
    }),
  setCurrentResume: (currentResume) =>
    set({
      currentResume,
      selectedResumeName: currentResume?.name || ''
    }),
  setCurrentJob: (currentJob) => set({ currentJob }),
  setMatches: (matches) => set({ matches }),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setIsOutreachModalOpen: (isOutreachModalOpen) => set({ isOutreachModalOpen }),

  setIsMatching: (isMatching) => set({ isMatching }),
  setMatchStatus: (matchStatus) => set({ matchStatus }),
  setIsTailoring: (isTailoring) => set({ isTailoring }),

  setTailoringStatus: (tailoringStatus) => set({ tailoringStatus }),
  setTailoringProgress: (tailoringProgress) => set({ tailoringProgress }),
  setActiveChangeDetail: (activeChangeDetail) => set({ activeChangeDetail }),
  setIsChangeModalOpen: (isChangeModalOpen) => set({ isChangeModalOpen }),
  setIsEditingResume: (isEditingResume) => set({ isEditingResume }),
  setTailoredResumeText: (tailoredResumeText) => set({ tailoredResumeText }),
  setResolvedRequirementsData: (resolvedRequirementsData) => set({ resolvedRequirementsData }),
  setResolutionQuestions: (resolutionQuestions) => set({ resolutionQuestions }),
  setIsGeneratingQuestions: (isGeneratingQuestions) => set({ isGeneratingQuestions }),
  resetTailoringState: () => {
    if (typeof window !== 'undefined' && window.api?.redisSet) {
      try {
        window.api.redisSet('tailoring:state:default', {
          status: 'idle',
          progress: 0,
          updatedAt: new Date().toISOString()
        })
        window.api.redisSet('tailoring:status', 'idle')
        window.api.redisSet('tailoring:progress', 0)
      } catch (err) {
        Logger.warn('zustandStore.ts', 'resetTailoringState', 'Failed to reset Redis tailoring state', err)
      }
    }
    set({
      isTailoring: false,
      tailoringStatus: 'idle',
      tailoringProgress: 0,
      activeChangeDetail: null,
      isChangeModalOpen: false,
      isEditingResume: false,
      tailoredResumeText: initialTailoredResumeText,
      resolvedRequirementsData: null,
      resolutionQuestions: [],
      isGeneratingQuestions: false,
      tailoredResume: null,
      postTailorLlmResult: null,
      isPostTailorMatching: false,
      postTailorMatchStatus: '',
      canvasTemplate: 'classic',
      canvasZoom: 1.0
    })
  },

  setTailoredResume: (tailoredResume) => set({ tailoredResume }),
  setPostTailorLlmResult: (postTailorLlmResult) => set({ postTailorLlmResult }),
  setIsPostTailorMatching: (isPostTailorMatching) => set({ isPostTailorMatching }),
  setPostTailorMatchStatus: (postTailorMatchStatus) => set({ postTailorMatchStatus }),

  setCanvasTemplate: (canvasTemplate) => set({ canvasTemplate }),
  setCanvasZoom: (canvasZoom) => set({ canvasZoom }),

  setLlmResult: (llmResult) => set({ llmResult }),
  setCurrentLlmAnalysisId: (currentLlmAnalysisId) => set({ currentLlmAnalysisId }),
  setCurrentJobId: (currentJobId) => set({ currentJobId }),

  setAnalyzedJD: (jd: string[]) => set({ AnalyzedJD: jd }),

  setScrapedJob: (scrapedJob) => set({ scrapedJob }),

  resetStore: () => set(initialState)
}))
