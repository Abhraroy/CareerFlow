import React from 'react'
import { LuBriefcase, LuCheckCheck, LuPlus, LuSend, LuStar, LuUser } from '../icons'
import { ApplicationItem } from './types'

interface ApplicationsHeaderProps {
  applications: ApplicationItem[]
  onOpenNewApplicationModal: () => void
}

export function ApplicationsHeader({
  applications,
  onOpenNewApplicationModal
}: ApplicationsHeaderProps): React.JSX.Element {
  const totalCount = applications.length
  const shortlistedCount = applications.filter(
    (a) => a.shortlisted || a.status === 'shortlisted'
  ).length
  const interviewingCount = applications.filter((a) => a.status === 'interviewing').length
  const offerCount = applications.filter((a) => a.status === 'offer').length

  const stats = [
    {
      label: 'Total Tracked',
      value: totalCount,
      icon: LuBriefcase,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/20'
    },
    {
      label: 'Shortlisted & Review',
      value: shortlistedCount,
      icon: LuStar,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Interviewing Stage',
      value: interviewingCount,
      icon: LuUser,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-500/20'
    },
    {
      label: 'Active Offers',
      value: offerCount,
      icon: LuCheckCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/20'
    }
  ]

  return (
    <div className="flex flex-col gap-6 pb-2 select-none">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 border border-black/5 dark:border-white/10 text-[11px] font-bold tracking-wide uppercase">
              Applications Tracker
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <LuSend className="w-6 h-6 text-neutral-900 dark:text-white" />
            Application Pipeline
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl font-medium">
            Track job submissions, interview stages, follow-ups, and auto-applied listings in one unified place.
          </p>
        </div>

        {/* Primary Log Application Button matching reference design */}
        <button
          onClick={onOpenNewApplicationModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 font-bold text-xs rounded-xl shadow-xs transition-all duration-150 shrink-0 cursor-pointer"
        >
          <LuPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Application</span>
        </button>
      </div>

      {/* KPI Cards Grid matching reference photos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-md shadow-slate-200/60 dark:shadow-none relative overflow-hidden group hover:border-slate-300 dark:hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{stat.label}</span>
                <div className={`p-2 rounded-xl border ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{stat.value}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
