import React from 'react'
import { AppRoute } from './types'
import { DashboardView } from '../components/dashboard/DashboardView'
import { ApplicationsPage } from '../components/applications/ApplicationsPage'
import { SettingsView } from '../components/SettingsView'
import { ApiUsagePage } from '../components/ApiUsagePage'
import { JobMatchDetailView } from '../components/jobs/JobMatchDetailView'
import { ResumePage } from '../components/resumes/ResumePage'
import { TailorResume } from '../components/tailorResume/TailorResume'
import { JobsPage } from '../components/jobs/JobsPage'
import { Resume } from '../types'
import { Session, SupabaseClient } from '@supabase/supabase-js'
import { useNavigation } from './useNavigation'
import { useAppStore } from '../lib/zustandStore'
import { BackButton } from '../components/BackButton'

interface NavigationRendererProps {
  route: AppRoute
  // Profile settings props
  profileName: string
  setProfileName: (name: string) => void
  profileSaving: boolean
  onSaveProfile: (e: React.FormEvent) => void

  // Auth / DB props
  supabase: SupabaseClient
  session: Session

  // Data props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyzedMatches: any[]
  resumes: Resume[]
  appDataLoading?: boolean
  loadJobMatches: () => Promise<void>
  loadData: (force?: boolean) => Promise<void>
}

export function NavigationRenderer({
  route,
  profileName,
  setProfileName,
  profileSaving,
  onSaveProfile,
  supabase,
  session,
  analyzedMatches,
  resumes,
  appDataLoading,
  loadJobMatches,
  loadData
}: NavigationRendererProps): React.JSX.Element | null {
  const { goToJobMatch, goToResume, goToAllMatches } = useNavigation()
  const llmResult = useAppStore((state) => state.llmResult)

  switch (route.type) {
    case 'portal':
      // Portals are rendered by Electron WebContentsView in the browser slot
      return null

    case 'dashboard':
      return (
        <DashboardView
          session={session}
          supabase={supabase}
          analyzedMatches={analyzedMatches}
          resumes={resumes}
        />
      )

    case 'jobs':
      return (
        <JobsPage
          matches={analyzedMatches}
          resumes={resumes}
          isLoading={appDataLoading}
          onSelectMatch={goToJobMatch}
          onRefreshMatches={loadJobMatches}
        />
      )

    case 'resumes':
      return <ResumePage />

    case 'applications':
      return <ApplicationsPage resumes={resumes} analyzedMatches={analyzedMatches} />

    case 'settings':
      return (
        <SettingsView
          profileName={profileName}
          setProfileName={setProfileName}
          profileSaving={profileSaving}
          onSaveProfile={onSaveProfile}
          session={session}
        />
      )

    case 'api-usage':
      return <ApiUsagePage supabase={supabase} session={session} />

    case 'all-matches':
      return (
        <JobsPage
          matches={analyzedMatches}
          resumes={resumes}
          isLoading={appDataLoading}
          onSelectMatch={goToJobMatch}
          onRefreshMatches={loadJobMatches}
        />
      )

    case 'tailor-resume':
      return <TailorResume />

    case 'view-analysis': {
      const foundMatch = analyzedMatches.find(
        (m) =>
          m.id === route.matchId ||
          m.jobs?.company?.toLowerCase() === route.matchId?.toLowerCase() ||
          m.jobs?.title?.toLowerCase() === route.matchId?.toLowerCase()
      )

      const currentMatch =
        foundMatch ||
        (llmResult
          ? {
              id: route.matchId || 'latest',
              job_id: '',
              resume_id: resumes[0]?.id || '',
              score: llmResult.executiveSummary?.currentFitScore ?? 0,
              skill_score: 0,
              experience_score: 0,
              semantic_score: 0,
              evidence: llmResult,
              gaps: null,
              created_at: new Date().toISOString(),
              jobs: {
                title: llmResult.executiveSummary?.jobTitle || 'Analyzed Position',
                company: llmResult.executiveSummary?.company || route.matchId || 'Company',
                description: '',
                parsed_data: null
              }
            }
          : null)

      if (!currentMatch) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-neutral-400 bg-black gap-4">
            <p className="text-sm font-medium">Job match analysis not found.</p>
            <div className="flex items-center gap-2">
              <BackButton label="Back" />
              <button
                onClick={goToAllMatches}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white rounded-xl transition-colors border border-neutral-800 cursor-pointer"
              >
                View All Matches
              </button>
            </div>
          </div>
        )
      }

      return (
        <JobMatchDetailView
          match={currentMatch}
          resumes={resumes}
          userId={session?.user?.id || ''}
          onRefreshMatches={loadJobMatches}
          onResumeAdded={async () => {
            await loadData(true)
          }}
          onSelectTab={(tabName) => goToResume(tabName)}
        />
      )
    }

    case 'resume': {
      return <ResumePage initialSelectedResumeName={route.resumeName} />
    }

    default:
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-neutral-400 bg-black gap-4">
          <p className="text-sm">Page not found.</p>
          <div className="flex items-center gap-2">
            <BackButton label="Back" />
            <button
              onClick={goToAllMatches}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white rounded-xl transition-colors border border-neutral-800"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )
  }
}
