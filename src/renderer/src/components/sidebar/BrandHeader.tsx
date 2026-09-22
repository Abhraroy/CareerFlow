import React from 'react'
import { LuChevronLeft } from '../icons'

interface BrandHeaderProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function BrandHeader({
  collapsed = false,
  onToggleCollapse
}: BrandHeaderProps): React.JSX.Element {
  return (
    <div
      className={`flex items-center ${
        collapsed ? 'flex-col gap-3 justify-center' : 'justify-between'
      } px-4 py-4 border-b border-[var(--border-sidebar)] select-none transition-all duration-200`}
    >
      {/* Brand logo (Sparkle Emblem matching screenshot) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-sm transition-all">
          {/* Geometric 4-point star matching reference image */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>

        {!collapsed && (
          <span className="text-[15px] font-bold text-[var(--text-main)] tracking-tight truncate">
            JobCopilot
          </span>
        )}
      </div>

      {/* Header Actions: Collapse toggle */}
      {!collapsed ? (
        <div className="flex items-center gap-1.5">

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-black/5 dark:border-white/10 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <LuChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-black/5 dark:border-white/10 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <LuChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )
      )}
    </div>
  )
}
