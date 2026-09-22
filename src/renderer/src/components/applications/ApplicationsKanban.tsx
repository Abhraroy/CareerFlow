import React from 'react'
import { ApplicationItem, ApplicationStage } from './types'
import { ApplicationCard } from './ApplicationCard'

interface ApplicationsKanbanProps {
  applications: ApplicationItem[]
  onToggleShortlist: (id: string, current: boolean) => void
  onUpdateStage: (id: string, newStage: ApplicationStage) => void
  onSelectApplication: (application: ApplicationItem) => void
}

const KANBAN_COLUMNS: { id: ApplicationStage; title: string; accentColor: string; badgeBg: string }[] = [
  {
    id: 'in_progress',
    title: 'In Progress',
    accentColor: 'border-indigo-500/40 text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-500/20'
  },
  {
    id: 'applied',
    title: 'Applied',
    accentColor: 'border-blue-500/40 text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/20'
  },
  {
    id: 'shortlisted',
    title: 'Shortlisted',
    accentColor: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20'
  },
  {
    id: 'interviewing',
    title: 'Interviewing',
    accentColor: 'border-purple-500/40 text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-500/20'
  },
  {
    id: 'offer',
    title: 'Offer Received',
    accentColor: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20'
  },
  {
    id: 'rejected',
    title: 'Rejected',
    accentColor: 'border-red-500/40 text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-500/20'
  }
]

export function ApplicationsKanban({
  applications,
  onToggleShortlist,
  onUpdateStage,
  onSelectApplication
}: ApplicationsKanbanProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start select-none">
      {KANBAN_COLUMNS.map((col) => {
        const columnApps = applications.filter((app) => app.status === col.id)

        return (
          <div
            key={col.id}
            className="flex flex-col bg-white/60 dark:bg-[#1C1C1E]/80 border border-black/5 dark:border-white/10 rounded-2xl p-3 min-h-[500px] shadow-xs"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b ${col.accentColor.split(' ')[0]}`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.accentColor.split(' ')[1]}`}>
                  {col.title}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${col.badgeBg}`}>
                  {columnApps.length}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="flex flex-col gap-3 flex-1">
              {columnApps.length > 0 ? (
                columnApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onToggleShortlist={onToggleShortlist}
                    onUpdateStage={onUpdateStage}
                    onSelectApplication={onSelectApplication}
                  />
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-black/5 dark:border-white/[0.06] rounded-xl p-6 text-center text-neutral-400">
                  <p className="text-xs font-medium">No applications in this stage</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
