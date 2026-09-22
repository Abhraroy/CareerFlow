import React from 'react'
import { JobItem } from './types'
import { JobsTableHeader } from './JobsTableHeader'
import { JobRow } from './JobRow'
import { JobsPagination } from './JobsPagination'
import { LuBriefcase } from '../icons'

interface JobsTableProps {
  jobs: JobItem[]
  isLoading?: boolean
  allSelected: boolean
  someSelected: boolean
  selectedIds: Set<string>
  onToggleSelectAll: () => void
  onToggleSelectRow: (id: string) => void
  onTailor: (job: JobItem) => void
  onCoverLetter: (job: JobItem) => void
  onOutreach: (job: JobItem) => void
  onViewDetails?: (job: JobItem) => void
  onDelete?: (job: JobItem) => void
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

function TableSkeletonRow(): React.JSX.Element {
  return (
    <div className="grid grid-cols-[20px_1fr_120px_1fr] items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-white/5 animate-pulse">
      {/* Checkbox skeleton */}
      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-white/10" />

      {/* Avatar & Title info skeleton */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-3.5 w-28 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-3 w-40 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-2.5 w-32 bg-slate-200 dark:bg-white/10 rounded-md opacity-60" />
        </div>
      </div>

      {/* Score gauge skeleton */}
      <div className="flex justify-center">
        <div className="w-14 h-8 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex items-center justify-end gap-2">
        <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  )
}

export function JobsTable({
  jobs,
  isLoading = false,
  allSelected,
  someSelected,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onTailor,
  onCoverLetter,
  onOutreach,
  onViewDetails,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: JobsTableProps): React.JSX.Element {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#212124] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-md shadow-slate-200/60 dark:shadow-none">
      {/* Table Column Header */}
      <JobsTableHeader
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleSelectAll={onToggleSelectAll}
      />

      {/* Table Body (Scrollable rows) */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
        {isLoading ? (
          <>
            <TableSkeletonRow />
            <TableSkeletonRow />
            <TableSkeletonRow />
            <TableSkeletonRow />
            <TableSkeletonRow />
          </>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              isSelected={selectedIds.has(job.id)}
              onToggleSelect={onToggleSelectRow}
              onTailor={onTailor}
              onCoverLetter={onCoverLetter}
              onOutreach={onOutreach}
              onViewDetails={onViewDetails}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none min-h-[300px]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-neutral-400 mb-3 shadow-xs">
              <LuBriefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No jobs found</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 max-w-sm font-semibold">
              No job matches recorded yet. Match your uploaded resume against job postings to track analysis results here.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <JobsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  )
}
