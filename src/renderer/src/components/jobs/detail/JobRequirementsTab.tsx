import React from 'react'
import { LLMAnalysisOutput } from '../../../../../utils/zodSchema'

interface JobRequirementsTabProps {
  llmAnalysis: LLMAnalysisOutput | null
  legacyRequirements: any[]
  warnings: string[]
}

/**
 * Tab Content: Requirements Analysis.
 * Displays supported strong matches, individual requirements cards with priority/evidence tags,
 * evidence excerpts, and actionable tailoring advice.
 */
export function JobRequirementsTab({
  llmAnalysis,
  legacyRequirements,
  warnings
}: JobRequirementsTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {llmAnalysis ? (
        <div className="flex flex-col gap-3">
          {/* Strong Matches Card */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex flex-col gap-3 shadow-xs">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-3">
              ✓ Supported Strong Matches
            </span>
            <ul className="list-disc list-inside flex flex-col gap-2 text-xs text-slate-800 dark:text-neutral-200 font-medium">
              {llmAnalysis.strongMatches?.map((matchItem, idx) => (
                <li key={idx} className="marker:text-emerald-500">
                  {matchItem}
                </li>
              ))}
              {(!llmAnalysis.strongMatches || llmAnalysis.strongMatches.length === 0) && (
                <li className="text-slate-500 dark:text-neutral-500 italic">No strong matches specified</li>
              )}
            </ul>
          </div>

          {/* Detailed Requirements Breakdown */}
          {llmAnalysis.requirements && llmAnalysis.requirements.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider px-1">
                Detailed Requirement Breakdown ({llmAnalysis.requirements.length})
              </span>
              {llmAnalysis.requirements.map((req: any, idx: number) => (
                <div
                  key={req.id || idx}
                  className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-xs flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-900 dark:text-white font-bold break-words leading-tight flex-1 text-xs">
                      {req.requirement}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold ${
                          req.priority === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                            : req.priority === 'REQUIRED'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              : req.priority === 'PREFERRED'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-neutral-400'
                        }`}
                      >
                        {req.priority}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold ${
                          req.match === 'MATCHED'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : req.match === 'PARTIAL'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {req.match}
                      </span>
                      {req.evidenceLevel && req.evidenceLevel !== 'NONE' && (
                        <span className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-white/10">
                          {req.evidenceLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  {req.resumeEvidence && (
                    <p className="text-slate-600 dark:text-neutral-400 text-[11px] leading-relaxed italic bg-white dark:bg-black/30 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5 font-medium">
                      <span className="font-bold text-slate-500 dark:text-neutral-400 not-italic">Evidence: </span>
                      {req.resumeEvidence}
                    </p>
                  )}
                  {req.resumeAction && req.resumeAction !== 'None required.' && (
                    <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed font-semibold">
                      <span className="font-bold text-amber-600 dark:text-amber-500">Action: </span>
                      {req.resumeAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Fallback to legacy requirements */
        <div className="flex flex-col gap-3">
          {warnings.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-xs text-rose-700 dark:text-rose-400 flex flex-col gap-1 font-semibold">
              {warnings.map((w, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
          {legacyRequirements.map((req: any, idx: number) => (
            <div
              key={idx}
              className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-4 rounded-2xl text-xs flex flex-col gap-2 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-900 dark:text-white font-bold break-words leading-tight">
                  {req.text}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold shrink-0 ${
                    req.status === 'MATCH'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                      : req.status === 'PARTIAL'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {req.status}
                </span>
              </div>
              {req.evidence && (
                <p className="text-slate-600 dark:text-neutral-400 text-[11px] leading-relaxed italic font-medium">
                  {req.evidence}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
