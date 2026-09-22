import React, { useState } from 'react'
import { FiCheck, FiClock, FiHelpCircle, FiMoreHorizontal } from '../../icons'
import { BackButton } from '../../BackButton'
import { useNavigation } from '../../../navigation/useNavigation'

export function TailorHeader(): React.JSX.Element {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const { goToResumes } = useNavigation()

  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => {
      setCopiedLink(false)
      setShowMoreMenu(false)
    }, 1500)
  }

  return (
    <header className="w-full bg-transparent backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-5 py-3 flex items-center justify-between z-20 flex-shrink-0 select-none shadow-xs transition-colors duration-200">
      {/* Left: Navigation & Page Title */}
      <div className="flex items-center gap-3.5">
        <BackButton title="Go back to previous page" />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              Tailor Resume
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              AI Studio
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
            Optimize your resume for the target job
          </p>
        </div>
      </div>

      {/* Right: Auxiliary Page Controls */}
      <div className="flex items-center gap-2 relative">
        <button
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs"
          title="Tailoring version history & saved resumes"
          onClick={goToResumes}
        >
          <FiClock className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span>History</span>
        </button>

        <button
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-bold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs"
          title="Tailoring guidelines & help"
          onClick={() => {
            /* Help dialog trigger / feedback */
          }}
        >
          <FiHelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
          <span>Help</span>
        </button>

        {/* More Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More options"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] transition-all duration-150 cursor-pointer shadow-xs"
            title="More actions"
          >
            <FiMoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <button
                onClick={handleCopyLink}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Copy Page Link</span>
                {copiedLink ? (
                  <FiCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : null}
              </button>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Keyboard Shortcuts</span>
                <span className="text-[10px] text-slate-500 font-mono">⌘/</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
