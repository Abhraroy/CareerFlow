import React, { useState } from 'react'
import { PORTALS } from '../../constants'
import { useNavigation } from '../../navigation/useNavigation'
import { PortalIcon } from './PortalIcon'
import { LuArrowRight, LuChevronDown, LuChevronUp } from '../icons'

interface JobPortalsSectionProps {
  collapsed?: boolean
}

const INITIAL_PORTALS_COUNT = 5

export function JobPortalsSection({ collapsed = false }: JobPortalsSectionProps): React.JSX.Element {
  const { route, goToPortal } = useNavigation()
  const [isExpanded, setIsExpanded] = useState(false)

  // If user is currently viewing a portal beyond initial count, keep it expanded
  const activePortalIndex = PORTALS.findIndex(
    (p) => route.type === 'portal' && route.portalId === p.id
  )
  const isViewingHiddenPortal = activePortalIndex >= INITIAL_PORTALS_COUNT
  const effectivelyExpanded = isExpanded || isViewingHiddenPortal

  const displayedPortals = effectivelyExpanded
    ? PORTALS
    : PORTALS.slice(0, INITIAL_PORTALS_COUNT)

  const handleToggleExpand = (): void => {
    setIsExpanded((prev) => !prev)
  }

  if (collapsed) {
    return (
      <div className="px-3 py-2 flex flex-col gap-1.5 items-center">
        {displayedPortals.map((portal) => {
          const isActive = route.type === 'portal' && route.portalId === portal.id

          return (
            <button
              key={portal.id}
              onClick={() => goToPortal(portal.id)}
              title={portal.label}
              className={`group relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-150 ease-out cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 border border-transparent'
              }`}
            >
              <PortalIcon portal={portal} className="w-6 h-6" />

              {/* Collapsed Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                {portal.label}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="px-3 py-2 flex flex-col select-none">
      {/* Section Header */}
      <div className="px-2.5 py-1.5 mb-1 flex items-center justify-between">
        <span className="text-[1rem] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">
          JOB PORTALS
        </span>
        <span className="text-[0.8rem] font-semibold text-neutral-400 dark:text-neutral-500 bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">
          {displayedPortals.length}
        </span>
      </div>

      {/* Portal List (Expands to fit all portals cleanly without inner scrollbars) */}
      <div className="flex flex-col gap-0.5 transition-all duration-200">
        {displayedPortals.map((portal) => {
          const isActive = route.type === 'portal' && route.portalId === portal.id

          return (
            <button
              key={portal.id}
              onClick={() => goToPortal(portal.id)}
              className={`group relative flex items-center justify-between w-full px-3 py-2 rounded-xl text-[0.9rem] transition-all duration-150 ease-out text-left cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10'
                  : 'text-neutral-500 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`transition-colors duration-150 ${
                    isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                  }`}
                >
                  <PortalIcon portal={portal} className="w-6 h-6" />
                </span>
                <span className="truncate tracking-tight">{portal.label}</span>
              </div>

              {/* Right-facing arrow indicator */}
              <LuArrowRight
                className={`w-3.5 h-3.5 transition-all duration-150 ${
                  isActive
                    ? 'text-neutral-900 dark:text-white opacity-100'
                    : 'text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* View More / View Less Actions */}
      {PORTALS.length > INITIAL_PORTALS_COUNT && (
        <div className="mt-1 flex cursor-pointer items-center justify-center">
          {!effectivelyExpanded ? (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="flex gap-2 items-center justify-center w-full px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
            >
              <span>View More ({PORTALS.length - INITIAL_PORTALS_COUNT} more)</span>
              <LuChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="flex gap-2 items-center justify-center w-full px-2.5 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
            >
              <span>View Less</span>
              <LuChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
