import React from 'react'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'

interface JobImprovementsTabProps {
  llmAnalysis: LLMAnalysisOutput | null
  legacyResumeImprovements: string[]
}

/**
 * Tab Content: Resume Improvements.
 * Displays tailored improvement recommendations from LLM analysis or legacy match suggestions.
 */
export function JobImprovementsTab({
  llmAnalysis,
  legacyResumeImprovements
}: JobImprovementsTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {llmAnalysis ? (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-3 flex items-center gap-2">
            <span>★ Suggested Resume Improvements</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 font-bold">
              {llmAnalysis.resumeImprovements?.length || 0}
            </span>
          </span>
          <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
            {llmAnalysis.resumeImprovements?.map((imp, idx) => (
              <li key={idx} className="marker:text-amber-500">
                {imp}
              </li>
            ))}
            {(!llmAnalysis.resumeImprovements || llmAnalysis.resumeImprovements.length === 0) && (
              <li className="text-slate-500 dark:text-neutral-500 italic">No resume improvements specified</li>
            )}
          </ul>
        </div>
      ) : (
        /* Fallback to legacy suggestions */
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <h4 className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3">
            Resume Tailoring Suggestions
          </h4>
          <ul className="list-disc list-inside text-xs text-slate-800 dark:text-neutral-200 flex flex-col gap-2 leading-relaxed font-medium">
            {legacyResumeImprovements.map((imp: string, idx: number) => (
              <li key={idx} className="marker:text-amber-500">
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
