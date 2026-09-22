import React, { useState, useRef, useEffect } from 'react'
import { FiMoreHorizontal, LuCopy, LuEye, LuFileText, LuSend, LuSparkles, LuTrash2 } from '../icons'
import { JobItem } from './types'

interface JobActionsProps {
  job: JobItem
  onTailor: (job: JobItem) => void
  onCoverLetter: (job: JobItem) => void
  onOutreach: (job: JobItem) => void
  onViewDetails?: (job: JobItem) => void
  onDelete?: (job: JobItem) => void
}

export function JobActions({
  job,
  onTailor,
  onCoverLetter,
  onOutreach,
  onViewDetails,
  onDelete
}: JobActionsProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close more menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(`${job.company} - ${job.jobTitle}`)
      setMenuOpen(false)
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 relative">
      {/* Primary CTA: Tailor (Solid pill matching design reference photos) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onTailor(job)
        }}
        title={`Tailor Resume for ${job.company}`}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer"
      >
        <LuSparkles className="w-3.5 h-3.5" />
        <span>Tailor</span>
      </button>

      {/* Secondary CTA: Cover Letter */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onCoverLetter(job)
        }}
        title={`Generate Cover Letter for ${job.company}`}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-neutral-100 dark:bg-[#27272A] hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs"
      >
        <LuFileText className="w-3.5 h-3.5 text-neutral-400" />
        <span>Cover Letter</span>
      </button>

      {/* Positive Action: Outreach */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onOutreach(job)
        }}
        title={`Draft Outreach for ${job.company}`}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs"
      >
        <LuSend className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Outreach</span>
      </button>

      {/* More Actions (Three Dots) Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((prev) => !prev)
          }}
          aria-label="More actions"
          className="flex items-center justify-center w-8 h-8 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-black/5 dark:hover:border-white/10 transition-colors cursor-pointer"
        >
          <FiMoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 shadow-xl py-1.5 z-50 text-xs">
            {onViewDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onViewDetails(job)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <LuEye className="w-3.5 h-3.5 text-neutral-400" />
                <span>View Match Details</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyLink()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <LuCopy className="w-3.5 h-3.5 text-neutral-400" />
              <span>Copy Job Title</span>
            </button>

            {onDelete && (
              <>
                <div className="my-1 border-t border-black/5 dark:border-white/10" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(job)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  <LuTrash2 className="w-3.5 h-3.5" />
                  <span>Delete Match</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
