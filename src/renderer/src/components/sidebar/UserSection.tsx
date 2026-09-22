import React, { useRef, useEffect } from 'react'
import { useNavigation } from '../../navigation/useNavigation'
import { LuChevronDown, LuCpu, LuLogOut, LuSettings } from '../icons'

interface UserSectionProps {
  displayFullName: string
  initials: string
  email?: string
  onLogout: () => void
  profileMenuOpen: boolean
  setProfileMenuOpen: (open: boolean) => void
  collapsed?: boolean
}

export function UserSection({
  displayFullName,
  initials,
  email,
  onLogout,
  profileMenuOpen,
  setProfileMenuOpen,
  collapsed = false
}: UserSectionProps): React.JSX.Element {
  const { goToSettings, goToApiUsage } = useNavigation()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close popup menu when clicking outside
  useEffect(() => {
    if (!profileMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileMenuOpen, setProfileMenuOpen])

  const userInitial = initials || (displayFullName ? displayFullName.charAt(0).toUpperCase() : 'A')
  const userEmail = email || 'user@example.com'

  return (
    <div ref={menuRef} className="relative p-3 border-t border-[var(--border-sidebar)] mt-auto select-none shrink-0">
      {/* Popover Menu */}
      {profileMenuOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-3 right-3 bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl p-1.5 shadow-xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
          {/* Settings button */}
          <button
            onClick={() => {
              goToSettings()
              setProfileMenuOpen(false)
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors text-left font-medium cursor-pointer"
          >
            <LuSettings className="w-3.5 h-3.5 text-neutral-500" />
            <span>Settings</span>
          </button>

          {/* API Usage button */}
          <button
            onClick={() => {
              goToApiUsage()
              setProfileMenuOpen(false)
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.08] rounded-xl transition-colors text-left font-medium cursor-pointer"
          >
            <LuCpu className="w-3.5 h-3.5 text-neutral-500" />
            <span>API Usage</span>
          </button>

          <div className="h-px bg-black/5 dark:bg-white/[0.08] my-0.5" />

          {/* Logout button */}
          <button
            onClick={() => {
              setProfileMenuOpen(false)
              onLogout()
            }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium cursor-pointer"
          >
            <LuLogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      )}

      {/* User Card Trigger matching reference screenshots */}
      <div
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className={`flex items-center ${
          collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'justify-between px-2.5 py-2'
        } bg-white dark:bg-[#1E1E22] hover:bg-slate-100 dark:hover:bg-neutral-800/60 border border-slate-200 dark:border-white/10 rounded-2xl cursor-pointer transition-all duration-150 group shadow-sm shadow-slate-200/50 dark:shadow-none`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Avatar circle matching screenshot */}
          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
            <span>{userInitial}</span>
          </div>

          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold text-neutral-900 dark:text-white truncate leading-tight">
                {displayFullName || 'Account'}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate leading-tight font-normal">
                {userEmail}
              </span>
            </div>
          )}
        </div>

        {!collapsed && (
          <LuChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-transform duration-200 shrink-0 ${
              profileMenuOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
            }`}
          />
        )}
      </div>
    </div>
  )
}
