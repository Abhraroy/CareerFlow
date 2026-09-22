import React, { useState, useEffect } from 'react'
import { Resume } from '../../../types'
import { BaseResumeNode } from './BaseResumeNode'
import { TailoredResumeNode } from './TailoredResumeNode'
import { LuLayers, LuSearch, LuUpload } from '../../icons'

interface ResumeTreeProps {
  baseResumes: Resume[]
  tailoredResumes: Resume[]
  searchQuery: string
  onOpenResume: (resume: Resume) => void
  onCompareResume: (resume: Resume, parentResume?: Resume) => void
  onRenameResume: (resume: Resume) => void
  onDeleteResume: (resume: Resume) => void
  onUploadClick: () => void
}

export function ResumeTree({
  baseResumes,
  tailoredResumes,
  searchQuery,
  onOpenResume,
  onCompareResume,
  onRenameResume,
  onDeleteResume,
  onUploadClick
}: ResumeTreeProps): React.JSX.Element {
  // Track expanded state for each base resume (default all expanded)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(baseResumes.map((r) => r.id || r.name))
  })

  // Auto-expand nodes if user is searching
  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedIds(new Set(baseResumes.map((r) => r.id || r.name)))
    }
  }, [searchQuery, baseResumes])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filter items according to search query
  const query = searchQuery.toLowerCase().trim()

  const treeGroups = baseResumes.map((base) => {
    const baseKey = base.id || base.name
    // Find all tailored children belonging to this base resume
    const children = tailoredResumes.filter((t) => {
      if (t.parentResumeId && base.id) {
        return t.parentResumeId === base.id
      }
      // Fallback matching by name pattern if parentResumeId is unset
      return t.name.toLowerCase().includes(base.name.toLowerCase())
    })

    const baseMatches = !query || base.name.toLowerCase().includes(query)
    const matchingChildren = query
      ? children.filter((c) => c.name.toLowerCase().includes(query))
      : children

    const shouldShow = baseMatches || matchingChildren.length > 0

    return {
      base,
      baseKey,
      children: query ? matchingChildren : children,
      totalTailoredCount: children.length,
      shouldShow,
      isExpanded: expandedIds.has(baseKey)
    }
  })

  const visibleGroups = treeGroups.filter((g) => g.shouldShow)

  if (baseResumes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white dark:bg-[#212124] border border-black/5 dark:border-white/10 shadow-xs my-6 select-none">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 mb-4 shadow-xs">
          <LuLayers className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1.5">No Resumes Available</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed font-medium">
          Upload your base resume (PDF or DOCX) to get started.
        </p>
        <button
          type="button"
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer"
        >
          <LuUpload className="w-4 h-4" />
          <span>Upload Base Resume</span>
        </button>
      </div>
    )
  }

  if (visibleGroups.length === 0 && query) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white dark:bg-[#212124] border border-black/5 dark:border-white/10 shadow-xs my-6 select-none">
        <LuSearch className="w-8 h-8 text-neutral-400 mb-3" />
        <p className="text-sm font-bold text-neutral-900 dark:text-white">No resumes matching &quot;{searchQuery}&quot;</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Try searching for another keyword or clear the search filter.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 select-none">
      {visibleGroups.map((group) => {
        const { base, baseKey, children, totalTailoredCount, isExpanded } = group

        return (
          <div
            key={baseKey}
            className="rounded-2xl p-2 bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/50 dark:shadow-none transition-all duration-200"
          >
            {/* Base Resume Root Node */}
            <BaseResumeNode
              resume={base}
              isExpanded={isExpanded}
              tailoredCount={totalTailoredCount}
              hasChildren={children.length > 0}
              onToggleExpand={() => toggleExpand(baseKey)}
              onOpen={onOpenResume}
              onRename={onRenameResume}
              onDelete={onDeleteResume}
              searchHighlight={query}
            />

            {/* Expandable Tailored Branch Children */}
            {isExpanded && children.length > 0 && (
              <div className="mt-2 pl-2.5 pr-1.5 pb-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {children.map((child, idx) => {
                  const isLast = idx === children.length - 1
                  return (
                    <TailoredResumeNode
                      key={child.id || child.name}
                      resume={child}
                      parentResume={base}
                      isLast={isLast}
                      onOpen={onOpenResume}
                      onCompare={onCompareResume}
                      onRename={onRenameResume}
                      onDelete={onDeleteResume}
                      searchHighlight={query}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
