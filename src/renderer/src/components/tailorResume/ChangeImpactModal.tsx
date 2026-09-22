import React from 'react'
import { FiCheckCircle, FiKey, FiLayers, FiX, FiZap } from '../icons'
import { useAppStore } from '../../lib/zustandStore'

export function ChangeImpactModal(): React.JSX.Element | null {
  const { isChangeModalOpen, activeChangeDetail, setIsChangeModalOpen } = useAppStore()

  if (!isChangeModalOpen || !activeChangeDetail) {
    return null
  }

  const {
    sectionName,
    title,
    impactBadge,
    impactScore,
    summaryOfChange,
    beforeText,
    afterText,
    keyImprovements,
    atsKeywordGains
  } = activeChangeDetail

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div
        className="bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-neutral-50 dark:bg-[#27272A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs">
              <FiZap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {sectionName}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {impactBadge} Impact
                </span>
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white leading-snug">{title}</h2>
            </div>
          </div>

          <button
            onClick={() => setIsChangeModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-6 text-sm text-neutral-800 dark:text-neutral-200">
          {/* Summary & Impact Banner */}
          <div className="bg-neutral-50 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <FiLayers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm">Modification Summary</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mt-0.5 font-medium">{summaryOfChange}</p>
              </div>
            </div>

            <div className="bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 text-center flex-shrink-0 self-stretch sm:self-auto flex sm:flex-col items-center justify-center gap-1 shadow-xs">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
                Predicted Gain
              </span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">{impactScore}</span>
            </div>
          </div>

          {/* Before vs After Diff Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20 dark:border-rose-900/40 rounded-xl p-4 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20 dark:border-rose-900/30">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Original / Before
                </span>
                <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
                  Weak framing
                </span>
              </div>
              <pre className="text-xs text-neutral-800 dark:text-neutral-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto bg-white dark:bg-black/40 p-3 rounded-lg border border-rose-500/20 dark:border-rose-950 font-medium">
                {beforeText}
              </pre>
            </div>

            {/* After */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/40 rounded-xl p-4 flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20 dark:border-emerald-900/30">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  Tailored / After
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                  Impact optimized
                </span>
              </div>
              <pre className="text-xs text-neutral-900 dark:text-neutral-100 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto bg-white dark:bg-black/40 p-3 rounded-lg border border-emerald-500/20 dark:border-emerald-950 font-medium">
                {afterText}
              </pre>
            </div>
          </div>

          {/* Key Improvements & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyImprovements && keyImprovements.length > 0 && (
              <div className="bg-neutral-50 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl p-4 flex flex-col gap-2 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Key Enhancements
                </h4>
                <ul className="flex flex-col gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                  {keyImprovements.map((imp, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {atsKeywordGains && atsKeywordGains.length > 0 && (
              <div className="bg-neutral-50 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl p-4 flex flex-col gap-2 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  ATS Keywords Added
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {atsKeywordGains.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 shadow-xs"
                    >
                      <FiKey className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#27272A] flex items-center justify-end">
          <button
            onClick={() => setIsChangeModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
