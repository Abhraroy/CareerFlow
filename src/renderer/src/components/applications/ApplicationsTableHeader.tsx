import React from 'react'
import { LuStar } from '../icons'

export function ApplicationsTableHeader(): React.JSX.Element {
  return (
    <div className="hidden md:grid grid-cols-[36px_1fr_170px_90px_140px_90px_100px] items-center gap-4 px-4 py-2.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider select-none bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 rounded-xl mb-3">
      {/* 1. Shortlist Star Column */}
      <div className="flex items-center justify-center">
        <LuStar className="w-3.5 h-3.5 opacity-60" />
      </div>

      {/* 2. Job & Company Info Column */}
      <div className="min-w-0">
        <span>Job & Company</span>
      </div>

      {/* 3. Resume Used Column */}
      <div className="min-w-0">
        <span>Resume Used</span>
      </div>

      {/* 4. Match Score Column */}
      <div className="text-center">
        <span>Match</span>
      </div>

      {/* 5. Stage Status Column */}
      <div className="text-center">
        <span>Stage</span>
      </div>

      {/* 6. Applied Date Column */}
      <div className="text-center">
        <span>Applied</span>
      </div>

      {/* 7. Actions Column */}
      <div className="text-right">
        <span>Actions</span>
      </div>
    </div>
  )
}
