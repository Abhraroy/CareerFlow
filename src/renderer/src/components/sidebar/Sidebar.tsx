import React, { useState } from 'react'
import { SidebarProps } from './types'
import { BrandHeader } from './BrandHeader'
import { PrimaryNav } from './PrimaryNav'
import { JobPortalsSection } from './JobPortalsSection'
import { ThemeToggle } from './ThemeToggle'
import { UserSection } from './UserSection'

export function Sidebar({
  displayFullName,
  initials,
  email,
  onLogout,
  profileMenuOpen,
  setProfileMenuOpen,
  collapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse
}: SidebarProps): React.JSX.Element {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const toggleCollapse = externalToggleCollapse || (() => setInternalCollapsed(!internalCollapsed))

  return (
    <aside
      className={`bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex flex-col h-full overflow-hidden select-none transition-all duration-200 ease-in-out relative text-[var(--text-main)] ${
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* 1. Fixed Top Brand Header */}
      <div className="shrink-0">
        <BrandHeader collapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </div>

      {/* 2. Scrollable Center Navigation & Portals Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-2 flex flex-col scrollbar-thin">
        {/* Primary Navigation (Dashboard, Jobs, Resumes, Applications) */}
        <PrimaryNav collapsed={isCollapsed} />

        {/* Subtle Horizontal Divider */}
        <div className="h-px bg-black/5 dark:bg-white/[0.08] my-2 mx-3 shrink-0" />

        {/* Expandable Job Portals Section */}
        <JobPortalsSection collapsed={isCollapsed} />
      </div>

      {/* 3. Fixed Bottom Section (Theme Toggle & Account Details) */}
      <div className="flex flex-col border-t border-[var(--border-sidebar)] shrink-0 mt-auto bg-[var(--bg-sidebar)] z-10">
        <ThemeToggle collapsed={isCollapsed} />
        <UserSection
          displayFullName={displayFullName}
          initials={initials}
          email={email}
          onLogout={onLogout}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
          collapsed={isCollapsed}
        />
      </div>
    </aside>
  )
}
