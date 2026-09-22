import React from 'react'
import { BackButton } from '@/components/BackButton'
import { TailoringFlowState } from './types'
import { TailoringResult } from '@/utils/tailorEngine'

interface JobMatchDetailHeaderProps {
  company: string
  title: string
  hasLlmAnalysis: boolean
  tailoringFlow: TailoringFlowState
  tailoring: boolean
  tailoredResult: TailoringResult | null
  jobUrl?: string
  copiedReport: boolean
  onNavigateToTailorResume: () => void
  onCopyReport: () => void
}

/**
 * Top sticky header with back navigation, company/job header titles,
 * LLM badge, primary "Tailor Resume" CTA, job link, and export report button.
 */
export function JobMatchDetailHeader({
  company,
  title,
  hasLlmAnalysis,
  tailoringFlow,
  tailoring,
  tailoredResult,
  jobUrl,
  copiedReport,
  onNavigateToTailorResume,
  onCopyReport
}: JobMatchDetailHeaderProps): React.JSX.Element {
  return (
    <div className="sticky top-0 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-xl z-30 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-white/10 pb-5 pt-2 px-1 gap-4 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <BackButton title="Go back to previous page" />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {company || 'Unknown Company'}
            </h1>
            {hasLlmAnalysis && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider shadow-xs">
                AI Analysis Ready
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-neutral-400 mt-0.5">{title}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Primary CTA: Tailor Resume */}
        {tailoringFlow === 'idle' && !tailoredResult && (
          <button
            onClick={onNavigateToTailorResume}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] select-none"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 21l8.982-8.983m-1.785-1.785L19.5 7.5l-3-3M6.31 16.484c-1.464 1.464-3.528 2.249-4.81 2.249 0 0 .785-3.346 2.249-4.81m1.11 1.11L15.353 4.5l3.147 3.146L6.31 16.484z"
              />
            </svg>
            ✨ Tailor Resume
          </button>
        )}
        {tailoring && (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 animate-pulse shadow-xs">
            <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Tailoring Resume…</span>
          </div>
        )}
        {tailoredResult && (
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-1.5 shadow-xs">
            <span>✓ Resume Tailored</span>
          </div>
        )}

        {jobUrl && (
          <button
            onClick={() => window.open(jobUrl, '_blank')}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-slate-800 dark:text-white shadow-xs"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open Link
          </button>
        )}

        <button
          onClick={onCopyReport}
          className="px-3.5 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-slate-800 dark:text-white shadow-xs"
        >
          {copiedReport ? (
            <>
              <svg
                className="w-3.5 h-3.5 text-emerald-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Report Copied!
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Export Report
            </>
          )}
        </button>
      </div>
    </div>
  )
}
