export interface SidebarProps {
  displayFullName: string
  initials: string
  email?: string
  onLogout: () => void
  profileMenuOpen: boolean
  setProfileMenuOpen: (open: boolean) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export type NavItemId = 'dashboard' | 'jobs' | 'resumes' | 'applications'
