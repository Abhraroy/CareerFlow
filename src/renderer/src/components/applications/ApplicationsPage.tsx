import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ApplicationItem, ApplicationStage, ApplicationFilterState, ViewMode } from './types'
import { ApplicationsHeader } from './ApplicationsHeader'
import { ApplicationsToolbar } from './ApplicationsToolbar'
import { ApplicationsKanban } from './ApplicationsKanban'
import { ApplicationRow } from './ApplicationRow'
import { ApplicationsTableHeader } from './ApplicationsTableHeader'
import Logger from '@utils/logger'

import { NewApplicationModal } from './NewApplicationModal'
import { ApplicationDetailModal } from './ApplicationDetailModal'
import {
  fetchApplications,
  createApplication,
  updateApplication,
  toggleApplicationShortlist,
  deleteApplication
} from '../../supabase_utils/applications'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../lib/zustandStore'
import { Resume } from '../../types'
import { LuBriefcase } from '../icons'

interface ApplicationsPageProps {
  resumes?: Resume[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzedMatches?: any[]
}

function ApplicationTableSkeletonRow(): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="h-3.5 w-36 bg-slate-200 dark:bg-white/10 rounded-md" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded-md" />
        </div>
      </div>
      <div className="w-24 h-7 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
      <div className="w-20 h-4 bg-slate-200 dark:bg-white/10 rounded-md shrink-0 hidden md:block" />
      <div className="w-12 h-6 rounded-md bg-slate-200 dark:bg-white/10 shrink-0 hidden lg:block" />
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  )
}

function ApplicationKanbanSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start select-none">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div
          key={idx}
          className="flex flex-col bg-white/60 dark:bg-[#1C1C1E]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-3 min-h-[450px] gap-3 animate-pulse"
        >
          <div className="h-5 w-24 bg-slate-200 dark:bg-white/10 rounded-md mb-2" />
          <div className="h-28 bg-slate-200 dark:bg-white/10 rounded-xl w-full" />
          <div className="h-28 bg-slate-200 dark:bg-white/10 rounded-xl w-full" />
        </div>
      ))}
    </div>
  )
}

