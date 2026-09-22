import React from 'react'
import { useAppStore } from '../../lib/zustandStore'
import { LuSun, LuMoon } from '../icons'

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps): React.JSX.Element {
  const { theme, setTheme, toggleTheme } = useAppStore()

  if (collapsed) {
    return (
      <div className="p-2 flex justify-center">
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-neutral-200 dark:hover:bg-neutral-800 shadow-xs cursor-pointer"
        >
          {theme === 'light' ? (
            <LuMoon className="w-4 h-4 text-neutral-600" />
          ) : (
            <LuSun className="w-4 h-4 text-amber-400" />
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 select-none">
      <div className="flex items-center bg-neutral-100 dark:bg-[#1E1E22] p-1 rounded-xl border border-black/5 dark:border-white/10 transition-colors">
        {/* Light Option */}
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            theme === 'light'
              ? 'bg-white text-neutral-900 shadow-sm border border-black/5'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <LuSun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-neutral-400'}`} />
          <span>Light</span>
        </button>

        {/* Dark Option */}
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#27272A] text-white shadow-sm border border-white/10'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <LuMoon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-neutral-400'}`} />
          <span>Dark</span>
        </button>
      </div>
    </div>
  )
}
