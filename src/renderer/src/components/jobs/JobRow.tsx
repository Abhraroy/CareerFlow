import React from 'react'
import { JobItem } from './types'
import { JobCompanyAvatar } from './JobCompanyAvatar'
import { JobMatchScore } from './JobMatchScore'
import { JobActions } from './JobActions'

interface JobRowProps {
  job: JobItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onTailor: (job: JobItem) => void
  onCoverLetter: (job: JobItem) => void
  onOutreach: (job: JobItem) => void
  onViewDetails?: (job: JobItem) => void
  onDelete?: (job: JobItem) => void
}

export function JobRow({
  job,
  isSelected,
  onToggleSelect,
  onTailor,
  onCoverLetter,
  onOutreach,
  onViewDetails,
  onDelete
}: JobRowProps): React.JSX.Element {
  // Format metadata line
  const metadataParts = [
    job.location || 'Remote',
    job.employmentType || 'Full-time',
    job.postedDate || 'Recent'
  ].filter(Boolean)

  return (
    <div
      onClick={() => {
        if (onViewDetails) {
          onViewDetails(job)
        }
      }}
      className={`group relative grid grid-cols-[20px_1fr_120px_1fr] items-center gap-4 px-5 py-4 transition-all duration-150 border-b border-black/5 dark:border-white/5 cursor-pointer ${
        isSelected
          ? 'bg-neutral-100 dark:bg-white/[0.06]'
          : 'hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
      }`}
    >
      {/* 1. Selection Checkbox */}
      <div
        className="flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          onToggleSelect(job.id)
        }}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select job at ${job.company}`}
          className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer border ${
            isSelected
              ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-900'
              : 'border-neutral-300 dark:border-white/20 hover:border-neutral-400 bg-white dark:bg-black/40'
          }`}
        >
          {isSelected && (
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 12 12">
              <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l7-7a.75.75 0 00-1.06-1.06z" />
            </svg>
          )}
        </button>
      </div>

      {/* 2. Company Avatar & Job Info */}
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
        <JobCompanyAvatar company={job.company} logoUrl={job.companyLogo} size="md" />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14.5px] font-bold text-neutral-900 dark:text-white tracking-tight truncate">
              {job.company}
            </span>
            {job.isDemo && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-neutral-100 dark:bg-white/[0.08] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Sample
              </span>
            )}
          </div>

          <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200 tracking-tight truncate mt-0.5">
            {job.jobTitle}
          </span>

          <div className="flex items-center gap-1.5 text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
            {metadataParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="opacity-30 select-none">•</span>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Match Score (Centered / Distinct Column) */}
      <div
        className="flex items-center justify-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <JobMatchScore
          score={job.matchScore}
          potentialScore={job.potentialScore}
          size={74}
          strokeWidth={4}
        />
      </div>

      {/* 4. Actions (Right Aligned Column) */}
      <div className="flex items-center justify-end">
        <JobActions
          job={job}
          onTailor={onTailor}
          onCoverLetter={onCoverLetter}
          onOutreach={onOutreach}
          onViewDetails={onViewDetails}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
