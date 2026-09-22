import React, { useState, useRef, useEffect } from 'react'
import { ResumeSelectDropdownProps } from './types'
import { LuCheck, LuChevronDown, LuFileText } from '@/components/icons'

/**
 * Modular, minimal, and smooth dropdown component for choosing an active resume.
 * Designed to be easily replaced or swapped with external UI component libraries if desired.
 */
export function ResumeSelectDropdown({
  resumes,
  selectedResumeName,
  onSelectResume
}: ResumeSelectDropdownProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedResume = resumes.find((r) => r.name === selectedResumeName) || resumes[0]

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
        SELECT RESUME
      </span>

      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full px-3 py-2.5 bg-neutral-950 border rounded-xl text-xs font-medium text-white flex items-center justify-between transition-all duration-200 cursor-pointer shadow-sm ${
            isOpen
              ? 'border-neutral-700 bg-neutral-900 ring-1 ring-neutral-700/50'
              : 'border-neutral-900 hover:border-neutral-800 hover:bg-neutral-900/80'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-emerald-400">
              <LuFileText className="w-3 h-3" />
            </div>
            <span className="truncate text-xs font-semibold text-neutral-100">
              {selectedResume?.name || 'No resume selected'}
            </span>
          </div>

          <LuChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ml-2 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {/* Custom Animated Popup Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150"
          >
            {resumes.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-500 italic">No resumes available</div>
            ) : (
              resumes.map((res) => {
                const isSelected = res.name === selectedResumeName
                return (
                  <button
                    key={res.id || res.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectResume(res.name)
                      setIsOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 text-emerald-400 font-semibold'
                        : 'text-neutral-300 hover:bg-neutral-900/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <LuFileText
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-emerald-400' : 'text-neutral-500'
                        }`}
                      />
                      <span className="truncate">{res.name}</span>
                    </div>

                    {isSelected && <LuCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
