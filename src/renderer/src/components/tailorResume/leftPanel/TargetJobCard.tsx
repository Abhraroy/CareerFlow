import React, { useId } from 'react'
import { FiBriefcase, FiCheckCircle, FiMapPin, FiTrendingUp } from '../../icons'
import { useAppStore } from '../../../lib/zustandStore'

export function TargetJobCard(): React.JSX.Element {
  const gradientId = useId()
  const {
    llmResult,
    postTailorLlmResult,
    currentJob,
    scrapedJob,
    tailoringStatus
  } = useAppStore()

  // Extract job details safely
  const jobTitle =
    llmResult?.executiveSummary?.jobTitle ||
    currentJob?.title ||
    scrapedJob?.jobTitle ||
    'Frontend Software Engineer'

  const company =
    llmResult?.executiveSummary?.company ||
    currentJob?.company ||
    scrapedJob?.company ||
    'Hadwin'

  const location =
    (currentJob as any)?.location ||
    (scrapedJob as any)?.location ||
    'Remote'

  // Score computation
  const baseScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        llmResult?.fitScore ||
          llmResult?.executiveSummary?.currentFitScore ||
          68
      )
    )
  )

  const isTailored =
    tailoringStatus === 'completed' || Boolean(postTailorLlmResult)

  const potentialScore = Math.max(
    baseScore,
    Math.min(
      100,
      Math.round(
        llmResult?.executiveSummary?.potentialFitScore ||
          Math.min(96, Math.max(85, baseScore + 18))
      )
    )
  )

  const tailoredScore = postTailorLlmResult?.fitScore
    ? Math.max(0, Math.min(100, Math.round(postTailorLlmResult.fitScore)))
    : potentialScore

  const displayScore = isTailored ? tailoredScore : baseScore
  const improvement = (isTailored ? tailoredScore : potentialScore) - baseScore

  // Semicircle geometry calculations (180-degree arch)
  const size = 210
  const strokeWidth = 9
  const radius = (size - strokeWidth * 2) / 2
  const height = radius + strokeWidth + 6
  const cx = size / 2
  const cy = radius + strokeWidth

  // Semicircle arc length = PI * r
  const arcLength = Math.PI * radius

  // Arc path: starts left (cx - radius, cy) -> arches up -> ends right (cx + radius, cy)
  const pathD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`

  // Dash offsets
  const scoreOffset = arcLength * (1 - displayScore / 100)
  const potentialOffset = arcLength * (1 - potentialScore / 100)

  // Glowing tip dot coordinates at current displayScore angle
  const scoreAngleRad = Math.PI * (1 - displayScore / 100)
  const tipX = cx + radius * Math.cos(scoreAngleRad)
  const tipY = cy - radius * Math.sin(scoreAngleRad)

  return (
    <div className="bg-white dark:bg-[#0D0F0F]/90 backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-md shadow-slate-200/60 dark:shadow-none hover:border-slate-300 dark:hover:border-white/15 transition-all select-none">
      {/* Target Job Title & Metadata */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <FiBriefcase className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Target Job</span>
          </div>
          {isTailored && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
              <FiCheckCircle className="w-2.5 h-2.5" />
              Tailored Active
            </span>
          )}
        </div>

        <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate" title={jobTitle}>
          {jobTitle}
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400 font-semibold truncate">
          <span className="font-bold text-slate-800 dark:text-neutral-200">{company}</span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1">
            <FiMapPin className="w-3 h-3 text-slate-400" />
            {location}
          </span>
        </div>
      </div>

      {/* Half-Circle Match Gauge Card */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col items-center justify-center">
        {/* SVG Half-Circle Gauge */}
        <div className="relative flex flex-col items-center justify-end" style={{ width: size, height }}>
          <svg
            width={size}
            height={height}
            viewBox={`0 0 ${size} ${height}`}
            className="overflow-visible"
          >
            <defs>
              {/* Score Arc Linear Gradient */}
              <linearGradient id={`grad-score-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              {/* Potential Arc Gradient */}
              <linearGradient id={`grad-pot-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>

              {/* Ambient radial glow under the arch */}
              <radialGradient id={`glow-${gradientId}`} cx="50%" cy="100%" r="60%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </radialGradient>

              {/* Filter for neon glow effect */}
              <filter id={`neon-glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient background glow inside the arch */}
            {/* <path
              d={pathD}
              fill={`url(#glow-${gradientId})`}
              stroke="none"
            /> */}

            {/* 1. Background Arc Track */}
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-white/10"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* 2. Potential Arc Track (Extended Preview) */}
            {!isTailored && potentialScore > baseScore && (
              <path
                d={pathD}
                fill="none"
                stroke={`url(#grad-pot-${gradientId})`}
                strokeWidth={strokeWidth}
                strokeDasharray={arcLength}
                strokeDashoffset={potentialOffset}
                strokeLinecap="round"
                strokeOpacity={0.35}
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* 3. Current / Active Score Arc with Neon Glow */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#grad-score-${gradientId})`}
              strokeWidth={strokeWidth}
              strokeDasharray={arcLength}
              strokeDashoffset={scoreOffset}
              strokeLinecap="round"
              filter={`url(#neon-glow-${gradientId})`}
              className="transition-all duration-700 ease-out"
            />

            {/* 4. Glowing Tip Indicator Dot */}
            {displayScore > 3 && (
              <g className="transition-all duration-700 ease-out">
                {/* Outer Glow Halo */}
                <circle
                  cx={tipX}
                  cy={tipY}
                  r="6"
                  fill="#34D399"
                  fillOpacity="0.4"
                  className="animate-pulse"
                />
                {/* Inner Bright Indicator Dot */}
                <circle
                  cx={tipX}
                  cy={tipY}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#10B981"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>

          {/* Centered Score Label inside the arch */}
          <div className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center translate-y-1 select-none pointer-events-none">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {displayScore}%
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
              {isTailored ? 'Tailored Fit' : 'Current Fit'}
            </span>
          </div>
        </div>

        {/* Dual Metric Badges Comparison */}
        <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          {/* Current / Base Fit Badge */}
          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl p-2.5 flex flex-col gap-0.5 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              {isTailored ? 'Base Match' : 'Current Match'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {baseScore}%
              </span>
            </div>
          </div>

          {/* Potential / Tailored Fit Badge */}
          <div className="bg-emerald-50 dark:bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl p-2.5 flex flex-col gap-0.5 relative overflow-hidden shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {isTailored ? 'Tailored Match' : 'Potential Match'}
              </span>
              {improvement > 0 && (
                <span className="flex items-center text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                  <FiTrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  +{improvement}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 tracking-tight">
                {isTailored ? tailoredScore : potentialScore}%
              </span>
              {!isTailored && (
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400/80 font-bold bg-emerald-100 dark:bg-emerald-500/10 px-1 py-0.2 rounded">
                  Max Fit
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
