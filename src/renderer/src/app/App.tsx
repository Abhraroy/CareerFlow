import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ensureUserProfile, updateUserFullName } from '../supabase_utils'
import { Auth } from '../components/Auth'
import { Session } from '@supabase/supabase-js'
import { Resume, ProfileDetails } from '../types'
import { Sidebar } from '../components/sidebar/Sidebar'
import { JobAssistantSidebar, OutreachModal } from '../components/jobassistantsidebar'
import { formatResumeForCopy } from '../utils/formatResumeData'
import { BrowserControlHeader } from '../components/browserControlHeader'
import { useNavigation } from '../navigation/useNavigation'
import { NavigationRenderer } from '../navigation/NavigationRenderer'
import { isPortalRoute } from '../navigation/types'
import { PortalController } from '../navigation/PortalController'
import { useAppStore } from '../lib/zustandStore'
import Logger from '@utils/logger'

function App(): React.JSX.Element {
  const {
    theme,
    resumes,
    setResumes: storeSetResumes,
    selectedResumeName,
    setSelectedResumeName: storeSetSelectedResumeName,
    setUserId: storeSetUserId
  } = useAppStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(() => !!supabase)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [analyzedMatches, setAnalyzedMatches] = useState<any[]>([])

  const { route: currentRoute, goToDashboard } = useNavigation()

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const browserBodyRef = useRef<HTMLDivElement>(null)
  const initialDataLoaded = useRef(false)

  // Profile settings state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileName, setProfileName] = useState('')

  const [profileSaving, setProfileSaving] = useState(false)

  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  // Loading states
  const [appDataLoading, setAppDataLoading] = useState(true)

  useEffect(() => {
    if (!isResizing) return

    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return
      const clientX = e.clientX
      rafId = requestAnimationFrame(() => {
        rafId = null
        const maxAllowedWidth = window.innerWidth * 0.5
        // The sidebar is pinned to the right side of the screen
        const newWidth = window.innerWidth - clientX
        // Keep it constrained between 260px (minimum) and maxAllowedWidth (50%)
        if (newWidth >= 260 && newWidth <= maxAllowedWidth) {
          setSidebarWidth(newWidth)
        }
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    const verifySession = async (): Promise<void> => {
      try {
        const {
          data: { user },
          error
        } = await supabase!.auth.getUser()
        if (error || !user) {
          await supabase!.auth.signOut()
          if (isMounted) {
            setSession(null)
            setAuthLoading(false)
          }
          return
        }

        const {
          data: { session }
        } = await supabase!.auth.getSession()
        if (isMounted) {
          setSession(session)
          setAuthLoading(false)
        }
      } catch (err) {
        Logger.error('App.tsx', 'verifySession', 'Session validation error', err)
        if (isMounted) {
          setSession(null)
          setAuthLoading(false)
        }
      }
    }

    verifySession()

    const {
      data: { subscription }
    } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        try {
          const {
            data: { user },
            error
          } = await supabase!.auth.getUser()
          if (error || !user) {
            await supabase!.auth.signOut()
            if (isMounted) {
              setSession(null)
            }
          } else {
            if (isMounted) {
              setSession(session)
            }
          }
        } catch {
          await supabase!.auth.signOut()
          if (isMounted) {
            setSession(null)
          }
        }
      } else {
        if (isMounted) {
          setSession(session)
        }
      }
      if (isMounted) {
        setAuthLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Global listener for dynamic Apply button clicks across all views/pages
  useEffect(() => {
    if (!window.api?.onDetectedApplyClick) return

    const unsubscribe = window.api.onDetectedApplyClick(async (data) => {
      Logger.info('App.tsx', 'onDetectedApplyClick', 'Received Apply Click Event from Portal Engine', data)

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
          // keep companyName
        }
      }

      Logger.info('App.tsx', 'onDetectedApplyClick', `Metadata -> Role: "${titleFromPage}" | Company: "${companyName}" | URL: ${data.url}`)

      if (supabase) {
        try {
          // 1. Resolve or ensure valid user ID
          let targetUserId = session?.user?.id
          if (!targetUserId) {
            const { data: authData } = await supabase.auth.getUser()
            targetUserId = authData?.user?.id
          }
          if (!targetUserId) {
            const { data: users } = await supabase.from('users').select('id').limit(1)
            if (users && users.length > 0) targetUserId = users[0].id
          }
          if (!targetUserId) {
            const guestId = '00000000-0000-0000-0000-000000000001'
            const { data: guest } = await supabase
              .from('users')
              .upsert({ id: guestId, email: 'guest@jobcopilot.local', name: 'Guest User' })
              .select('id')
              .single()
            if (guest) targetUserId = guest.id
          }

          if (targetUserId) {
            Logger.info('App.tsx', 'onDetectedApplyClick', `Persisting job and application records to Supabase DB for user: ${targetUserId}`)

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
              // Get selected resume from global dropdown state
              const storeState = useAppStore.getState()
              const activeResumeName = selectedResumeName || storeState.selectedResumeName
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

              Logger.info('App.tsx', 'onDetectedApplyClick', `Using selected resume from dropdown -> Name: "${activeResumeName || 'Default'}", ID: ${activeResumeId}`)

              const { createApplication } = await import('../supabase_utils/applications')
              const createdApp = await createApplication({
                user_id: targetUserId,
                job_id: jobData.id,
                resume_id: activeResumeId,
                status: 'in_progress',
                notes: `Automatically logged via Apply button click (${data.buttonText || 'Apply'})`
              })
              Logger.info('App.tsx', 'onDetectedApplyClick', `SUCCESS: Saved application to Supabase DB -> ID: ${createdApp?.id}`)
            } else if (jobErr) {
              Logger.error('App.tsx', 'onDetectedApplyClick', 'ERROR inserting job record in Supabase', jobErr)
            }
          }
        } catch (err) {
          Logger.error('App.tsx', 'onDetectedApplyClick', 'EXCEPTION during Supabase persistence', err)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [session])

  const loadJobMatches = async (): Promise<void> => {
    if (!supabase || !session) return
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, scores(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        Logger.error('App.tsx', 'loadJobMatches', 'Supabase error loading job matches', error)
        return
      }

      if (data) {
        const mappedData = data.map((job) => {
          // Find the latest score for this job, if any
          const latestScore =
            job.scores && job.scores.length > 0
              ? job.scores.sort(
                  (a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
              : null

          return {
            id: latestScore?.id || job.id,
            job_id: job.id,
            resume_id: latestScore?.resume_id || null,
            fit_score: latestScore?.fit_score || 0,
            potential_score: latestScore?.potential_score || 0,
            score: latestScore?.fit_score || 0,
            created_at: latestScore?.created_at || job.created_at,
            jobs: job,
            evidence: latestScore?.evidence || null
          }
        })
        setAnalyzedMatches(mappedData)
      }
    } catch (err) {
      Logger.error('App.tsx', 'loadJobMatches', 'Error loading job matches', err)
    }
  }

  // Load initial app data (Profile & Resumes) in parallel
  const loadData = async (force = false): Promise<void> => {
    if (!session || !supabase) return
    if (!initialDataLoaded.current) {
      setAppDataLoading(true)
    }
    if (force) {
      Logger.info('App.tsx', 'loadData', 'Performing background data reload.')
    }
    try {
      // Fetch / Ensure Profile
      const profilePromise = ensureUserProfile({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.user_metadata?.full_name
      })

      // Fetch Resumes from supabase_utils
      const { getUserResumes, getUserTailoredResumes } = await import('../supabase_utils')
      const resumesPromise = Promise.all([
        getUserResumes(session.user.id),
        getUserTailoredResumes(session.user.id)
      ])

      const [userProfile, [baseRows, tailoredRows]] = await Promise.all([profilePromise, resumesPromise])
      await loadJobMatches()

      if (userProfile?.name) {
        setProfileName(userProfile.name)
      }

      const mapProfile = (sData: any): ProfileDetails => {
        const s = sData || {}
        const customFields: { id: string; label: string; value: string }[] = []
        const standardKeys = [
          'firstName', 'lastName', 'email', 'phone', 'location',
          'linkedin', 'github', 'portfolio', 'summary', 'skills',
          'experience', 'education', 'projects', 'certifications',
          'awards', 'languages', 'publications'
        ]
        Object.keys(s).forEach((key) => {
          if (!standardKeys.includes(key) && s[key]) {
            const val = s[key]
            customFields.push({
              id: `cf-${key}`,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              value: typeof val === 'object' ? JSON.stringify(val) : String(val)
            })
          }
        })
        return {
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          email: s.email || '',
          phone: s.phone || '',
          location: s.location || '',
          linkedin: s.linkedin || '',
          github: s.github || '',
          portfolio: s.portfolio || '',
          customFields
        }
      }

      const mappedBases: Resume[] = baseRows.map((r) => ({
        id: r.id,
        name: r.name || 'Untitled Resume',
        fileName: r.file_name || undefined,
        fileSize: r.file_size ? `${(Number(r.file_size) / 1024).toFixed(1)} KB` : undefined,
        rawResumeData: r.raw_resume_data || undefined,
        uploadedData: r.raw_resume_data || undefined,
        structuredData: r.structured_data as any,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        profileDetails: mapProfile(r.structured_data)
      }))

      const mappedTailored: Resume[] = tailoredRows.map((t) => ({
        id: t.id,
        name: t.name,
        parentResumeId: t.resume_id,
        targetJobId: t.job_id,
        rawResumeData: t.raw_tailored_resume_data || undefined,
        uploadedData: t.raw_tailored_resume_data || undefined,
        structuredData: t.structured_output as any,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        tailoringMetadata: (t.tailored_based_on as any) || undefined,
        profileDetails: mapProfile(t.structured_output)
      }))

      const loadedResumes = [...mappedBases, ...mappedTailored]

      if (loadedResumes.length > 0) {
        storeSetResumes(loadedResumes)
        if (session?.user?.id) storeSetUserId(session.user.id)
        if (!initialDataLoaded.current) {
          const matchingResume = loadedResumes[0]
          storeSetSelectedResumeName(matchingResume.name)
          goToDashboard()
        }
      } else {
        storeSetResumes([])
        if (session?.user?.id) storeSetUserId(session.user.id)
        if (!initialDataLoaded.current) {
          goToDashboard()
        }
      }
    } catch (err) {
      Logger.error('App.tsx', 'loadData', 'Error loading initial app data', err)
    } finally {
      setAppDataLoading(false)
      initialDataLoaded.current = true
    }
  }

  // Load initial app data in parallel
  useEffect(() => {
    loadData()
  }, [session])

  const handleSaveProfile = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!session) return
    setProfileSaving(true)
    try {
      const updated = await updateUserFullName(session.user.id, profileName)
      if (updated?.name) {
        setProfileName(updated.name)
      }
    } catch (err) {
      Logger.error('App.tsx', 'handleSaveProfile', 'Error updating profile', err)
      throw err
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    if (supabase) {
      await supabase.auth.signOut()
    }
  }

  // Ensure portal WebContentsView is hidden when session ends
  useEffect(() => {
    if (!session) {
      PortalController.hide()
    } else {
      PortalController.syncWithRoute(currentRoute)
    }
  }, [currentRoute, session])

  // ResizeObserver to position and scale Electron WebContentsView dynamically
  useEffect(() => {
    if (!session) return
    const isPortalActive = isPortalRoute(currentRoute)
    if (!browserBodyRef.current || !isPortalActive) {
      return
    }

    const updatePosition = (): void => {
      if (!browserBodyRef.current) return
      const rect = browserBodyRef.current.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      PortalController.updateBounds({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      })
    }

    const observer = new ResizeObserver(() => {
      updatePosition()
    })

    observer.observe(browserBodyRef.current)
    window.addEventListener('resize', updatePosition)
    const timer = setTimeout(updatePosition, 100)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updatePosition)
      clearTimeout(timer)
    }
  }, [sidebarCollapsed, sidebarWidth, currentRoute, session])

  const currentResumeForAssistant = resumes.find((r) => r.name === selectedResumeName) || resumes[0]

  const getFields = (
    resumeObj: Resume | undefined
  ): { key: string; label: string; value: string }[] => {
    if (!resumeObj) return []
    const det = resumeObj.profileDetails
    const fields = [
      { key: 'firstName', label: 'First Name', value: det.firstName },
      { key: 'lastName', label: 'Last Name', value: det.lastName },
      { key: 'email', label: 'Email', value: det.email },
      { key: 'phone', label: 'Phone', value: det.phone },
      { key: 'location', label: 'Location', value: det.location },
      { key: 'linkedin', label: 'LinkedIn', value: det.linkedin },
      { key: 'github', label: 'GitHub', value: det.github },
      { key: 'portfolio', label: 'Portfolio', value: det.portfolio }
    ]
    if (det.customFields) {
      det.customFields.forEach((cf) => {
        fields.push({ key: cf.id, label: cf.label, value: cf.value })
      })
    }
    return fields
  }

  const handleCopy = async (key: string, val: string): Promise<void> => {
    if (!val) return
    try {
      await navigator.clipboard.writeText(val)
      setCopiedField(key)
      setTimeout(() => setCopiedField(null), 1200)
    } catch (err) {
      Logger.error('App.tsx', 'handleCopy', 'Copy failed', err)
    }
  }

  const handleCopyAll = async (resumeObj: Resume | undefined): Promise<void> => {
    if (!resumeObj) return
    const text = formatResumeForCopy(resumeObj)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField('all')
      setTimeout(() => setCopiedField(null), 1200)
    } catch (err) {
      Logger.error('App.tsx', 'handleCopyAll', 'Copy all failed', err)
    }
  }



  if (authLoading || (session && appDataLoading)) {
    return (
      <div className="flex flex-col h-screen w-screen bg-black text-white font-sans overflow-hidden items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-neutral-900 border-t-emerald-500 animate-spin"></div>
        </div>
        <h2 className="text-sm font-semibold tracking-wider text-neutral-300 uppercase animate-pulse">
          Loading JobCopilot...
        </h2>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="flex h-screen w-screen bg-black text-white font-sans overflow-hidden items-center justify-center p-6 text-center select-text">
        <div className="max-w-md bg-neutral-950 border border-neutral-900 rounded-xl p-8 shadow-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold text-red-500">Supabase Configuration Missing</h2>
          <p className="text-xs text-neutral-400">
            Please add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your environment
            variables (e.g., in a `.env` file) to initialize the database and authentication.
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />
  }

  const userMetadata = session?.user?.user_metadata || {}
  const displayFullName =
    profileName || userMetadata.full_name || session?.user?.email?.split('@')[0] || 'User'
  const initials =
    displayFullName
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  const isPortalActive = isPortalRoute(currentRoute)

  // Dragging event handlers for the sidebar resize
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  return (
    <div
      className={`flex h-screen w-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans overflow-hidden select-none transition-colors duration-200 ${isResizing ? 'cursor-col-resize' : ''}`}
    >
      {/* Main Content Area */}
      <main
        className="flex-1 grid overflow-hidden transition-[grid-template-columns] duration-200 ease-in-out"
        style={{
          gridTemplateColumns: `${leftSidebarCollapsed ? '68px' : '260px'} 1fr ${isPortalActive ? (sidebarCollapsed ? '0px' : `${sidebarWidth}px`) : '0px'}`
        }}
      >
        <Sidebar
          displayFullName={displayFullName}
          initials={initials}
          email={session?.user?.email}
          onLogout={handleLogout}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          collapsed={leftSidebarCollapsed}
          onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        />

        {/* Center Panel: Browser viewport OR NavigationRenderer */}
        <section className="flex flex-col bg-[var(--bg-app)] border-r border-[var(--border-sidebar)] overflow-hidden relative min-h-0 h-full">
          {isPortalActive ? (
            <>
              {/* Browser Controls Header */}
              <BrowserControlHeader
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
              />

              {/* WebContentsView absolute positioning slot */}
              <div className="flex-1 relative bg-black" ref={browserBodyRef}>
                {/* Main process WebContentsView sits exactly here */}
              </div>
            </>
          ) : (
            <NavigationRenderer
              route={currentRoute}
              profileName={profileName}
              setProfileName={setProfileName}
              profileSaving={profileSaving}
              onSaveProfile={handleSaveProfile}
              supabase={supabase!}
              session={session}
              analyzedMatches={analyzedMatches}
              resumes={resumes}
              appDataLoading={appDataLoading}
              loadJobMatches={loadJobMatches}
              loadData={loadData}
            />
          )}
        </section>

        {/* Right Sidebar (Job Assistant Panel) */}
        {isPortalActive && !sidebarCollapsed && (
          <div className="flex relative h-full">
            {/* Draggable Divider Handle */}
            <div
              onMouseDown={startResizing}
              className="absolute top-0 bottom-0 left-0 w-4 cursor-col-resize z-55 group flex items-center justify-center hover:bg-neutral-800/10 active:bg-neutral-800/30 transition-colors"
              style={{ transform: 'translateX(-50%)' }}
            >
              <div className="w-2.5 h-16 rounded-full bg-neutral-800 border border-neutral-700 transition-all group-hover:bg-neutral-600 group-hover:h-20 flex items-center justify-center shadow-lg pointer-events-none">
                <div className="flex flex-col gap-1 items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 group-hover:bg-white transition-colors" />
                  <span className="w-1 h-1 rounded-full bg-neutral-400 group-hover:bg-white transition-colors" />
                  <span className="w-1 h-1 rounded-full bg-neutral-400 group-hover:bg-white transition-colors" />
                </div>
              </div>
            </div>
            <JobAssistantSidebar
              resumes={resumes}
              selectedResumeName={selectedResumeName}
              setSelectedResumeName={(name) => {
                storeSetSelectedResumeName(name)
              }}
              currentResumeForAssistant={currentResumeForAssistant}
              copiedField={copiedField}
              handleCopy={handleCopy}
              handleCopyAll={handleCopyAll}
              setSidebarCollapsed={setSidebarCollapsed}
              getFields={getFields}
              userId={session.user.id}
              onMatchComplete={loadJobMatches}
              width={sidebarWidth}
              onResumeAdded={async () => {
                await loadData(true)
              }}
            />
          </div>
        )}
        <OutreachModal />
      </main>
    </div>
  )
}

export default App
