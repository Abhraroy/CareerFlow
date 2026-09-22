import React from 'react'

interface JobsTableHeaderProps {
  allSelected: boolean
  someSelected: boolean
  onToggleSelectAll: () => void
}

export function JobsTableHeader({
  allSelected,
  someSelected,
  onToggleSelectAll
}: JobsTableHeaderProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-[20px_1fr_120px_1fr] items-center gap-4 px-5 py-3 border-b border-black/5 dark:border-white/10 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider select-none bg-neutral-50/80 dark:bg-[#1A1A1D]/80">
      {/* Checkbox column */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          role="checkbox"
          aria-checked={allSelected}
          aria-label="Select all jobs"
          onClick={onToggleSelectAll}
          className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer border ${
            allSelected
              ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
              : someSelected
                ? 'bg-neutral-400 border-neutral-400 text-white dark:bg-white/40 dark:border-white dark:text-neutral-900'
                : 'border-neutral-300 dark:border-white/20 hover:border-neutral-400 bg-white dark:bg-black/40'
          }`}
        >
          {allSelected && (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
            </svg>
          )}
          {!allSelected && someSelected && (
            <div className="w-2 h-0.5 bg-white dark:bg-neutral-900 rounded-full" />
          )}
        </button>
      </div>

      {/* Job Info Column */}
      <div className="min-w-0 pr-2">
        <span>Job</span>
      </div>

      {/* Match Score Column (Centered) */}
      <div className="text-center flex items-center justify-center">
        <span>Match Score</span>
      </div>

      {/* Actions Column (Right aligned) */}
      <div className="text-right">
        <span>Actions</span>
      </div>
    </div>
  )
}
