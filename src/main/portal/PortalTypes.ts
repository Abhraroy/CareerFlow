import { WebContentsView } from 'electron'

export interface PortalWrapperRule {
  match: {
    hostnames?: string[]
    paths?: string[]
    pathPrefixes?: string[]
  }
  destination: {
    queryParam?: string
  }
}

export interface PortalAuthRule {
  hostnames?: string[]
  paths?: string[]
  pathPrefixes?: string[]
}

export interface PortalNavigationConfig {
  wrappers?: PortalWrapperRule[]
  auth?: {
    rules?: PortalAuthRule[]
  }
  external?: {
    behavior?: 'controlled' | 'system'
  }
}

export interface PortalConfig {
  defaultUrl: string
  domains: string[]
  userAgent?: string
  navigation?: PortalNavigationConfig
}

export type NavigationKind = 'internal' | 'auth' | 'external'

export type NavigationPolicyType = 'internal' | 'auth' | 'external_controlled' | 'external_system'

export interface NavigationPolicy {
  type: NavigationPolicyType
}


export interface PortalNavigationError {
  code: number
  description: string
  url: string
}

export interface PortalNavigationState {
  portalId: string
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  error?: PortalNavigationError | null
}

export interface PortalRuntimeState {
  portalId: string
  view: WebContentsView
  initialized: boolean
  state: PortalNavigationState
}

export type NavigationAction = 'back' | 'forward' | 'reload'

export interface RectBounds {
  x: number
  y: number
  width: number
  height: number
}
