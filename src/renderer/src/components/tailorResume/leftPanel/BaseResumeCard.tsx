import React, { useState, useRef, useEffect } from 'react'
import { FiCheck, FiChevronDown, FiFileText } from '../../icons'
import { useAppStore } from '../../../lib/zustandStore'
import { Resume } from '../../../types'

export function BaseResumeCard(): React.JSX.Element {
  const {
    resumes,
    currentResume,
    selectedResumeName,
    setCurrentResume,
    setSelectedResumeName
  } = useAppStore()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Determine active resume name & details
  const activeResumeName =
    currentResume?.name ||
    selectedResumeName ||
    (resumes.length > 0 ? resumes[0].name : 'Base_Resume.pdf')

  const resumeSubtitle =
    (currentResume?.profileDetails as any)?.headline ||
    (currentResume?.profileDetails as any)?.summary ||
    'Software Engineer · Master Resume'

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResume = async (resume: Resume): Promise<void> => {
    let updatedResume = { ...resume }
    if (resume.id && window.api?.getParsedResume) {
      try {
        const storedStructure = await window.api.getParsedResume(resume.id)
        if (storedStructure) {
          updatedResume.structuredData = storedStructure
        }
      } catch (err) {
        console.warn('Failed to fetch stored resume structure', err)
      }
    }
    setCurrentResume(updatedResume)
    setSelectedResumeName(updatedResume.name)
    setIsOpen(false)
  }


  return (
    <div
      ref={dropdownRef}
      className="bg-white dark:bg-[#0D0F0F]/80 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 relative shadow-md shadow-slate-200/60 dark:shadow-none hover:border-slate-300 dark:hover:border-white/10 transition-colors select-none"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
          Base Resume
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          title="Change base resume"
        >
          <span>Change</span>
          <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white flex-shrink-0 font-bold shadow-xs">
          <FiFileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {activeResumeName}
          </div>
          <div className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5 font-semibold">
            {resumeSubtitle}
          </div>
        </div>
      </div>

      {/* Switch Resume Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-40 py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Select Base Resume
          </div>
          {resumes.length > 0 ? (
            resumes.map((resume) => {
              const isSelected = resume.name === activeResumeName
              return (
                <button
                  key={resume.name}
                  onClick={() => handleSelectResume(resume)}
                  className={`w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="truncate">{resume.name}</span>
                  {isSelected && <FiCheck className="w-4 h-4 flex-shrink-0" />}
                </button>
              )
            })
          ) : (
            <div className="px-3.5 py-2 text-xs text-slate-500 italic font-medium">
              No additional resumes found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
