import React, { useId } from 'react'

export interface JobMatchScoreProps {
  score: number
  potentialScore?: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export function JobMatchScore({
  score,
  potentialScore,
  size = 64,
  strokeWidth = 4,
  showLabel = true,
  className = ''
}: JobMatchScoreProps): React.JSX.Element {
  const gradientId = useId()

  // Clamp scores between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score || 0)))
  const normalizedPotential =
    potentialScore !== undefined
      ? Math.max(normalizedScore, Math.min(100, Math.round(potentialScore)))
      : undefined

  const hasPotential = normalizedPotential !== undefined && normalizedPotential > normalizedScore

  // Semicircle geometry calculations (top half arch)
  const width = size
  const radius = (size - strokeWidth * 2) / 2
  const height = radius + strokeWidth + 3
  const cx = size / 2
  const cy = radius + strokeWidth

  // Semicircle arc length = PI * r
  const arcLength = Math.PI * radius

  // Arc path: starts at left (cx - radius, cy), arches up to top, ends at right (cx + radius, cy)
  const pathD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`

  // Dash offsets for current and potential progress
  const scoreOffset = arcLength * (1 - normalizedScore / 100)
  const potentialOffset = hasPotential ? arcLength * (1 - normalizedPotential / 100) : arcLength

  // Color config based on score bracket
  const getColorScheme = (val: number) => {
    if (val >= 80) {
      return {
        start: '#84CC16',
        end: '#A7C957',
        text: 'text-[#A7C957]',
        badgeBg: 'bg-[#A7C957]/10',
        badgeBorder: 'border-[#A7C957]/20',
        badgeText: 'text-[#A7C957]'
      }
    }
    if (val >= 60) {
      return {
        start: '#06B6D4',
        end: '#38BDF8',
        text: 'text-[#38BDF8]',
        badgeBg: 'bg-[#38BDF8]/10',
        badgeBorder: 'border-[#38BDF8]/20',
        badgeText: 'text-[#38BDF8]'
      }
    }
    if (val >= 45) {
      return {
        start: '#F59E0B',
        end: '#FBBF24',
        text: 'text-[#FBBF24]',
        badgeBg: 'bg-[#FBBF24]/10',
        badgeBorder: 'border-[#FBBF24]/20',
        badgeText: 'text-[#FBBF24]'
      }
    }
    return {
      start: '#EF4444',
      end: '#F87171',
      text: 'text-[#F87171]',
      badgeBg: 'bg-[#F87171]/10',
      badgeBorder: 'border-[#F87171]/20',
      badgeText: 'text-[#F87171]'
    }
  }

  const scheme = getColorScheme(normalizedScore)
  const potScheme = hasPotential ? getColorScheme(normalizedPotential) : scheme

  return (
    <div
      className={`flex gap-2 flex-col items-center justify-center select-none ${className}`}
      title={
        hasPotential
          ? `Current Fit: ${normalizedScore}% • Potential: ${normalizedPotential}%`
          : `Match Score: ${normalizedScore}%`
      }
    >
      {/* Half-circle SVG Gauge */}
      <div className="relative flex flex-col items-center justify-end" style={{ width, height }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {/* Score Gradient */}
            <linearGradient id={`grad-score-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={scheme.start} />
              <stop offset="100%" stopColor={scheme.end} />
            </linearGradient>

            {/* Potential Gradient */}
            {hasPotential && (
              <linearGradient id={`grad-pot-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={potScheme.start} />
                <stop offset="100%" stopColor={potScheme.end} />
              </linearGradient>
            )}
          </defs>

          {/* 1. Background Arc Track */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            className="text-neutral-200 dark:text-white/10"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* 2. Potential Arc Track (semi-transparent extension) */}
          {hasPotential && (
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

          {/* 3. Current Fit Score Arc */}
          <path
            d={pathD}
            fill="none"
            stroke={`url(#grad-score-${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={scoreOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Score Number (positioned right above the baseline) */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-center translate-y-0.5">
          <span className="text-[16px] font-extrabold text-neutral-900 dark:text-white tracking-tight leading-none">
            {normalizedScore}%
          </span>
        </div>
      </div>

      {/* Subtitle / Potential Indicator */}
      {showLabel && (
        <div className="mt-1 flex items-center justify-center">
          {hasPotential ? (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[13px] font-semibold border ${potScheme.badgeBg} ${potScheme.badgeBorder} ${potScheme.badgeText}`}
            >
              <span className="text-[#888E8E] font-medium text-[9px]">Pot.</span>
              <span>{normalizedPotential}%</span>
              <span className="text-[8px] opacity-80">
                (+{normalizedPotential - normalizedScore}%)
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-medium text-[#737979] tracking-wide whitespace-nowrap">
              Fit Score
            </span>
          )}
        </div>
      )}
    </div>
  )
}
