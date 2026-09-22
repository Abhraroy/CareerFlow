import { create } from 'zustand'
import { AppRoute, NavigationState, areRoutesEqual } from './types'
import { PortalController } from './PortalController'

import { useAppStore } from '../lib/zustandStore'

const defaultInitialRoute: AppRoute = { type: 'dashboard' }

export interface NavigationStoreActions {
  /** Pushes a new route onto the history stack and synchronizes portal WebContentsView visibility */
  navigate: (route: AppRoute) => void
  /** Navigates backward to the previous route in the navigation history stack */
  goBack: () => void
  /** Navigates forward to the next route in the navigation history stack */
  goForward: () => void
  /** Resets the navigation stack and history back to the initial default route */
  resetNavigation: (initialRoute?: AppRoute) => void
}

export type NavigationStore = NavigationState & NavigationStoreActions

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  /** The currently active navigation route displayed in the application */
  currentRoute: defaultInitialRoute,
  /** Linear history stack of all navigated routes */
  history: [defaultInitialRoute],
  /** Current index pointer within the route history stack */
  historyIndex: 0,
  /** Flag indicating whether backward navigation in history is available */
  canGoBack: false,
  /** Flag indicating whether forward navigation in history is available */
  canGoForward: false,

  navigate: (newRoute: AppRoute) => {
    const { currentRoute, history, historyIndex } = get()

    // Deduplicate consecutive navigations to the exact same route
    if (areRoutesEqual(currentRoute, newRoute)) {
      return
    }

    // Reset tailor state if navigating to a job page or leaving tailor-resume
    if (
      newRoute.type === 'jobs' ||
      newRoute.type === 'view-analysis' ||
      newRoute.type === 'all-matches' ||
      currentRoute.type === 'tailor-resume'
    ) {
      useAppStore.getState().resetTailoringState()
    }

    // Truncate forward history if we were in the middle of history stack
    const truncatedHistory = history.slice(0, historyIndex + 1)
    const nextHistory = [...truncatedHistory, newRoute]
    const nextIndex = nextHistory.length - 1

    set({
      currentRoute: newRoute,
      history: nextHistory,
      historyIndex: nextIndex,
      canGoBack: nextIndex > 0,
      canGoForward: false
    })

    // Sync portal WebContentsView visibility
    PortalController.syncWithRoute(newRoute)
  },

  goBack: () => {
    const { currentRoute, history, historyIndex } = get()
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1
      const targetRoute = history[nextIndex]

      if (
        targetRoute.type === 'jobs' ||
        targetRoute.type === 'view-analysis' ||
        targetRoute.type === 'all-matches' ||
        currentRoute.type === 'tailor-resume'
      ) {
        useAppStore.getState().resetTailoringState()
      }

      set({
        currentRoute: targetRoute,
        historyIndex: nextIndex,
        canGoBack: nextIndex > 0,
        canGoForward: nextIndex < history.length - 1
      })

      PortalController.syncWithRoute(targetRoute)
    }
  },

  goForward: () => {
    const { currentRoute, history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1
      const targetRoute = history[nextIndex]

      if (
        targetRoute.type === 'jobs' ||
        targetRoute.type === 'view-analysis' ||
        targetRoute.type === 'all-matches' ||
        currentRoute.type === 'tailor-resume'
      ) {
        useAppStore.getState().resetTailoringState()
      }

      set({
        currentRoute: targetRoute,
        historyIndex: nextIndex,
        canGoBack: nextIndex > 0,
        canGoForward: nextIndex < history.length - 1
      })

      PortalController.syncWithRoute(targetRoute)
    }
  },

  resetNavigation: (initialRoute: AppRoute = defaultInitialRoute) => {
    useAppStore.getState().resetTailoringState()
    set({
      currentRoute: initialRoute,
      history: [initialRoute],
      historyIndex: 0,
      canGoBack: false,
      canGoForward: false
    })

    PortalController.syncWithRoute(initialRoute)
  }
}))
