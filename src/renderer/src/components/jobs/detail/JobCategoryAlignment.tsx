import React from 'react'

interface JobCategoryAlignmentProps {
  skillScore: number
  experienceScore: number
  semanticScore: number
}

/**
 * Breakdown card showing individual category alignment percentages:
 * Skills, Experience, and Semantic similarity scores.
 */
export function JobCategoryAlignment({
  skillScore,
  experienceScore,
  semanticScore
}: JobCategoryAlignmentProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-md shadow-slate-200/50 dark:shadow-none transition-colors duration-200">
      <h3 className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-3">
        Category Alignment
      </h3>
      <div className="flex flex-col gap-3 text-xs">
        {/* Skills Alignment */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-600 dark:text-neutral-400">Skills Match</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{skillScore}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, skillScore)}%` }}
            />
          </div>
        </div>

        {/* Experience Alignment */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-600 dark:text-neutral-400">Experience Match</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{experienceScore}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, experienceScore)}%` }}
            />
          </div>
        </div>

        {/* Semantic Similarity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-600 dark:text-neutral-400">Semantic Similarity</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{semanticScore}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, semanticScore)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
