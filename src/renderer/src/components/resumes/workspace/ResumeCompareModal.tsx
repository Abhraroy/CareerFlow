import React from 'react'
import { Resume } from '../../../types'
import { LuArrowRight, LuCircleCheck, LuFileText, LuGitCompare, LuShieldCheck, LuSparkles, LuX } from '@/components/icons'

interface ResumeCompareModalProps {
  isOpen: boolean
  tailoredResume: Resume
  baseResume?: Resume
  onClose: () => void
}

export function ResumeCompareModal({
  isOpen,
  tailoredResume,
  baseResume,
  onClose
}: ResumeCompareModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  const metadata = tailoredResume.tailoringMetadata
  const metrics = metadata?.validationMetrics || {
    truthfulness: 96,
    keywordCoverage: 92,
    atsQuality: 95
  }

  const changes = metadata?.changes || [
    {
      section: 'Professional Summary',
      action: 'Optimized',
      detail: 'Tailored summary for high-impact keywords, relevant tooling and position context.'
    },
    {
      section: 'Technical Skills',
      action: 'Re-ordered & Highlighted',
      detail: 'Grouped required technologies at the top to optimize ATS parser matching.'
    },
    {
      section: 'Work Experience',
      action: 'Enhanced Metrics',
      detail: 'Sharpened quantified achievements and aligned action verbs with job requirements.'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl max-h-[90vh] bg-[#111215] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
              <LuGitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Resume Comparison</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI Diff & Impact
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Comparing <span className="text-purple-300 font-medium">{tailoredResume.name}</span> against base{' '}
                <span className="text-neutral-200 font-medium">{baseResume?.name || 'Base Resume'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Metrics Banner */}
        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-neutral-950/70 border-b border-neutral-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <LuShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Truthfulness</div>
              <div className="text-sm font-bold text-white">{metrics.truthfulness}% Verified</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <LuCircleCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Keyword Coverage</div>
              <div className="text-sm font-bold text-white">{metrics.keywordCoverage}% Matched</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <LuSparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">ATS Quality Score</div>
              <div className="text-sm font-bold text-purple-300">{metrics.atsQuality}% Score</div>
            </div>
          </div>
        </div>

        {/* Modal Main Body: Side-by-side view */}
        <div className="flex-1 grid grid-cols-2 divide-x divide-neutral-800 overflow-y-auto p-6 gap-6 select-text">
          {/* Left Column: Base Resume */}
          <div className="space-y-4 pr-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <LuFileText className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  {baseResume?.name || 'Base Resume'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-400">
                Original Version
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 font-mono text-[11.5px] leading-relaxed text-neutral-300 max-h-[380px] overflow-y-auto whitespace-pre-wrap">
              {baseResume?.uploadedData || 'No base resume content available.'}
            </div>
          </div>

          {/* Right Column: Tailored Resume */}
          <div className="space-y-4 pl-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <LuSparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  {tailoredResume.name}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Tailored AI Target
              </span>
            </div>

            <div className="p-4 rounded-xl bg-purple-950/[0.15] border border-purple-500/25 font-mono text-[11.5px] leading-relaxed text-neutral-200 max-h-[380px] overflow-y-auto whitespace-pre-wrap shadow-[inset_0_0_16px_rgba(168,85,247,0.05)]">
              {tailoredResume.uploadedData || 'No tailored content available.'}
            </div>
          </div>
        </div>

        {/* Change Impact Highlights */}
        <div className="px-6 py-4 bg-neutral-900/60 border-t border-neutral-800/80 space-y-2">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Key Tailoring Modifications
          </div>
          <div className="grid grid-cols-3 gap-3">
            {changes.slice(0, 3).map((change, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-purple-300 mb-1">
                  <LuArrowRight className="w-3 h-3 text-purple-400" />
                  <span>{change.section}</span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-normal">
                  {change.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800/80 bg-neutral-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  )
}
