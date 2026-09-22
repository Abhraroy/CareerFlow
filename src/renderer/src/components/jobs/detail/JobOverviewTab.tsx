import React from 'react'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'

interface JobOverviewTabProps {
  llmAnalysis: LLMAnalysisOutput | null
  verdictDecision: string
  rationale: string
}

/**
 * Tab Content: Overview & Verdict. Displays either LLM Analysis overview
 * (score explanation, strong matches, key gaps, recommended improvements)
 * or legacy final verdict rationale.
 */
export function JobOverviewTab({
  llmAnalysis,
  verdictDecision,
  rationale
}: JobOverviewTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      {llmAnalysis ? (
        <>
          {/* Simplified LLM Overview card */}
          <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
              <span className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider">
                Match Score Explanation
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {llmAnalysis.fitScore}%
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
              {llmAnalysis.scoreExplanation ||
                'This score is calculated based on requirements evidence matching, key resume gaps, and suggested improvements.'}
            </p>
          </div>

          {/* Strong Matches */}
          {llmAnalysis.strongMatches && llmAnalysis.strongMatches.length > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-3 flex items-center gap-2">
                <span>✓ Strong Matches</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 font-bold">
                  {llmAnalysis.strongMatches.length}
                </span>
              </span>
              <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
                {llmAnalysis.strongMatches.map((m, idx) => (
                  <li key={idx} className="marker:text-emerald-500">
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Gaps */}
          {llmAnalysis.keyGaps && llmAnalysis.keyGaps.length > 0 && (
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
              <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider border-b border-rose-500/20 pb-3 flex items-center gap-2">
                <span>⚠ Key Gaps</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/20 font-bold">
                  {llmAnalysis.keyGaps.length}
                </span>
              </span>
              <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
                {llmAnalysis.keyGaps.map((g, idx) => (
                  <li key={idx} className="marker:text-rose-500">
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resume Improvements */}
          {llmAnalysis.resumeImprovements && llmAnalysis.resumeImprovements.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-3 flex items-center gap-2">
                <span>★ Recommended Improvements</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 font-bold">
                  {llmAnalysis.resumeImprovements.length}
                </span>
              </span>
              <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
                {llmAnalysis.resumeImprovements.map((imp, idx) => (
                  <li key={idx} className="marker:text-amber-500">
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Final Verdict Card */}
          <div className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-3">
              <span className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider">
                Final Verdict
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-xl font-bold ${
                  verdictDecision.includes('Strongly') ||
                  verdictDecision.includes('Recommended to Apply')
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                    : verdictDecision.includes('Apply After')
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                {verdictDecision}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
              {rationale}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
