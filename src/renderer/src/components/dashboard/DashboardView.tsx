import React, { useEffect, useState, useCallback } from 'react'
import { useNavigation } from '../../navigation/useNavigation'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { fetchDashboardMetrics, DashboardMetrics } from '../../supabase_utils/dashboardUtils'
import Logger from '@utils/logger'
import {
  LuPlus,
  LuFileText,
  LuRefreshCw,
  LuBriefcase,
  LuTrendingUp,
  LuSparkles,
  LuArrowUpRight,
  LuClock,
  LuTarget
} from 'react-icons/lu'
import { FiArrowUpRight, FiCheckCircle } from 'react-icons/fi'

interface DashboardViewProps {
  session?: Session
  supabase?: SupabaseClient
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzedMatches?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resumes?: any[]
}

export function DashboardView({ session }: DashboardViewProps): React.JSX.Element {
  const { goToJobs, goToResumes, goToApplications, goToJobMatch } = useNavigation()

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const userId = session?.user?.id

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchDashboardMetrics(userId)
      setMetrics(data)
    } catch (err) {
      Logger.error('DashboardView.tsx', 'loadData', 'Failed to load dashboard metrics', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Metric Cards configuration using real pipeline data
  const totalApps = metrics?.totalApplications ?? 0
  const avgScore = metrics?.avgFitScore ?? 0
  const interviews = metrics?.interviewsCount ?? 0
  const savedJobs = metrics?.savedJobsCount ?? 0
  const conversionRate = metrics?.conversionRate ?? 0
  const tailoredCount = metrics?.tailoredResumesCount ?? 0

  const stats = [
    {
      title: 'Total Applications',
      value: String(totalApps),
      subtext: `${metrics?.appliedCount ?? 0} active, ${metrics?.shortlistedCount ?? 0} shortlisted`,
      icon: LuFileText,
      highlight: false
    },
    {
      title: 'Avg. Match Score',
      value: `${avgScore}%`,
      subtext: avgScore >= 75 ? 'High alignment' : avgScore > 0 ? 'Requires tailoring' : 'No matches yet',
      icon: LuTarget,
      highlight: avgScore >= 75
    },
    {
      title: 'Interviews & Offers',
      value: String(interviews + (metrics?.offersCount ?? 0)),
      subtext: `${conversionRate}% conversion rate`,
      icon: FiCheckCircle,
      highlight: true
    },
    {
      title: 'Saved & Evaluated Jobs',
      value: String(savedJobs),
      subtext: `${tailoredCount} AI tailored resumes`,
      icon: LuBriefcase,
      highlight: false
    }
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-y-auto p-6 md:p-8 text-[var(--text-main)] select-none transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
            Real-time pipeline performance & application insights
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={loadData}
            title="Refresh dashboard data"
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-xs text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <LuRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* View Applications */}
          <button
            onClick={() => goToApplications()}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-xs text-xs font-bold text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LuFileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Applications</span>
          </button>

          {/* Jobs Page */}
          <button
            onClick={() => goToJobs()}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-xs text-xs font-bold text-slate-800 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LuBriefcase className="w-3.5 h-3.5 text-slate-500" />
            <span>Jobs</span>
          </button>

          {/* New Resume / Tailor */}
          <button
            onClick={() => goToResumes()}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-slate-900/10 dark:shadow-none"
          >
            <LuPlus className="w-4 h-4" />
            <span>New Resume</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-none flex flex-col justify-between transition-all dark:hover:border-white/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 dark:text-neutral-400">
                {stat.title}
              </span>
              <stat.icon className="w-4 h-4 text-slate-400 dark:text-neutral-500" />
            </div>

            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight my-1">
              {isLoading ? '...' : stat.value}
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-neutral-400 mt-2">
              <FiArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              <span>{stat.subtext}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Activity Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Job Pipeline Bar Visualizer */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Applications Pipeline
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                Monthly application trend
              </span>
            </div>
            <button
              onClick={() => goToApplications()}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-[11px] font-bold flex items-center gap-1 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 shadow-xs cursor-pointer"
            >
              <LuFileText className="w-3 h-3" /> View All
            </button>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 px-2 pt-4">
            {metrics?.monthlyPipeline && metrics.monthlyPipeline.length > 0 ? (
              metrics.monthlyPipeline.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-extrabold text-slate-700 dark:text-neutral-300">
                    {bar.count}
                  </span>
                  <div
                    className={`w-full rounded-md transition-all ${
                      i === metrics.monthlyPipeline.length - 1
                        ? 'bg-slate-900 dark:bg-white'
                        : 'bg-slate-200 dark:bg-neutral-800'
                    }`}
                    style={{ height: bar.heightPct }}
                  />
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-bold">
                    {bar.label}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-neutral-500 font-medium">
                No monthly data yet
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Concentric Match Score Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Match Score Tiers
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                Fit quality breakdown
              </span>
            </div>
            <button
              onClick={() => goToJobs()}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-[11px] font-bold flex items-center gap-1 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              <LuBriefcase className="w-3 h-3" /> Jobs
            </button>
          </div>

          <div className="relative flex items-center justify-center py-4">
            <div className="w-36 h-36 rounded-full border-8 border-emerald-500 border-t-amber-400 border-r-slate-300 dark:border-r-neutral-700 flex items-center justify-center flex-col shadow-xs">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {avgScore}%
              </span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400">
                Avg Fit Score
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] font-bold text-slate-600 dark:text-neutral-400">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> High (
              {metrics?.scoreDistribution.high ?? 0})
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Moderate (
              {metrics?.scoreDistribution.moderate ?? 0})
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Low (
              {metrics?.scoreDistribution.low ?? 0})
            </div>
          </div>
        </div>

        {/* Card 3: Application Funnel & AI Tailoring Insights */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pipeline Stages & AI
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                Funnel progress & AI tailoring
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
              <LuSparkles className="w-3 h-3" /> {tailoredCount} Resumes AI Tailored
            </span>
          </div>

          {/* Funnel Progress Bars */}
          <div className="flex flex-col gap-3 py-2">
            {[
              {
                label: 'Applied',
                count: metrics?.appliedCount ?? 0,
                color: 'bg-blue-500'
              },
              {
                label: 'Shortlisted',
                count: metrics?.shortlistedCount ?? 0,
                color: 'bg-purple-500'
              },
              {
                label: 'Interviewing',
                count: metrics?.interviewsCount ?? 0,
                color: 'bg-amber-500'
              },
              {
                label: 'Offers',
                count: metrics?.offersCount ?? 0,
                color: 'bg-emerald-500'
              }
            ].map((stage, i) => {
              const maxCount = Math.max(totalApps, 1)
              const pct = Math.min(100, Math.round((stage.count / maxCount) * 100))
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                    <span>{stage.label}</span>
                    <span className="text-slate-900 dark:text-white">{stage.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(pct, stage.count > 0 ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-100 dark:border-white/5">
            <span className="flex items-center gap-1">
              <LuTrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Conversion: {conversionRate}%
            </span>
            <span>Tokens: {metrics?.totalAiTokens ? (metrics.totalAiTokens / 1000).toFixed(1) + 'k' : '0'}</span>
          </div>
        </div>
      </div>

      {/* Recent Applications & Evaluated Matches Table */}
      <div className="rounded-2xl bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-none p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Job Applications & Evaluated Matches
            </h3>
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-bold">
              {metrics?.recentItems.length ?? 0} recent active records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToApplications()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <LuFileText className="w-3.5 h-3.5" /> All Applications
            </button>
            <button
              onClick={() => goToJobs()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <LuPlus className="w-3.5 h-3.5" /> View Jobs
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {metrics?.recentItems && metrics.recentItems.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Role & Company</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Fit Match Score</th>
                  <th className="pb-3">Categories</th>
                  <th className="pb-3 pr-2 text-right">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {metrics.recentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 pl-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black flex items-center justify-center shrink-0 text-xs shadow-xs uppercase">
                        {item.company.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white leading-tight">
                          {item.role}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-neutral-400 font-semibold">
                          {item.company}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-neutral-400 font-bold">
                      <span className="flex items-center gap-1">
                        <LuClock className="w-3 h-3 text-slate-400" /> {item.date}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                          item.matchScore >= 80
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : item.matchScore >= 50
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        {item.matchScore}% Fit
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5">
                        {item.categories.map((cat, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/10"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => item.jobId ? goToJobMatch(item.jobId) : goToJobs()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                      >
                        <FiCheckCircle className="w-3 h-3" />
                        <span>{item.status}</span>
                        <LuArrowUpRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <LuBriefcase className="w-10 h-10 text-slate-300 dark:text-neutral-600 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">
                No recent pipeline activity yet
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm my-1">
                Scrape or import a job posting to evaluate your fit score and generate your first application!
              </p>
              <button
                onClick={() => goToJobs()}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-neutral-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LuPlus className="w-3.5 h-3.5" /> Explore Jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
