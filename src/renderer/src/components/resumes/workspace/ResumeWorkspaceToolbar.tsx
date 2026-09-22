import React, { useState, useRef, useEffect } from 'react'
import { Resume } from '../../../types'
import { LuArrowLeft, LuEllipsis, LuGitCompare, LuPencil, LuPrinter, LuSparkles, LuTrash2 } from '../../icons'

interface ResumeWorkspaceToolbarProps {
  resume: Resume
  parentResume?: Resume
  isBase: boolean
  onBack: () => void
  onEdit: () => void
  onCompare: () => void
  onPrint: () => void
  onRename: () => void
  onDelete: () => void
}

export function ResumeWorkspaceToolbar({
  resume,
  parentResume,
  isBase,
  onBack,
  onEdit,
  onCompare,
  onPrint,
  onRename,
  onDelete
}: ResumeWorkspaceToolbarProps): React.JSX.Element {
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

  return (
    <div className="flex items-center justify-between px-6 py-3.5 bg-white/90 dark:bg-[#1E1E22]/95 backdrop-blur-xl border-b border-black/5 dark:border-white/10 select-none shrink-0 z-30 transition-colors duration-200 shadow-xs">
      {/* Left side: Back button + Title & Hierarchy Meta */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/[0.04] hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-xs group"
          title="Back to Resume Library"
        >
          <LuArrowLeft className="w-4 h-4 text-neutral-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Resumes</span>
        </button>

        <div className="h-5 w-px bg-black/5 dark:bg-white/10" />

        {/* Title & Badge */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-white truncate tracking-tight">
              {resume.name}
            </h1>

            {isBase ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-blue-500/20 dark:border-indigo-500/25 shrink-0">
                Base Resume
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/25 shrink-0 flex items-center gap-1">
                <LuSparkles className="w-2.5 h-2.5" />
                <span>Tailored Resume</span>
              </span>
            )}
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium truncate">
            {isBase ? (
              <span>Master root document</span>
            ) : parentResume ? (
              <span>
                Based on:{' '}
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{parentResume.name}</span>
              </span>
            ) : (
              <span>Tailored Document</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          <LuPencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        {/* Tailored: Compare Button */}
        {!isBase && (
          <button
            type="button"
            onClick={onCompare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-500/20 transition-all cursor-pointer shadow-xs"
          >
            <LuGitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
        )}

        {/* Print Button */}
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white text-xs font-semibold border border-black/5 dark:border-white/10 transition-colors cursor-pointer shadow-xs"
        >
          <LuPrinter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden sm:inline">Print</span>
        </button>

        {/* More Actions Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="More actions"
          >
            <LuEllipsis className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 shadow-xl py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onRename()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <LuPencil className="w-3.5 h-3.5 text-neutral-400" />
                <span>Rename Resume</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onPrint()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <LuPrinter className="w-3.5 h-3.5 text-neutral-400" />
                <span>Print Document</span>
              </button>

              <div className="h-px bg-black/5 dark:bg-white/10 my-1" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
              >
                <LuTrash2 className="w-3.5 h-3.5" />
                <span>Delete Resume</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
