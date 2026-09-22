import React from 'react'
import { Resume } from '@/types'

interface JobSavedTailoredVersionsProps {
  resumes: Resume[]
  parentResumeId: string
  targetJobId: string
  onSelectTab?: (tabName: string) => void
}

/**
 * List of saved tailored resume iterations generated for this specific parent resume and target job.
 */
export function JobSavedTailoredVersions({
  resumes,
  parentResumeId,
  targetJobId,
  onSelectTab
}: JobSavedTailoredVersionsProps): React.JSX.Element | null {
  const tailoredVersions = resumes.filter(
    (r) => r.parentResumeId === parentResumeId && r.targetJobId === targetJobId
  )

  if (tailoredVersions.length === 0) return null

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-900 pb-2">
        Tailored Resume Versions
      </h3>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
        {tailoredVersions.map((version) => (
          <div
            key={version.id}
            className="bg-black border border-neutral-900 p-3 rounded-lg flex flex-col gap-2"
          >
            <span className="text-[11px] text-white font-semibold break-words leading-tight">
              {version.name}
            </span>
            <button
              onClick={() => onSelectTab?.(version.name)}
              className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded text-[10px] font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer text-center"
            >
              View Resume
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
