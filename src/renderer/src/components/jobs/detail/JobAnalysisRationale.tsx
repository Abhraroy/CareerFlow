import React from 'react'

interface JobAnalysisRationaleProps {
  rationale: string
}

/**
 * Card displaying analysis rationale and explanation of match verdict.
 */
export function JobAnalysisRationale({
  rationale
}: JobAnalysisRationaleProps): React.JSX.Element | null {
  if (!rationale) return null

  return (
    <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-2.5 shadow-md shadow-slate-200/50 dark:shadow-none transition-colors duration-200">
      <h3 className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-2.5">
        Analysis Summary
      </h3>
      <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
        {rationale}
      </p>
    </div>
  )
}
