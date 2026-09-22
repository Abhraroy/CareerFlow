import React from 'react'
import { ApplicationFilterState, ViewMode, ApplicationStage } from './types'
import { LuLayoutGrid, LuList, LuRefreshCw, LuSearch, LuStar } from '../icons'

interface ApplicationsToolbarProps {
  filters: ApplicationFilterState
  setFilters: React.Dispatch<React.SetStateAction<ApplicationFilterState>>
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export function ApplicationsToolbar({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  onRefresh,
  isRefreshing = false
}: ApplicationsToolbarProps): React.JSX.Element {
  const STAGES: { id: 'all' | ApplicationStage; label: string }[] = [
    { id: 'all', label: 'All Stages' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'applied', label: 'Applied' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'interviewing', label: 'Interviewing' },
    { id: 'offer', label: 'Offers' },
    { id: 'rejected', label: 'Rejected' }
  ]

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-md shadow-slate-200/50 dark:shadow-none select-none">
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-md">
        <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by company, job title, or location..."
          value={filters.searchQuery}
          onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
          className="w-full bg-neutral-100 dark:bg-[#1E1E22] border border-black/5 dark:border-white/10 focus:border-neutral-900 dark:focus:border-white rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none transition-colors shadow-xs"
        />
      </div>

      {/* Center: Stage Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {STAGES.map((s) => {
          const isActive = filters.stage === s.id
          return (
            <button
              key={s.id}
              onClick={() => setFilters((prev) => ({ ...prev, stage: s.id }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Right: Shortlist Toggle, View Mode Switcher, Refresh */}
      <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-black/5 dark:border-white/10 pt-2 md:pt-0">
        {/* Shortlisted Only Toggle Button */}
        <button
          onClick={() => setFilters((prev) => ({ ...prev, shortlistedOnly: !prev.shortlistedOnly }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
            filters.shortlistedOnly
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-neutral-100 dark:bg-[#1E1E22] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border-black/5 dark:border-white/10'
          }`}
          title="Filter shortlisted applications"
        >
          <LuStar className={`w-3.5 h-3.5 ${filters.shortlistedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>Shortlisted</span>
        </button>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-neutral-100 dark:bg-[#1E1E22] p-1 rounded-xl border border-black/5 dark:border-white/10 shadow-xs">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white font-bold shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Kanban Board View"
          >
            <LuLayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white font-bold shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
            title="Table List View"
          >
            <LuList className="w-4 h-4" />
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 bg-neutral-100 dark:bg-[#1E1E22] hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-black/5 dark:border-white/10 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
          title="Refresh Applications"
        >
          <LuRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
        </button>
      </div>
    </div>
  )
}
