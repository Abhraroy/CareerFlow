import React from 'react'
import { BackButton } from '../BackButton'

interface JobsHeaderProps {
  totalJobs: number
}

export function JobsHeader({ totalJobs }: JobsHeaderProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3.5 select-none">
      <BackButton title="Go back to previous page" />
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[22px] font-bold text-[var(--text-main)] tracking-tight leading-tight">
          Jobs
        </h1>
        <p className="text-[13px] font-medium text-[var(--text-muted)]">
          Total {totalJobs} {totalJobs === 1 ? 'job' : 'jobs'}
        </p>
      </div>
    </div>
  )
}
