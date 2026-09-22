import React from 'react'
import { TopChangesListProps } from './types'
import { LuChevronRight, LuSparkles } from '@/components/icons'

export function TopChangesList({
  changes,
  onViewFullAnalysis
}: TopChangesListProps): React.JSX.Element | null {
  if (!changes || changes.length === 0) return null

  // Show up to 3 changes initially
  const top3Changes = changes.slice(0, 3)
  const remainingCount = changes.length - 3

  return (
    <div className="flex flex-col gap-2.5 bg-neutral-950 border border-neutral-900 rounded-xl p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <LuSparkles className="w-3 h-3 text-amber-400" />
          TOP CHANGES BEFORE APPLYING
        </span>
        <span className="text-[10px] font-semibold text-neutral-500">
          {top3Changes.length} of {changes.length}
        </span>
      </div>

      {/* List of 3 changes */}
      <div className="flex flex-col gap-2">
        {top3Changes.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 text-xs text-neutral-200 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-850/60 leading-snug"
          >
            <span className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 font-medium text-neutral-300">{item}</span>
          </div>
        ))}
      </div>

      {/* View More / Full Analysis Action */}
      {onViewFullAnalysis && (
        <button
          type="button"
          onClick={onViewFullAnalysis}
          className="mt-1 w-full py-2 px-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group"
        >
          <span>
            {remainingCount > 0
              ? `View ${remainingCount} more changes & full analysis`
              : 'View full analysis breakdown'}
          </span>
          <LuChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  )
}
