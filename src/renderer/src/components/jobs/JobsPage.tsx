import React, { useState, useMemo } from 'react'
import { JobItem, SortMode, FilterState, JobsPageProps } from './types'
import { JobsHeader } from './JobsHeader'
import { JobsToolbar } from './JobsToolbar'
import { JobsTable } from './JobsTable'
import { CoverLetterModal } from './modals/CoverLetterModal'
import { useNavigation } from '../../navigation/useNavigation'
import { useAppStore } from '../../lib/zustandStore'
import { supabase } from '../../lib/supabase'
import Logger from '@utils/logger'

export function JobsPage({
  matches = [],
  resumes = [],
  isLoading = false,
  onSelectMatch,
  onRefreshMatches
}: JobsPageProps): React.JSX.Element {
  const { goToJobMatch, goToTailorResume } = useNavigation()
  const { setCurrentJob, setScrapedJob, setLlmResult, resetTailoringState } = useAppStore()

  // Reset tailoring state whenever JobsPage is mounted or re-visited
  React.useEffect(() => {
    resetTailoringState()
  }, [resetTailoringState])

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('date_desc')
  const [filters, setFilters] = useState<FilterState>({
    resumeId: 'all',
    minScore: 0,
    employmentType: 'all'
  })

  // Modal State
  const [coverLetterJob, setCoverLetterJob] = useState<JobItem | null>(null)

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Optimistic deleted IDs to immediately hide deleted matches from UI
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Prune deletedIds when matches prop updates from parent
  React.useEffect(() => {
    if (deletedIds.size > 0 && matches) {
      const currentMatchIds = new Set(matches.map((m) => m.id))
      const currentJobIds = new Set(matches.map((m) => m.job_id || m.jobs?.id).filter(Boolean))

      setDeletedIds((prev) => {
        const next = new Set<string>()
        prev.forEach((id) => {
          if (currentMatchIds.has(id) || currentJobIds.has(id)) {
            next.add(id)
          }
        })
        return next.size === prev.size ? prev : next
      })
    }
  }, [matches, deletedIds.size])

  // Normalize data: transform Supabase matches (no mock data fallback)
  const allJobItems: JobItem[] = useMemo(() => {
    if (matches && matches.length > 0) {
      return matches
        .filter((m) => {
          const matchId = m.id
          const jobId = m.job_id || m.jobs?.id
          if (deletedIds.has(matchId)) return false
          if (jobId && deletedIds.has(jobId)) return false
          return true
        })
        .map((m) => {
          // Calculate human readable posted time
          const createdDate = new Date(m.created_at || m.jobs?.created_at || Date.now())
          const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
          const postedStr =
            diffDays <= 0
              ? 'Posted today'
              : diffDays === 1
                ? 'Posted 1d ago'
                : `Posted ${diffDays}d ago`

          const matchScore = m.fit_score ?? 0
          const potentialScore =
            m.potential_score ||
            (matchScore > 0 ? Math.min(100, Math.round(matchScore + 12)) : undefined)

          return {
            id: m.id,
            jobId: m.job_id,
            resumeId: m.resume_id,
            company: m.jobs?.company_name || m.jobs?.company || 'Company',
            companyLogo: m.jobs?.logo || m.jobs?.parsed_data?.logo || null,
            jobTitle: m.jobs?.job_title || m.jobs?.title || 'Position',
            location: m.jobs?.parsed_data?.location || 'Remote',
            employmentType: m.jobs?.parsed_data?.employment_type || 'Full-time',
            postedDate: postedStr,
            matchScore,
            potentialScore,
            description: m.jobs?.job_description || m.jobs?.description || '',
            rawMatch: m,
            isDemo: false
          }
        })
    }

    return []
  }, [matches, deletedIds])

  // Filter & Search Logic
  const filteredJobs = useMemo(() => {
    return allJobItems.filter((job) => {
      // 1. Search Query
      const query = searchTerm.toLowerCase().trim()
      if (query) {
        const titleMatch = job.jobTitle.toLowerCase().includes(query)
        const companyMatch = job.company.toLowerCase().includes(query)
        const locationMatch = (job.location || '').toLowerCase().includes(query)
        const descMatch = (job.description || '').toLowerCase().includes(query)
        if (!titleMatch && !companyMatch && !locationMatch && !descMatch) {
          return false
        }
      }

      // 2. Resume Filter
      if (filters.resumeId !== 'all' && job.resumeId) {
        if (job.resumeId !== filters.resumeId) return false
      }

      // 3. Minimum Score Filter
      if (job.matchScore < filters.minScore) {
        return false
      }

      // 4. Employment Type Filter
      if (filters.employmentType !== 'all') {
        if (
          !job.employmentType ||
          !job.employmentType
            .toLowerCase()
            .includes(filters.employmentType.toLowerCase())
        ) {
          return false
        }
      }

      return true
    })
  }, [allJobItems, searchTerm, filters])

  // Sort Logic
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs]
    switch (sortMode) {
      case 'score_desc':
        return list.sort((a, b) => b.matchScore - a.matchScore)
      case 'score_asc':
        return list.sort((a, b) => a.matchScore - b.matchScore)
      case 'date_desc':
        // Demo IDs have numeric order or creation order
        return list
      case 'company_asc':
        return list.sort((a, b) => a.company.localeCompare(b.company))
      case 'title_asc':
        return list.sort((a, b) => a.jobTitle.localeCompare(b.jobTitle))
      default:
        return list
    }
  }, [filteredJobs, sortMode])

  // Pagination Slice
  const totalItems = sortedJobs.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Automatically adjust currentPage if totalPages shrinks
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedJobs.slice(start, start + itemsPerPage)
  }, [sortedJobs, currentPage, itemsPerPage])

  // Selection handlers
  const allCurrentPageSelected =
    paginatedJobs.length > 0 &&
    paginatedJobs.every((j) => selectedIds.has(j.id))
  const someCurrentPageSelected =
    paginatedJobs.some((j) => selectedIds.has(j.id)) &&
    !allCurrentPageSelected

  const handleToggleSelectAll = (): void => {
    if (allCurrentPageSelected) {
      const next = new Set(selectedIds)
      paginatedJobs.forEach((j) => next.delete(j.id))
      setSelectedIds(next)
    } else {
      const next = new Set(selectedIds)
      paginatedJobs.forEach((j) => next.add(j.id))
      setSelectedIds(next)
    }
  }

  const handleToggleSelectRow = (id: string): void => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // CTA Action Handlers
  const handleTailor = (job: JobItem): void => {
    // Reset any previous tailor state
    resetTailoringState()

    // Populate zustand active job context
    setCurrentJob({
      id: job.jobId || job.id,
      title: job.jobTitle,
      company: job.company,
      description: job.description
    })
    setScrapedJob({
      jobTitle: job.jobTitle,
      company: job.company,
      aboutJob: job.description
    })
    if (job.rawMatch?.evidence) {
      setLlmResult(job.rawMatch.evidence)
    }
    goToTailorResume()
  }

  const handleCoverLetter = (job: JobItem): void => {
    setCoverLetterJob(job)
  }

  const handleOutreach = (job: JobItem): void => {
    if (onSelectMatch) {
      onSelectMatch(job.id)
    } else {
      goToJobMatch(job.id)
    }
  }

  const handleViewDetails = (job: JobItem): void => {
    if (onSelectMatch) {
      onSelectMatch(job.id)
    } else {
      goToJobMatch(job.id)
    }
  }

  const handleDelete = async (job: JobItem): Promise<void> => {
    if (job.isDemo) {
      alert('Sample reference jobs cannot be deleted from database.')
      return
    }

    if (!supabase) return
    const confirmed = window.confirm(`Delete match record for ${job.company} - ${job.jobTitle}?`)
    if (!confirmed) return

    const targetJobId = job.jobId || job.rawMatch?.job_id || job.rawMatch?.jobs?.id || job.id
    const targetMatchId = job.id

    // Optimistic removal: immediately hide from UI
    setDeletedIds((prev) => {
      const next = new Set(prev)
      next.add(targetMatchId)
      if (targetJobId) next.add(targetJobId)
      return next
    })

    // Remove from selection if selected
    setSelectedIds((prev) => {
      if (prev.has(targetMatchId) || (targetJobId && prev.has(targetJobId))) {
        const next = new Set(prev)
        next.delete(targetMatchId)
        if (targetJobId) next.delete(targetJobId)
        return next
      }
      return prev
    })

    // Clear active job in store if it's the deleted job
    const storeState = useAppStore.getState()
    if (storeState.currentJob?.id === targetJobId || storeState.currentJob?.id === targetMatchId) {
      setCurrentJob(null)
    }

    try {
      const { deleteJob } = await import('../../supabase_utils/jobsUtils')
      const result = await deleteJob(supabase, targetJobId)

      // Also ensure score row is deleted if targetMatchId was a distinct score ID
      if (targetMatchId && targetMatchId !== targetJobId) {
        await supabase.from('scores').delete().eq('id', targetMatchId)
      }

      if (!result.success && result.error) {
        throw result.error
      }

      // Trigger refresh so parent state stays in sync
      if (onRefreshMatches) {
        await onRefreshMatches()
      }
    } catch (err) {
      Logger.error('JobsPage.tsx', 'handleDeleteMatch', 'Error deleting match', err)
      // Rollback optimistic removal
      setDeletedIds((prev) => {
        const next = new Set(prev)
        next.delete(targetMatchId)
        if (targetJobId) next.delete(targetJobId)
        return next
      })
      alert('Failed to delete job match. Please try again.')
    }
  }

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.size === 0 || !supabase) return
    const client = supabase
    const count = selectedIds.size
    const confirmed = window.confirm(
      `Delete ${count} selected job ${count === 1 ? 'match record' : 'match records'}?`
    )
    if (!confirmed) return

    const idsToDelete = Array.from(selectedIds)
    const targetItems = allJobItems.filter(
      (j) => idsToDelete.includes(j.id) || (j.jobId && idsToDelete.includes(j.jobId))
    )

    // Collect all IDs to hide optimistically
    const idsToHide = new Set<string>()
    targetItems.forEach((j) => {
      idsToHide.add(j.id)
      const targetJobId = j.jobId || j.rawMatch?.job_id || j.rawMatch?.jobs?.id || j.id
      if (targetJobId) idsToHide.add(targetJobId)
    })

    setDeletedIds((prev) => {
      const next = new Set(prev)
      idsToHide.forEach((id) => next.add(id))
      return next
    })
    setSelectedIds(new Set())

    try {
      const { deleteJob } = await import('../../supabase_utils/jobsUtils')
      await Promise.all(
        targetItems.map(async (j) => {
          const targetJobId = j.jobId || j.rawMatch?.job_id || j.rawMatch?.jobs?.id || j.id
          await deleteJob(client, targetJobId)
          if (j.id && j.id !== targetJobId) {
            await client.from('scores').delete().eq('id', j.id)
          }
        })
      )

      if (onRefreshMatches) {
        await onRefreshMatches()
      }
    } catch (err) {
      Logger.error('JobsPage.tsx', 'handleDeleteSelected', 'Error deleting selected matches', err)
      alert('Failed to delete some selected job matches.')
      if (onRefreshMatches) {
        await onRefreshMatches()
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-main)] p-6 lg:p-8 overflow-hidden select-none transition-colors duration-200">
      {/* Header & Controls Section */}
      <div className="flex flex-col gap-5 pb-5">
        {/* Top Header: Jobs & Total Count */}
        <JobsHeader totalJobs={allJobItems.length} />

        {/* Search, Select, Sort & Filter Toolbar */}
        <JobsToolbar
          searchTerm={searchTerm}
          onSearchChange={(val) => {
            setSearchTerm(val)
            setCurrentPage(1)
          }}
          sortMode={sortMode}
          onSortChange={setSortMode}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters)
            setCurrentPage(1)
          }}
          resumes={resumes}
          selectedCount={selectedIds.size}
          totalCount={allJobItems.length}
          onToggleSelectAll={handleToggleSelectAll}
          onDeleteSelected={handleDeleteSelected}
        />
      </div>

      {/* Main Jobs Table Container */}
      <JobsTable
        jobs={paginatedJobs}
        isLoading={isLoading}
        allSelected={allCurrentPageSelected}
        someSelected={someCurrentPageSelected}
        selectedIds={selectedIds}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelectRow={handleToggleSelectRow}
        onTailor={handleTailor}
        onCoverLetter={handleCoverLetter}
        onOutreach={handleOutreach}
        onViewDetails={handleViewDetails}
        onDelete={handleDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Cover Letter In-Place Modal */}
      <CoverLetterModal
        isOpen={Boolean(coverLetterJob)}
        job={coverLetterJob}
        onClose={() => setCoverLetterJob(null)}
      />
    </div>
  )
}
