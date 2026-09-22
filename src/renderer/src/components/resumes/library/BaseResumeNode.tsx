import React, { useState, useRef, useEffect } from 'react'
import { Resume } from '../../../types'
import { LuChevronDown, LuChevronRight, LuEllipsis, LuFileText, LuFolderOpen, LuPencil, LuTrash2 } from '../../icons'

interface BaseResumeNodeProps {
  resume: Resume
  isExpanded: boolean
  tailoredCount: number
  hasChildren: boolean
  onToggleExpand: () => void
  onOpen: (resume: Resume) => void
  onRename: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  searchHighlight?: string
}

export function BaseResumeNode({
  resume,
  isExpanded,
  tailoredCount,
  hasChildren,
  onToggleExpand,
  onOpen,
  onRename,
  onDelete
}: BaseResumeNodeProps): React.JSX.Element {
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

  const formatTag = resume.fileName?.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF'
  const sizeInfo =
    typeof resume.fileSize === 'number'
      ? `${(resume.fileSize / 1024).toFixed(1)} KB`
      : resume.fileSize || '140 KB'

  return (
    <div className="group relative flex items-center justify-between px-3.5 py-3 rounded-xl bg-white dark:bg-[#1E1E22] hover:bg-slate-50 dark:hover:bg-[#27272A] border border-slate-200 dark:border-white/10 transition-all duration-200 cursor-pointer select-none shadow-md shadow-slate-200/50 dark:shadow-none">
      {/* Left side: Expand Chevron + Icon + Title & Meta */}
      <div
        className="flex items-center gap-3 min-w-0 flex-1"
        onClick={() => onOpen(resume)}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className={`p-1 -ml-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors ${
            !hasChildren ? 'opacity-30 cursor-default' : 'cursor-pointer'
          }`}
          title={isExpanded ? 'Collapse tailored resumes' : 'Expand tailored resumes'}
        >
          {isExpanded ? (
            <LuChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-300 transition-transform duration-200" />
          ) : (
            <LuChevronRight className="w-4 h-4 text-neutral-400 transition-transform duration-200" />
          )}
        </button>

        {/* File Icon */}
        <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-xs font-bold">
          <LuFileText className="w-4 h-4" />
        </div>

        {/* Name and Meta */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white truncate tracking-tight">
              {resume.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-200/80 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 shrink-0">
              {formatTag}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
            <span>Base Resume</span>
            <span className="opacity-40">•</span>
            <span>{sizeInfo}</span>
            <span className="opacity-40">•</span>
            <span className="text-neutral-400">Root Template</span>
          </div>
        </div>
      </div>

      {/* Right side: Tailored Count Pill & Action Menu */}
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {tailoredCount > 0 && (
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-bold">
            {tailoredCount} {tailoredCount === 1 ? 'Tailored Version' : 'Tailored Versions'}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(resume)
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold transition-all shadow-xs"
        >
          <LuFolderOpen className="w-3.5 h-3.5" />
          <span>Open</span>
        </button>

        {/* Action Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
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
                <span>Open Resume</span>
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
                <span>Rename Resume</span>
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
                <span>Delete Base Resume</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