export function ApplicationsPage({
  resumes = [],
  analyzedMatches = []
}: ApplicationsPageProps): React.JSX.Element {
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null)

  const [filters, setFilters] = useState<ApplicationFilterState>({
    searchQuery: '',
    stage: 'all',
    shortlistedOnly: false,
    resumeId: 'all',
    sortBy: 'date_desc'
  })

  // Helper to guarantee a valid user ID exists in public.users for Supabase persistence
  const getOrResolveUserId = useCallback(async (): Promise<string | null> => {
    if (!supabase) return null
    if (currentUserId) return currentUserId

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user?.id) {
        setCurrentUserId(authData.user.id)
        return authData.user.id
      }

      const { data: users } = await supabase.from('users').select('id').limit(1)
      if (users && users.length > 0 && users[0].id) {
        setCurrentUserId(users[0].id)
        return users[0].id
      }

      // Upsert guest user to public.users table so FK constraints pass
      const guestId = '00000000-0000-0000-0000-000000000001'
      const { data: guest } = await supabase
        .from('users')
        .upsert({ id: guestId, email: 'guest@jobcopilot.local', name: 'Guest User' })
        .select('id')
        .single()

      if (guest?.id) {
        setCurrentUserId(guest.id)
        return guest.id
      }
    } catch (err) {
      Logger.error('ApplicationsPage.tsx', 'getOrResolveUserId', 'Error resolving user for DB persistence', err)
    }
    return null
  }, [currentUserId])

  // Load user session
  useEffect(() => {
    getOrResolveUserId()
  }, [getOrResolveUserId])

  // Load applications from Supabase (no mock data fallback)
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const resolvedUser = currentUserId || (await getOrResolveUserId()) || undefined
      const dbApps = await fetchApplications(resolvedUser)

      if (dbApps && dbApps.length > 0) {
        const mapped: ApplicationItem[] = dbApps.map((item) => {
          const createdDate = new Date(item.created_at || Date.now())
          const diffDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
          const postedStr =
            diffDays <= 0
              ? 'Today'
              : diffDays === 1
                ? '1d ago'
                : `${diffDays}d ago`

          return {
            id: item.id,
            jobId: item.job_id,
            resumeId: item.resume_id,
            tailoredResumeId: item.tailored_resume_id,
            company: item.jobs?.company_name || 'Company',
            companyLogo: item.jobs?.logo || null,
            jobTitle: item.jobs?.job_title || 'Job Position',
            location: 'Remote / On-site',
            resumeName: item.resumes?.name || item.tailored_resumes?.name || 'Resume.pdf',
            shortlisted: item.shortlisted || item.status === 'shortlisted',
            status: item.status || 'applied',
            appliedDate: postedStr,
            updatedDate: item.updated_at,
            matchScore: item.tailored_resumes?.fit_score || 85,
            notes: item.notes,
            jobLink: item.jobs?.job_link,
            isDemo: false
          }
        })
        setApplications(mapped)
      } else {
        setApplications([])
      }
    } catch (err) {
      Logger.error('ApplicationsPage.tsx', 'loadData', 'Error loading applications', err)
      setApplications([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentUserId, getOrResolveUserId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  // Listen for dynamic Apply button clicks from external portal views
  useEffect(() => {
    if (!window.api?.onDetectedApplyClick) return

    const unsubscribe = window.api.onDetectedApplyClick(async (data) => {
      Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', 'Received Apply Click Event from Portal Engine', data)

      let titleFromPage = data.pageTitle ? data.pageTitle.split('|')[0].split('-')[0].trim() : 'Applied Position'
      if (titleFromPage === 'External Job Application' || titleFromPage === 'LinkedIn' || !titleFromPage) {
        titleFromPage = 'Job Application'
      }

      let companyName = data.portalId ? data.portalId.charAt(0).toUpperCase() + data.portalId.slice(1) : 'Company'
      if (data.url) {
        try {
          const hostname = new URL(data.url).hostname.replace('www.', '')
          const parts = hostname.split('.')
          if (parts.length >= 2 && !['com', 'org', 'io', 'net'].includes(parts[0])) {
            companyName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
          }
        } catch {
          // keep portalCompany
        }
      }

      Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', `Parsed Metadata -> Role: "${titleFromPage}" | Company: "${companyName}" | Portal: ${data.portalId}`)

      const tempId = `in_progress_${Date.now()}`
      const newAppItem: ApplicationItem = {
        id: tempId,
        jobId: tempId,
        resumeId: null,
        tailoredResumeId: null,
        company: companyName,
        companyLogo: null,
        jobTitle: titleFromPage,
        location: 'Remote / On-site',
        resumeName: 'Default Resume',
        shortlisted: false,
        status: 'in_progress',
        appliedDate: 'Just now',
        notes: `Automatically logged via Apply click (${data.buttonText || 'Apply'})`,
        jobLink: data.url,
        isDemo: false
      }

      // 1. Optimistic local state update (Immediate UI feedback)
      setApplications((prev) => {
        const exists = prev.some((a) => a.jobLink && data.url && a.jobLink.includes(data.url))
        if (exists) {
          Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', 'Updated existing job status to "in_progress" in UI state.')
          return prev.map((a) =>
            a.jobLink && data.url && a.jobLink.includes(data.url)
              ? { ...a, status: 'in_progress' }
              : a
          )
        }
        Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', 'Added new application to "In Progress" column in UI state.')
        return [newAppItem, ...prev]
      })

      setNotificationBanner(`⚡ Automatically logged job application for "${titleFromPage}" at ${companyName} (Status: In Progress)`)
      setTimeout(() => setNotificationBanner(null), 6000)

      // 2. Persist to Supabase database
      const targetUserId = await getOrResolveUserId()
      if (targetUserId && supabase) {
        try {
          Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', `Persisting job and application records to Supabase DB for user: ${targetUserId}`)
          const { data: jobData, error: jobErr } = await supabase
            .from('jobs')
            .insert({
              user_id: targetUserId,
              job_title: titleFromPage,
              company_name: companyName,
              job_link: data.url
            })
            .select()
            .single()

          if (jobData && !jobErr) {
            const storeState = useAppStore.getState()
            const activeResumeName = storeState.selectedResumeName
            let activeResumeId: string | null = storeState.currentResume?.id || null

            if (!activeResumeId && activeResumeName) {
              const found = resumes.find(
                (r) => r.name === activeResumeName || r.fileName === activeResumeName
              )
              if (found?.id) activeResumeId = found.id
            }

            if (!activeResumeId && resumes.length > 0 && resumes[0].id) {
              activeResumeId = resumes[0].id
            }

            if (!activeResumeId && supabase) {
              const { data: dbResumes } = await supabase
                .from('resumes')
                .select('id')
                .eq('user_id', targetUserId)
                .limit(1)
              if (dbResumes && dbResumes.length > 0) {
                activeResumeId = dbResumes[0].id
              }
            }

            const createdApp = await createApplication({
              user_id: targetUserId,
              job_id: jobData.id,
              resume_id: activeResumeId,
              status: 'in_progress',
              notes: `Automatically logged via Apply button click (${data.buttonText || 'Apply'})`
            })
            Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', `SUCCESS: Saved application to Supabase DB -> ID: ${createdApp?.id}`)
            loadData()
          } else if (jobErr) {
            Logger.error('ApplicationsPage.tsx', 'onDetectedApplyClick', 'ERROR inserting job record in Supabase', jobErr)
          }
        } catch (err) {
          Logger.error('ApplicationsPage.tsx', 'onDetectedApplyClick', 'EXCEPTION during Supabase persistence', err)
        }
      } else {
        Logger.info('ApplicationsPage.tsx', 'onDetectedApplyClick', 'Skipping Supabase DB sync (Client uninitialized / offline mode). UI state retained locally.')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [getOrResolveUserId, loadData])

  // Filter logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim()
        const matchTitle = app.jobTitle.toLowerCase().includes(q)
        const matchCompany = app.company.toLowerCase().includes(q)
        const matchLocation = app.location.toLowerCase().includes(q)
        const matchNotes = (app.notes || '').toLowerCase().includes(q)
        if (!matchTitle && !matchCompany && !matchLocation && !matchNotes) {
          return false
        }
      }

      // 2. Stage Filter
      if (filters.stage !== 'all') {
        if (app.status !== filters.stage) return false
      }

      // 3. Shortlisted Only
      if (filters.shortlistedOnly) {
        if (!app.shortlisted && app.status !== 'shortlisted') return false
      }

      return true
    })
  }, [applications, filters])

  // Handlers for state & DB actions
  const handleToggleShortlist = async (id: string, current: boolean) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              shortlisted: !current,
              status: !current ? 'shortlisted' : app.status === 'shortlisted' ? 'applied' : app.status
            }
          : app
      )
    )

    const isDemo = applications.find((a) => a.id === id)?.isDemo
    if (!isDemo) {
      await toggleApplicationShortlist(id, current)
    }
  }

  const handleUpdateStage = async (id: string, newStage: ApplicationStage) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status: newStage,
              shortlisted: newStage === 'shortlisted' ? true : app.shortlisted
            }
          : app
      )
    )

    if (selectedApplication && selectedApplication.id === id) {
      setSelectedApplication((prev) => (prev ? { ...prev, status: newStage } : null))
    }

    const isDemo = applications.find((a) => a.id === id)?.isDemo
    if (!isDemo) {
      await updateApplication(id, {
        status: newStage,
        shortlisted: newStage === 'shortlisted' ? true : undefined
      })
    }
  }

  const handleUpdateNotes = async (id: string, newNotes: string) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, notes: newNotes } : app))
    )

    if (selectedApplication && selectedApplication.id === id) {
      setSelectedApplication((prev) => (prev ? { ...prev, notes: newNotes } : null))
    }

    const isDemo = applications.find((a) => a.id === id)?.isDemo
    if (!isDemo) {
      await updateApplication(id, { notes: newNotes })
    }
  }

  const handleDeleteApplication = async (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id))
    if (selectedApplication && selectedApplication.id === id) {
      setSelectedApplication(null)
    }

    const isDemo = applications.find((a) => a.id === id)?.isDemo
    if (!isDemo) {
      await deleteApplication(id)
    }
  }

  const handleCreateApplication = async (data: {
    jobTitle: string
    company: string
    jobId?: string
    resumeId?: string
    status: ApplicationStage
    notes: string
  }) => {
    if (currentUserId && data.jobId) {
      const created = await createApplication({
        user_id: currentUserId,
        job_id: data.jobId,
        resume_id: data.resumeId || null,
        status: data.status,
        notes: data.notes || null,
        shortlisted: data.status === 'shortlisted'
      })

      if (created) {
        await loadData()
        return
      }
    }

    // Client-side addition fallback for demo mode
    const newApp: ApplicationItem = {
      id: `app-${Date.now()}`,
      jobId: data.jobId || `job-${Date.now()}`,
      resumeId: data.resumeId || null,
      tailoredResumeId: null,
      company: data.company,
      companyLogo: null,
      jobTitle: data.jobTitle,
      location: 'Remote',
      resumeName: resumes.find((r) => r.id === data.resumeId)?.name || 'Default Resume',
      shortlisted: data.status === 'shortlisted',
      status: data.status,
      appliedDate: 'Just now',
      notes: data.notes,
      matchScore: 90,
      isDemo: true
    }

    setApplications((prev) => [newApp, ...prev])
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-y-auto p-6 gap-6 select-none transition-colors duration-200">
      {notificationBanner && (
        <div className="bg-indigo-600 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn transition-all">
          <span>{notificationBanner}</span>
          <button
            onClick={() => setNotificationBanner(null)}
            className="text-white/80 hover:text-white text-xs font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}
      {/* 1. Header & Summary Stats */}
      <ApplicationsHeader
        applications={applications}
        onOpenNewApplicationModal={() => setIsNewModalOpen(true)}
      />

      {/* 2. Search & Toolbar */}
      <ApplicationsToolbar
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 3. Main Views (Row List or Kanban) */}
      {isLoading ? (
        viewMode === 'table' ? (
          <div className="flex flex-col gap-3">
            <ApplicationsTableHeader />
            <div className="flex flex-col gap-2.5">
              <ApplicationTableSkeletonRow />
              <ApplicationTableSkeletonRow />
              <ApplicationTableSkeletonRow />
              <ApplicationTableSkeletonRow />
              <ApplicationTableSkeletonRow />
            </div>
          </div>
        ) : (
          <ApplicationKanbanSkeleton />
        )
      ) : viewMode === 'table' ? (
        <div>
          {filteredApplications.length > 0 ? (
            <>
              <ApplicationsTableHeader />
              <div className="flex flex-col gap-2.5">
                {filteredApplications.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    application={app}
                    onToggleShortlist={handleToggleShortlist}
                    onUpdateStage={handleUpdateStage}
                    onDeleteApplication={handleDeleteApplication}
                    onSelectApplication={(selected) => setSelectedApplication(selected)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center select-none shadow-xs flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-neutral-400 mb-3 shadow-xs">
                <LuBriefcase className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No applications found</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 max-w-sm font-semibold">
                No job applications recorded yet. Applications will automatically appear here when you apply via browser portals or track new jobs.
              </p>
            </div>
          )}
        </div>
      ) : (
        <ApplicationsKanban
          applications={filteredApplications}
          onToggleShortlist={handleToggleShortlist}
          onUpdateStage={handleUpdateStage}
          onSelectApplication={(app) => setSelectedApplication(app)}
        />
      )}


      {/* 4. Modals */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={handleCreateApplication}
        existingJobs={analyzedMatches}
        resumes={resumes}
      />

      <ApplicationDetailModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onToggleShortlist={handleToggleShortlist}
        onUpdateStage={handleUpdateStage}
        onUpdateNotes={handleUpdateNotes}
        onDeleteApplication={handleDeleteApplication}
      />
    </div>
  )
}
