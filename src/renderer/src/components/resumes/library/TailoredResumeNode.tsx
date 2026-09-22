import React, { useState, useRef, useEffect } from 'react'
import { Resume } from '../../../types'
import { LuCircleCheck, LuEllipsis, LuFolderOpen, LuGitCompare, LuPencil, LuSparkles, LuTrash2 } from '../../icons'

interface TailoredResumeNodeProps {
  resume: Resume
  parentResume?: Resume
  isLast: boolean
  onOpen: (resume: Resume) => void
  onCompare: (resume: Resume, parentResume?: Resume) => void
  onRename: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  searchHighlight?: string
}

export function TailoredResumeNode({
  resume,
  parentResume,
  isLast,
  onOpen,
  onCompare,
  onRename,
  onDelete
}: TailoredResumeNodeProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // Extract ATS / Match metrics if present
  const metrics = resume.tailoringMetadata?.validationMetrics
  const matchScore = metrics ? metrics.atsQuality || metrics.truthfulness : null

  return (
    <div className="relative flex items-center pl-7 py-1">
      {/* Tree Line Connector */}
      <div
        className={`absolute left-3.5 top-0 w-px bg-neutral-200 dark:bg-neutral-800 transition-colors duration-200 ${
          isLast ? 'h-5' : 'h-full'
        }`}
      />

      {/* Tree Line Connector: Horizontal Branch Hook */}
      <div className="absolute left-3.5 top-5 w-3.5 h-px bg-neutral-200 dark:bg-neutral-800 rounded-bl" />

      {/* Node Card */}
      <div className="group flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 border border-purple-500/20 transition-all duration-200 cursor-pointer select-none shadow-xs">
        {/* Left: Sparkle Icon + Title & Context */}
        <div
          className="flex items-center gap-2.5 min-w-0 flex-1"
          onClick={() => onOpen(resume)}
        >
          {/* Sparkle Icon */}
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 font-bold">
            <LuSparkles className="w-3.5 h-3.5" />
          </div>

          {/* Name & Target */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">
                {resume.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase tracking-wider bg-purple-200/60 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/20 shrink-0">
                Tailored
              </span>
            </div>

            {parentResume && (
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
                From: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{parentResume.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: ATS Metric & Action Menu */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {matchScore && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
              <LuCircleCheck className="w-3 h-3" />
              <span>{matchScore}% Fit</span>
            </div>
          )}

          {/* Quick Compare button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onCompare(resume, parentResume)
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-xs font-bold border border-purple-500/20 transition-all cursor-pointer shadow-xs"
            title="Compare with Base Resume"
          >
            <LuGitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>

          {/* Action Menu Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <LuEllipsis className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 shadow-xl py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onOpen(resume)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <LuFolderOpen className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Open Tailored</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onCompare(resume, parentResume)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
                >
                  <LuGitCompare className="w-3.5 h-3.5" />
                  <span>Compare Diff</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onRename(resume)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <LuPencil className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Rename</span>
                </button>

                <div className="h-px bg-black/5 dark:bg-white/10 my-1" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(resume)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                  <span>Delete Tailored</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
