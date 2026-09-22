export type InternalRoute =
  | { type: 'dashboard' }
  | { type: 'jobs' }
  | { type: 'resumes' }
  | { type: 'applications' }
  | { type: 'settings' }
  | { type: 'api-usage' }
  | { type: 'all-matches' }
  | { type: 'tailor-resume' }
  | { type: 'view-analysis'; matchId: string }
  | { type: 'resume'; resumeName: string }

export type PortalRoute = {
  type: 'portal'
  portalId: string
}

export type AppRoute = InternalRoute | PortalRoute

export interface NavigationState {
  currentRoute: AppRoute
  history: AppRoute[]
  historyIndex: number

  navigate: (route: AppRoute) => void
  goBack: () => void
  goForward: () => void

  canGoBack: boolean
  canGoForward: boolean
}

export function isPortalRoute(route: AppRoute): route is PortalRoute {
  return route.type === 'portal'
}

export function isInternalRoute(route: AppRoute): route is InternalRoute {
  return route.type !== 'portal'
}

export function areRoutesEqual(a: AppRoute, b: AppRoute): boolean {
  if (a.type !== b.type) return false
  switch (a.type) {
    case 'dashboard':
    case 'jobs':
    case 'resumes':
    case 'applications':
    case 'settings':
    case 'api-usage':
    case 'all-matches':
    case 'tailor-resume':
      return true
    case 'view-analysis':
      return a.matchId === (b as Extract<AppRoute, { type: 'view-analysis' }>).matchId
    case 'resume':
      return a.resumeName === (b as Extract<AppRoute, { type: 'resume' }>).resumeName
    case 'portal':
      return a.portalId === (b as Extract<AppRoute, { type: 'portal' }>).portalId
    default:
      return false
  }
}
