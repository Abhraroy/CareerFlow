import React from 'react'

interface JobDescriptionTabProps {
  description: string
  copiedDescription: boolean
  onCopyDescription: () => void
}

/**
 * Tab Content: Full Job Description.
 * Text display with one-click copy button.
 */
export function JobDescriptionTab({
  description,
  copiedDescription,
  onCopyDescription
}: JobDescriptionTabProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <pre className="bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-5 rounded-2xl text-xs text-slate-800 dark:text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap shadow-xs">
        {description || 'No description available.'}
      </pre>
      {description && (
        <button
          onClick={onCopyDescription}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
        >
          {copiedDescription ? (
            <>
              <svg
                className="w-4 h-4 text-emerald-400 dark:text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied Description!
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-slate-300 dark:text-neutral-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy Job Description
            </>
          )}
        </button>
      )}
    </div>
  )
}
