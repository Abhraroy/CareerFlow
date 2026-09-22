import React from 'react'
import { LuCopy, LuMaximize2, LuPrinter, LuZoomIn, LuZoomOut } from '../../icons'

interface ResumeCanvasToolbarProps {
  currentPage: number
  totalPages: number
  zoomPercent: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitWidth: () => void
  onPrint: () => void
  onCopyAll: () => void
}

export function ResumeCanvasToolbar({
  currentPage,
  totalPages,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  onPrint,
  onCopyAll
}: ResumeCanvasToolbarProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border border-black/10 dark:border-white/10 rounded-2xl shadow-xl text-xs text-neutral-800 dark:text-neutral-200 gap-4 select-none">
      {/* Left: Page count */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-800 dark:text-neutral-200 font-mono text-[11px] font-semibold border border-black/5 dark:border-white/10">
        <span className="font-bold text-neutral-900 dark:text-white">{currentPage}</span>
        <span className="opacity-40">/</span>
        <span>{totalPages}</span>
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 rounded-xl p-0.5">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Zoom out"
        >
          <LuZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-neutral-800 dark:text-neutral-200 font-mono text-[11px] font-bold min-w-[44px] text-center hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Reset zoom to 100%"
        >
          {zoomPercent}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Zoom in"
        >
          <LuZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onFitWidth}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
          title="Fit to width"
        >
          <LuMaximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Copy / Print Quick Actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onCopyAll}
          className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Copy full text"
        >
          <LuCopy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Print document"
        >
          <LuPrinter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
