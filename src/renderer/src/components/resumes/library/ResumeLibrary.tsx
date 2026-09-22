import React, { useState, useMemo } from 'react'
import { Resume } from '../../../types'
import { ResumeTree } from './ResumeTree'
import { LuFileText, LuSearch, LuSparkles, LuUpload, LuX } from '../../icons'

interface ResumeLibraryProps {
  resumes: Resume[]
  onOpenResume: (resume: Resume) => void
  onCompareResume: (resume: Resume, parentResume?: Resume) => void
  onRenameResume: (resume: Resume) => void
  onDeleteResume: (resume: Resume) => void
  onOpenUploadModal: () => void
}

export function ResumeLibrary({
  resumes,
  onOpenResume,
  onCompareResume,
  onRenameResume,
  onDeleteResume,
  onOpenUploadModal
}: ResumeLibraryProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState<'all' | 'with_tailored' | 'base_only'>('all')

  // Split into base resumes and tailored resumes
  const { baseResumes, tailoredResumes } = useMemo(() => {
    const bases = resumes.filter((r) => !r.parentResumeId)
    const tailored = resumes.filter((r) => !!r.parentResumeId)
    return { baseResumes: bases, tailoredResumes: tailored }
  }, [resumes])

  // Filter base resumes by filterMode
  const filteredBaseResumes = useMemo(() => {
    if (filterMode === 'with_tailored') {
      return baseResumes.filter((b) =>
        tailoredResumes.some(
          (t) => t.parentResumeId === b.id || t.name.toLowerCase().includes(b.name.toLowerCase())
        )
      )
    }
    if (filterMode === 'base_only') {
      return baseResumes.filter(
        (b) =>
          !tailoredResumes.some(
            (t) => t.parentResumeId === b.id || t.name.toLowerCase().includes(b.name.toLowerCase())
          )
      )
    }
    return baseResumes
  }, [baseResumes, tailoredResumes, filterMode])

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-y-auto select-none transition-colors duration-200">
      {/* Top Header Container matching reference design */}
      <div className="sticky top-0 z-20 px-8 pt-7 pb-5 bg-[var(--bg-app)]/90 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Resumes</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.05] border border-black/5 dark:border-white/[0.08] text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                <LuFileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{baseResumes.length} Base</span>
                <span className="opacity-40">•</span>
                <LuSparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>{tailoredResumes.length} Tailored</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              Manage your base resumes and tailored versions
            </p>
          </div>

          {/* Actions: Search + Filter + Upload */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-[#1E1E22] border border-black/5 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-0.5 rounded-md cursor-pointer"
                >
                  <LuX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-[#1E1E22] border border-black/5 dark:border-white/10 rounded-xl p-0.5 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('with_tailored')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  filterMode === 'with_tailored'
                    ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Only show resumes with tailored versions"
              >
                Tailored
              </button>
            </div>

            {/* Upload Resume Button (Solid pill matching reference design) */}
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer"
            >
              <LuUpload className="w-3.5 h-3.5" />
              <span>+ Upload Resume</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Minimal Tree Structure Header */}
          <div className="flex items-center justify-between px-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>Resume Hierarchy / File Tree</span>
            <span>Actions & Status</span>
          </div>

          <ResumeTree
            baseResumes={filteredBaseResumes}
            tailoredResumes={tailoredResumes}
            searchQuery={searchQuery}
            onOpenResume={onOpenResume}
            onCompareResume={onCompareResume}
            onRenameResume={onRenameResume}
            onDeleteResume={onDeleteResume}
            onUploadClick={onOpenUploadModal}
          />
        </div>
      </div>
    </div>
  )
}
