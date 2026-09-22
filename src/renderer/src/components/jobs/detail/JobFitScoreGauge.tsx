import React from 'react'

interface JobFitScoreGaugeProps {
  currentFitScore: number
  potentialFitScore: number
  verdictDecision: string
}

/**
 * Circular SVG gauge displaying the overall fit score, potential score delta,
 * and the colored verdict recommendation badge.
 */
export function JobFitScoreGauge({
  currentFitScore,
  potentialFitScore,
  verdictDecision
}: JobFitScoreGaugeProps): React.JSX.Element {
  const strokeColor =
    currentFitScore >= 80 ? '#10b981' : currentFitScore >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md shadow-slate-200/50 dark:shadow-none transition-colors duration-200">
      <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase font-black tracking-wider mb-3">
        Overall Match Score
      </span>
      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="56"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-100 dark:text-white/5"
          />
          <circle
            cx="72"
            cy="72"
            r="56"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={351}
            strokeDashoffset={351 - (351 * currentFitScore) / 100}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentFitScore}%
          </span>
          <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase">
            Fit
          </span>
        </div>
      </div>

      {/* Potential Fit Pill */}
      {potentialFitScore > currentFitScore && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1 shadow-xs">
          <span>Potential: {potentialFitScore}%</span>
          <span className="text-[10px] bg-emerald-600 text-white font-black rounded px-1.5 py-0.2">
            +{potentialFitScore - currentFitScore}%
          </span>
        </div>
      )}

      {/* Verdict Decision Tag */}
      <span
        className={`mt-3 text-xs font-bold px-3.5 py-1.5 rounded-xl text-center max-w-full truncate shadow-xs ${
          verdictDecision.includes('Strongly') || verdictDecision.includes('Recommended to Apply')
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
            : verdictDecision.includes('Apply After')
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
        }`}
      >
        {verdictDecision}
      </span>
    </div>
  )
}
