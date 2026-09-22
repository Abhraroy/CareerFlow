import { useNavigationStore } from './navigationStore'
import { AppRoute } from './types'

import { PortalController } from './PortalController'

export interface UseNavigationReturn {
  route: AppRoute
  currentRoute: AppRoute
  history: AppRoute[]
  historyIndex: number
  navigate: (route: AppRoute) => void
  goBack: () => void
  goForward: () => void
  canGoBack: boolean
  canGoForward: boolean
  goToDashboard: () => void
  goToJobs: () => void
  goToResumes: () => void
  goToApplications: () => void
  goToSettings: () => void
  goToApiUsage: () => void
  goToAllMatches: () => void
  goToTailorResume: () => void
  goToJobMatch: (matchId: string) => void
  goToResume: (resumeName: string) => void
  goToPortal: (portalId: string, forceReset?: boolean) => void
}

export function useNavigation(): UseNavigationReturn {
  const currentRoute = useNavigationStore((s) => s.currentRoute)
  const history = useNavigationStore((s) => s.history)
  const historyIndex = useNavigationStore((s) => s.historyIndex)
  const navigate = useNavigationStore((s) => s.navigate)
  const goBack = useNavigationStore((s) => s.goBack)
  const goForward = useNavigationStore((s) => s.goForward)
  const canGoBack = useNavigationStore((s) => s.canGoBack)
  const canGoForward = useNavigationStore((s) => s.canGoForward)

  const goToDashboard = (): void => navigate({ type: 'dashboard' })
  const goToJobs = (): void => navigate({ type: 'jobs' })
  const goToResumes = (): void => navigate({ type: 'resumes' })
  const goToApplications = (): void => navigate({ type: 'applications' })
  const goToSettings = (): void => navigate({ type: 'settings' })
  const goToApiUsage = (): void => navigate({ type: 'api-usage' })
  const goToAllMatches = (): void => navigate({ type: 'all-matches' })
  const goToTailorResume = (): void => navigate({ type: 'tailor-resume' })
  const goToJobMatch = (matchId: string): void => navigate({ type: 'view-analysis', matchId })
  const goToResume = (resumeName: string): void => navigate({ type: 'resume', resumeName })
  const goToPortal = (portalId: string, forceReset?: boolean): void => {
    if ((currentRoute.type === 'portal' && currentRoute.portalId === portalId) || forceReset) {
      PortalController.show(portalId, true)
    } else {
      navigate({ type: 'portal', portalId })
    }
  }

  return {
    route: currentRoute,
    currentRoute,
    history,
    historyIndex,
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    goToDashboard,
    goToJobs,
    goToResumes,
    goToApplications,
    goToSettings,
    goToApiUsage,
    goToAllMatches,
    goToTailorResume,
    goToJobMatch,
    goToResume,
    goToPortal
  }
}
