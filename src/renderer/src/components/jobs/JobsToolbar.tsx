import React, { useState, useRef, useEffect } from 'react'
import { FiCheckSquare, LuCheck, LuFilter, LuSlidersHorizontal, LuTrash2 } from '../icons'
import { SortMode, FilterState } from './types'
import { Resume } from '../../types'

interface JobsToolbarProps {
  searchTerm: string
  onSearchChange: (val: string) => void
  sortMode: SortMode
  onSortChange: (mode: SortMode) => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  resumes: Resume[]
  selectedCount: number
  totalCount: number
  onToggleSelectAll: () => void
  onDeleteSelected?: () => void
}

export function JobsToolbar({
  searchTerm: _searchTerm,
  onSearchChange: _onSearchChange,
  sortMode,
  onSortChange,
  filters,
  onFiltersChange,
  resumes,
  selectedCount,
  totalCount,
  onToggleSelectAll,
  onDeleteSelected
}: JobsToolbarProps): React.JSX.Element {
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  // Check if non-default filters are active
  const isFilterActive =
    filters.resumeId !== 'all' ||
    filters.minScore > 0 ||
    filters.employmentType !== 'all'

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false)
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortOptions: { id: SortMode; label: string }[] = [
    { id: 'score_desc', label: 'Match Score: High to Low' },
    { id: 'score_asc', label: 'Match Score: Low to High' },
    { id: 'date_desc', label: 'Date: Newest First' },
    { id: 'company_asc', label: 'Company: A to Z' },
    { id: 'title_asc', label: 'Job Title: A to Z' }
  ]

  const resetFilters = (): void => {
    onFiltersChange({
      resumeId: 'all',
      minScore: 0,
      employmentType: 'all'
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 select-none">
      {/* Controls Group (Select, Sort, Filter) */}
      <div className="flex items-center gap-2">
        {/* Select Button */}
        <button
          onClick={onToggleSelectAll}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-xs ${
            selectedCount > 0
              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
              : 'bg-white dark:bg-[#212124] hover:bg-neutral-100 dark:hover:bg-neutral-800 border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <FiCheckSquare className="w-3.5 h-3.5" />
          <span>
            {selectedCount > 0
              ? `Selected (${selectedCount}/${totalCount})`
              : 'Select'}
          </span>
        </button>

        {/* Delete Selected Button */}
        {selectedCount > 0 && onDeleteSelected && (
          <button
            onClick={onDeleteSelected}
            title="Delete selected job matches"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-900/40"
          >
            <LuTrash2 className="w-3.5 h-3.5" />
            <span>Delete ({selectedCount})</span>
          </button>
        )}

        {/* Sort Menu */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => {
              setSortOpen((prev) => !prev)
              setFilterOpen(false)
            }}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-xs ${
              sortOpen
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'bg-white dark:bg-[#212124] hover:bg-neutral-100 dark:hover:bg-neutral-800 border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <LuSlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sort</span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 shadow-xl py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Sort Options
              </div>
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSortChange(opt.id)
                    setSortOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                    sortMode === opt.id
                      ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/[0.08] font-bold'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortMode === opt.id && <LuCheck className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Menu */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => {
              setFilterOpen((prev) => !prev)
              setSortOpen(false)
            }}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer shadow-xs ${
              isFilterActive
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : filterOpen
                  ? 'bg-neutral-200 dark:bg-neutral-800 border-black/5 dark:border-white/10 text-neutral-900 dark:text-white'
                  : 'bg-white dark:bg-[#212124] hover:bg-neutral-100 dark:hover:bg-neutral-800 border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <LuFilter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {isFilterActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 shadow-xl p-3.5 z-50 text-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
                <span className="text-[11px] font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Filters
                </span>
                {isFilterActive && (
                  <button
                    onClick={resetFilters}
                    className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Resume Filter */}
              {resumes && resumes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">
                    Resume Target
                  </label>
                  <select
                    value={filters.resumeId}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, resumeId: e.target.value })
                    }
                    className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Resumes</option>
                    {resumes.map((r) => (
                      <option key={r.id || r.name} value={r.id || r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Minimum Score Filter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase">
                    Min Match Score
                  </label>
                  <span className="text-[11px] font-extrabold text-neutral-900 dark:text-white">
                    {filters.minScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={filters.minScore}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minScore: Number(e.target.value)
                    })
                  }
                  className="w-full accent-neutral-900 dark:accent-white bg-neutral-200 dark:bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Employment Type Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase">
                  Employment Type
                </label>
                <select
                  value={filters.employmentType}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      employmentType: e.target.value
                    })
                  }
                  className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
