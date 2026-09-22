import React from 'react'
import { DetailTab } from './types'

interface JobDetailTabsNavProps {
  activeTab: DetailTab
  setActiveTab: (tab: DetailTab) => void
  requirementsCount: number
  hasCoverLetter: boolean
}

/**
 * Horizontal navigation bar for switching between detail view tabs.
 */
export function JobDetailTabsNav({
  activeTab,
  setActiveTab,
  requirementsCount,
  hasCoverLetter
}: JobDetailTabsNavProps): React.JSX.Element {
  return (
    <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/10 gap-2 text-xs font-bold scrollbar-none pb-3 transition-colors duration-200">
      <button
        onClick={() => setActiveTab('overview')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
          activeTab === 'overview'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        Overview & Verdict
      </button>
      <button
        onClick={() => setActiveTab('requirements')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
          activeTab === 'requirements'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        <span>Requirements</span>
        {requirementsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black">
            {requirementsCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setActiveTab('gaps')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
          activeTab === 'gaps'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        Gaps Analysis
      </button>
      <button
        onClick={() => setActiveTab('ats')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
          activeTab === 'ats'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        ATS Keywords
      </button>
      <button
        onClick={() => setActiveTab('improvements')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
          activeTab === 'improvements'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        Improvements
      </button>

      {hasCoverLetter && (
        <button
          onClick={() => setActiveTab('coverletter')}
          className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
            activeTab === 'coverletter'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
          }`}
        >
          Cover Letter
        </button>
      )}
      <button
        onClick={() => setActiveTab('description')}
        className={`px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
          activeTab === 'description'
            ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}
      >
        Job Description
      </button>
    </div>
  )
}
