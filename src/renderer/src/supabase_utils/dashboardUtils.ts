import { supabase } from '../lib/supabase'
import { fetchApplications, JoinedApplicationData } from './applications'
import { getUserTailoredResumes, TailoredResumeRow } from './tailoredResumes'
import { getUserAiUsages } from './aiUsages'
import Logger from '@utils/logger'

export interface MonthlyPipelinePoint {
  label: string
  count: number
  heightPct: string
}

export interface DashboardRecentItem {
  id: string
  jobId?: string
  company: string
  role: string
  date: string
  matchScore: number
  status: 'In Progress' | 'Applied' | 'Shortlisted' | 'Interview' | 'Offer' | 'Rejected' | 'Evaluated'
  categories: string[]
  logo?: string | null
}

export interface DashboardMetrics {
  // Key Stats
  totalApplications: number
  interviewsCount: number
  offersCount: number
  shortlistedCount: number
  appliedCount: number
  rejectedCount: number
  savedJobsCount: number
  avgFitScore: number
  conversionRate: number
  tailoredResumesCount: number
  totalAiTokens: number
  aiOperationsCount: number

  // Visualizer Aggregations
  scoreDistribution: {
    high: number      // >= 80%
    moderate: number  // 50% - 79%
    low: number       // < 50%
  }
  monthlyPipeline: MonthlyPipelinePoint[]

  // Recent Table Items
  recentItems: DashboardRecentItem[]

  // Meta
  hasRealData: boolean
}

/**
 * Fetch and compute comprehensive dashboard analytics for the given user from Supabase.
 */
