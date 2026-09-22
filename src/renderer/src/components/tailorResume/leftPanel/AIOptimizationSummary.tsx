import React from 'react'
import { FiCheck } from '../../icons'

const OPTIMIZATION_POINTS = [
  'Analyze job description',
  'Extract important keywords',
  'Optimize experience & skills',
  'Improve ATS match'
]

export function AIOptimizationSummary(): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-[#0D0F0F]/80 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-md shadow-slate-200/60 dark:shadow-none select-none">
      <h3 className="text-xs font-bold text-slate-500 dark:text-neutral-300 uppercase tracking-wider">
        AI will optimize
      </h3>

      <div className="flex flex-col gap-2.5">
        {OPTIMIZATION_POINTS.map((point) => (
          <div key={point} className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-neutral-300 font-semibold">
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <FiCheck className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{point}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
