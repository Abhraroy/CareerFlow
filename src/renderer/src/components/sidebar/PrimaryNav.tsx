import React from 'react'
import { useNavigation } from '../../navigation/useNavigation'
import {
  LuLayoutDashboard,
  LuBriefcase,
  LuFileText,
  LuSend
} from '../icons'

interface PrimaryNavProps {
  collapsed?: boolean
}

export function PrimaryNav({ collapsed = false }: PrimaryNavProps): React.JSX.Element {
  const { route, goToDashboard, goToJobs, goToResumes, goToApplications } = useNavigation()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LuLayoutDashboard,
      active: route.type === 'dashboard',
      onClick: () => goToDashboard()
    },
    {
      id: 'jobs',
      label: 'Jobs',
      icon: LuBriefcase,
      active: route.type === 'jobs',
      onClick: () => goToJobs()
    },
    {
      id: 'resumes',
      label: 'Resumes',
      icon: LuFileText,
      active: route.type === 'resumes',
      onClick: () => goToResumes()
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: LuSend,
      active: route.type === 'applications',
      onClick: () => goToApplications()
    }
  ]

  return (
    <nav className="flex flex-col gap-1 px-3 py-2 select-none">
      {navItems.map((item) => {
        const Icon = item.icon

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            title={collapsed ? item.label : undefined}
            className={`group relative flex items-center ${
              collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'gap-3 px-3 py-2.5 w-full'
            } rounded-xl text-[1rem] transition-all duration-150 ease-out text-left cursor-pointer ${
              item.active
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white font-bold shadow-md shadow-slate-200/70 dark:shadow-none border border-slate-200 dark:border-white/10'
                : 'text-slate-600 dark:text-neutral-400 font-semibold hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800/40 border border-transparent'
            }`}
          >
            {/* Nav Icon */}
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                item.active
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white'
              }`}
            />

            {!collapsed && (
              <span className="truncate flex-1 tracking-tight">{item.label}</span>
            )}

            {/* Collapsed Tooltip */}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                {item.label}
              </div>
            )}
          </button>
        )
      })}
    </nav>
  )
}
