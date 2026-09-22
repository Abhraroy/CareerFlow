import React, { useState, useEffect } from 'react'
import { useNavigationStore } from '../navigation/navigationStore'
import { BackButton } from './BackButton'
import {
  LuArrowLeft,
  LuArrowRight,
  LuPanelRight,
  LuRotateCw,
  FiHome,
  FiAlertCircle,
  LuExternalLink
} from '@/components/icons'

interface BrowserControlHeaderProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
}

export function BrowserControlHeader({
  sidebarCollapsed,
  setSidebarCollapsed
}: BrowserControlHeaderProps): React.JSX.Element {
  const [inputUrl, setInputUrl] = useState<string>('')
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [canGoBack, setCanGoBack] = useState<boolean>(false)
  const [canGoForward, setCanGoForward] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [navError, setNavError] = useState<{ code: number; description: string; url: string } | null>(null)
  const [externalBehavior, setExternalBehavior] = useState<'controlled' | 'system'>('system')

  const currentRoute = useNavigationStore((s) => s.currentRoute)
  const activePortalId = currentRoute.type === 'portal' ? currentRoute.portalId : ''

  // Sync initial external behavior setting from main process
  useEffect(() => {
    window.api?.getExternalBehavior?.().then((behavior) => {
      if (behavior) setExternalBehavior(behavior)
    })

    const unsubscribe = window.api?.onExternalBehaviorChanged?.((behavior) => {
      setExternalBehavior(behavior)
    })
    return () => {
      unsubscribe?.()
    }
  }, [])

  // Listen to full navigation state updates from main process
  useEffect(() => {
    if (!activePortalId) return

    const unsubscribe = window.api.onNavigationState((state) => {
      if (state.portalId === activePortalId) {
        if (!isFocused) {
          setInputUrl(state.url)
        }
        setCanGoBack(state.canGoBack)
        setCanGoForward(state.canGoForward)
        setIsLoading(state.isLoading)
        setNavError(state.error || null)
      }
    })
    return () => {
      unsubscribe()
    }
  }, [activePortalId, isFocused])

  const handleNavigate = (action: 'back' | 'forward' | 'reload'): void => {
    window.api.navigate(action)
  }

  const handleGoHome = (): void => {
    if (activePortalId) {
      window.api.switchPortal(activePortalId, true)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (inputUrl.trim()) {
      window.api.loadURL(inputUrl)
    }
  }

  const toggleExternalBehavior = (): void => {
    const nextBehavior = externalBehavior === 'system' ? 'controlled' : 'system'
    setExternalBehavior(nextBehavior)
    window.api?.setExternalBehavior?.(nextBehavior)
  }

  return (
    <div className="h-12 min-h-12 border-b border-neutral-900 px-3.5 flex items-center gap-3 justify-between bg-black select-none">
      {/* App Navigation Back Button & Web Controls */}
      <div className="flex items-center gap-2">
        <BackButton title="Go back to previous page in app" />

        <div className="h-4 w-px bg-neutral-800 mx-0.5" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoBack}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
              canGoBack
                ? 'hover:bg-neutral-900 active:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer'
                : 'text-neutral-700 cursor-not-allowed'
            }`}
            onClick={() => handleNavigate('back')}
            title="Browser: Back"
          >
            <LuArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canGoForward}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
              canGoForward
                ? 'hover:bg-neutral-900 active:bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer'
                : 'text-neutral-700 cursor-not-allowed'
            }`}
            onClick={() => handleNavigate('forward')}
            title="Browser: Forward"
          >
            <LuArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-900 active:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            onClick={() => handleNavigate('reload')}
            title={isLoading ? 'Loading page...' : 'Browser: Reload'}
          >
            <LuRotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-900 active:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            onClick={handleGoHome}
            title="Browser: Reset to Portal Home"
          >
            <FiHome className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* URL Input Bar & Error Notification */}
      <div className="flex-1 max-w-2xl mx-2 flex items-center gap-2">
        <form onSubmit={handleUrlSubmit} className="flex-1">
          <input
            type="text"
            value={inputUrl}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search or enter URL"
            className="w-full bg-neutral-900 text-neutral-200 text-xs px-3 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-neutral-700 transition-colors font-sans"
          />
        </form>

        {navError && (
          <div
            className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2 py-1 rounded-md"
            title={`${navError.description} (${navError.code})`}
          >
            <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[140px]">Failed to load</span>
          </div>
        )}
      </div>

      {/* External Link Destination Toggle Button & Job Assistant Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleExternalBehavior}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
            externalBehavior === 'system'
              ? 'bg-blue-950/50 border-blue-800/70 text-blue-300 hover:bg-blue-900/70 hover:text-white'
              : 'bg-emerald-950/50 border-emerald-800/70 text-emerald-300 hover:bg-emerald-900/70 hover:text-white'
          }`}
          title={
            externalBehavior === 'system'
              ? 'Outside links open in Chrome (External Browser). Click to toggle to App Window.'
              : 'Outside links open in Controlled App Window. Click to toggle to Chrome.'
          }
        >
          <LuExternalLink className="w-3.5 h-3.5" />
          <span>{externalBehavior === 'system' ? 'Chrome' : 'App Window'}</span>
        </button>

        <button
          type="button"
          className={`flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-900 active:bg-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer border ${
            sidebarCollapsed
              ? 'border-neutral-800 text-neutral-400'
              : 'border-neutral-700 text-neutral-200 bg-neutral-900/50'
          }`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand Job Assistant' : 'Collapse Job Assistant'}
        >
          <LuPanelRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

