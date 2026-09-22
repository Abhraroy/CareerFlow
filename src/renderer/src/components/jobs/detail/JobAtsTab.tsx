import React from 'react'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'

interface JobAtsTabProps {
  llmAnalysis: LLMAnalysisOutput | null
}

/**
 * Tab Content: ATS & Keywords.
 * Displays ATS keyword analysis summary or status note.
 */
export function JobAtsTab({ llmAnalysis }: JobAtsTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {llmAnalysis ? (
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-2 text-xs text-slate-600 dark:text-neutral-400 font-medium italic shadow-xs">
          ATS keyword optimization and target term matching are automatically conducted during full resume tailoring.
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3">
            ✓ Keywords Already Covered
          </span>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 dark:text-neutral-500 italic">None specified yet</span>
          </div>
        </div>
      )}
    </div>
  )
}
