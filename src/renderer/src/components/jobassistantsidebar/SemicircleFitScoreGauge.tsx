import React from 'react'
import { SemicircleFitScoreGaugeProps } from './types'

export function SemicircleFitScoreGauge({
  score,
  potentialScore,
  elapsedTime,
  totalTokens
}: SemicircleFitScoreGaugeProps): React.JSX.Element {
  // Clamp score 0-100
  const normalizedScore = Math.min(100, Math.max(0, score))
  const strokeDash = (normalizedScore / 100) * 125.6 // Arc length for semi-circle with r=40

  const getScoreColorClass = (val: number) => {
    if (val >= 80) return 'text-emerald-400'
    if (val >= 60) return 'text-amber-400'
    return 'text-rose-500'
  }

  const getScoreStrokeClass = (val: number) => {
    if (val >= 80) return 'stroke-emerald-400'
    if (val >= 60) return 'stroke-amber-400'
    return 'stroke-rose-500'
  }

  const getScoreLabel = (val: number) => {
    if (val >= 85) return 'Strong Match'
    if (val >= 70) return 'Good Match'
    if (val >= 55) return 'Moderate Fit'
    return 'Gaps Present'
  }

  const potentialDiff = potentialScore !== undefined ? potentialScore - normalizedScore : 0

  return (
    <div className="flex flex-col items-center bg-neutral-950/80 border border-neutral-900 rounded-2xl p-4 gap-3 shadow-inner">
      {/* Semicircle Gauge Container */}
      <div className="relative w-44 h-24 flex items-end justify-center pt-2">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          {/* Background Semi-circle Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#171717"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Foreground Colored Score Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            className={`${getScoreStrokeClass(normalizedScore)} transition-all duration-700 ease-out`}
            strokeWidth="8.5"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - strokeDash}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Score Overlay */}
        <div className="absolute bottom-1 flex flex-col items-center justify-center text-center">
          <span
            className={`text-3xl font-black tracking-tight leading-none ${getScoreColorClass(
              normalizedScore
            )}`}
          >
            {normalizedScore}%
          </span>
          <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mt-1">
            Fit Score
          </span>
        </div>
      </div>

      {/* Label & Potential Fit Suffix */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Status Badge Label */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200">
          <span
            className={`w-2 h-2 rounded-full ${
              normalizedScore >= 80
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : normalizedScore >= 60
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
            }`}
          />
          <span>{getScoreLabel(normalizedScore)}</span>
        </div>

        {/* Potential Fit Score Suffix */}
        {potentialScore !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
            <span>Potential Fit:</span>
            <span className={`font-bold ${getScoreColorClass(potentialScore)}`}>
              {potentialScore}%
            </span>
            {potentialDiff > 0 && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                (+{potentialDiff}%)
              </span>
            )}
          </div>
        )}

        {/* Match Time & Tokens Metadata */}
        {elapsedTime !== undefined && elapsedTime > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium mt-1">
            <span>Matched in {elapsedTime.toFixed(1)}s</span>
            {totalTokens !== undefined && totalTokens > 0 && (
              <>
                <span>•</span>
                <span>{totalTokens} tokens</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
