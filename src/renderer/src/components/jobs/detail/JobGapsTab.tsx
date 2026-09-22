import React from 'react'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'

interface JobGapsTabProps {
  llmAnalysis: LLMAnalysisOutput | null
  skillScore: number
  experienceScore: number
  semanticScore: number
}

/**
 * Tab Content: Gaps Analysis.
 * Displays key gaps identified by LLM analysis or fallback category score cards.
 */
export function JobGapsTab({
  llmAnalysis,
  skillScore,
  experienceScore,
  semanticScore
}: JobGapsTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {llmAnalysis ? (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider border-b border-rose-500/20 pb-3 flex items-center gap-2">
            <span>⚠ Identified Key Gaps</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 font-bold">
              {llmAnalysis.keyGaps?.length || 0}
            </span>
          </span>
          <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
            {llmAnalysis.keyGaps?.map((gapItem, idx) => (
              <li key={idx} className="marker:text-rose-500">
                {gapItem}
              </li>
            ))}
            {(!llmAnalysis.keyGaps || llmAnalysis.keyGaps.length === 0) && (
              <li className="text-slate-500 dark:text-neutral-500 italic">No key gaps identified</li>
            )}
          </ul>
        </div>
      ) : (
        /* Fallback when no analysis */
        <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
          <span className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3">
            Fit Score Breakdown by Category
          </span>
          <div className="flex flex-col gap-3 text-xs">
            <div className="flex justify-between items-center bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 p-3.5 rounded-xl font-medium">
              <span className="text-slate-600 dark:text-neutral-400">Skills Alignment:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{skillScore}%</span>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 p-3.5 rounded-xl font-medium">
              <span className="text-slate-600 dark:text-neutral-400">Experience Alignment:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{experienceScore}%</span>
            </div>
            <div className="flex justify-between items-center bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 p-3.5 rounded-xl font-medium">
              <span className="text-slate-600 dark:text-neutral-400">Semantic Similarity:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{semanticScore}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