export async function fetchDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
  const defaultMetrics: DashboardMetrics = {
    totalApplications: 0,
    interviewsCount: 0,
    offersCount: 0,
    shortlistedCount: 0,
    appliedCount: 0,
    rejectedCount: 0,
    savedJobsCount: 0,
    avgFitScore: 0,
    conversionRate: 0,
    tailoredResumesCount: 0,
    totalAiTokens: 0,
    aiOperationsCount: 0,
    scoreDistribution: { high: 0, moderate: 0, low: 0 },
    monthlyPipeline: [],
    recentItems: [],
    hasRealData: false
  }

  if (!supabase || !userId) {
    return defaultMetrics
  }

  try {
    // Execute queries in parallel
    const [apps, scoresRes, jobsRes, tailoredResumes, aiUsages] = await Promise.all([
      fetchApplications(userId).catch(() => [] as JoinedApplicationData[]),
      supabase.from('scores').select('*, jobs(*)').eq('user_id', userId),
      supabase.from('jobs').select('*').eq('user_id', userId),
      getUserTailoredResumes(userId).catch(() => [] as TailoredResumeRow[]),
      getUserAiUsages(userId).catch(() => [])
    ])

    const scores = scoresRes.data || []
    const jobs = jobsRes.data || []

    const hasRealData =
      apps.length > 0 || scores.length > 0 || jobs.length > 0 || tailoredResumes.length > 0

    // 1. Key Status Counts
    const totalApplications = apps.length
    const interviewsCount = apps.filter((a) => a.status === 'interviewing').length
    const offersCount = apps.filter((a) => a.status === 'offer').length
    const shortlistedCount = apps.filter((a) => a.status === 'shortlisted').length
    const appliedCount = apps.filter((a) => a.status === 'applied').length
    const rejectedCount = apps.filter((a) => a.status === 'rejected').length
    const savedJobsCount = jobs.length

    const conversionRate =
      totalApplications > 0
        ? Math.round(((interviewsCount + offersCount) / totalApplications) * 100)
        : 0

    // 2. Average Fit Score & Score Distribution
    let totalScoreSum = 0
    let scoreCount = 0
    let highCount = 0
    let modCount = 0
    let lowCount = 0

    scores.forEach((s) => {
      const score = Number(s.fit_score || 0)
      totalScoreSum += score
      scoreCount++
      if (score >= 80) highCount++
      else if (score >= 50) modCount++
      else lowCount++
    })

    // If tailored resumes exist with fit scores, factor them in if scores are empty
    if (scoreCount === 0 && tailoredResumes.length > 0) {
      tailoredResumes.forEach((tr) => {
        const score = Number(tr.fit_score || 0)
        if (score > 0) {
          totalScoreSum += score
          scoreCount++
          if (score >= 80) highCount++
          else if (score >= 50) modCount++
          else lowCount++
        }
      })
    }

    const avgFitScore = scoreCount > 0 ? Math.round(totalScoreSum / scoreCount) : 0

    // 3. AI Tokens & Tailored Resumes Count
    const tailoredResumesCount = tailoredResumes.length
    const aiOperationsCount = aiUsages.length
    const totalAiTokens = aiUsages.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0)

    // 4. Monthly Pipeline Aggregation (Past 5 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthCountsMap: Record<string, number> = {}

    // Initialize last 5 months
    const now = new Date()
    const last5Months: { key: string; label: string }[] = []
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = monthNames[d.getMonth()]
      const key = `${d.getFullYear()}-${d.getMonth()}`
      last5Months.push({ key, label })
      monthCountsMap[key] = 0
    }

    apps.forEach((a) => {
      const d = new Date(a.applied_at || a.created_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (monthCountsMap[key] !== undefined) {
        monthCountsMap[key]++
      }
    })

    const maxMonthCount = Math.max(...Object.values(monthCountsMap), 1)
    const monthlyPipeline: MonthlyPipelinePoint[] = last5Months.map((m) => {
      const cnt = monthCountsMap[m.key] || 0
      const pct = Math.max(15, Math.round((cnt / maxMonthCount) * 100))
      return {
        label: m.label,
        count: cnt,
        heightPct: `${pct}%`
      }
    })

    // 5. Recent Activity List (Combine Apps and Job Scores)
    const recentList: DashboardRecentItem[] = []

    // Add up to 5 recent applications first
    apps.slice(0, 5).forEach((app) => {
      const dateObj = new Date(app.created_at || app.applied_at || Date.now())
      const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getFullYear()).slice(-2)}`
      
      let badge: DashboardRecentItem['status'] = 'Applied'
      if (app.status === 'in_progress') badge = 'In Progress'
      else if (app.status === 'interviewing') badge = 'Interview'
      else if (app.status === 'offer') badge = 'Offer'
      else if (app.status === 'shortlisted') badge = 'Shortlisted'
      else if (app.status === 'rejected') badge = 'Rejected'

      recentList.push({
        id: app.id,
        jobId: app.job_id,
        company: app.jobs?.company_name || 'Company',
        role: app.jobs?.job_title || 'Position',
        date: formattedDate,
        matchScore: app.calculatedFitScore || app.tailored_resumes?.fit_score || 75,
        status: badge,
        categories: ['Application', app.jobs?.job_title ? 'Active' : 'Job'],
        logo: app.jobs?.logo || null
      })
    })

    // If recent applications are fewer than 5, supplement with evaluated scores
    if (recentList.length < 5) {
      scores.slice(0, 5 - recentList.length).forEach((sc) => {
        const dateObj = new Date(sc.created_at || Date.now())
        const formattedDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getFullYear()).slice(-2)}`
        
        recentList.push({
          id: sc.id,
          jobId: sc.job_id,
          company: (sc.jobs as any)?.company_name || (sc.jobs as any)?.company || 'Company',
          role: (sc.jobs as any)?.job_title || (sc.jobs as any)?.title || 'Evaluated Role',
          date: formattedDate,
          matchScore: sc.fit_score || 0,
          status: 'Evaluated',
          categories: ['Matched', 'Evaluated'],
          logo: (sc.jobs as any)?.logo || null
        })
      })
    }

    return {
      totalApplications,
      interviewsCount,
      offersCount,
      shortlistedCount,
      appliedCount,
      rejectedCount,
      savedJobsCount,
      avgFitScore,
      conversionRate,
      tailoredResumesCount,
      totalAiTokens,
      aiOperationsCount,
      scoreDistribution: {
        high: highCount,
        moderate: modCount,
        low: lowCount
      },
      monthlyPipeline,
      recentItems: recentList,
      hasRealData
    }
  } catch (err) {
    Logger.error('dashboardUtils.ts', 'fetchDashboardMetrics', 'Error fetching dashboard metrics', err)
    return defaultMetrics
  }
}
