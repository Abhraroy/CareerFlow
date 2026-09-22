import React from 'react'
import { LuArrowLeft } from '@/components/icons'
import { useNavigation } from '../navigation/useNavigation'

export interface BackButtonProps {
  /** Optional custom click handler to override default navigation back behavior */
  onClick?: () => void
  /** Optional tooltip text, defaults to 'Back to previous page' */
  title?: string
  /** Optional text label next to the icon */
  label?: string
  /** Optional custom CSS classes for the button */
  className?: string
  /** Optional custom icon size, default is 'w-4 h-4' */
  iconClassName?: string
  /** Whether the button is disabled */
  disabled?: boolean
}

/**
 * Modern Back Button component designed for consistent, premium navigation across all screens.
 * Uses a sleek dark glassmorphism aesthetic with subtle micro-animations on hover and active click.
 */
export function BackButton({
  onClick,
  title = 'Back to previous page',
  label,
  className = '',
  iconClassName = 'w-4 h-4',
  disabled = false
}: BackButtonProps): React.JSX.Element {
  const { goBack, canGoBack, goToJobs } = useNavigation()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation()
    if (disabled) return

    if (onClick) {
      onClick()
    } else if (canGoBack) {
      goBack()
    } else {
      goToJobs()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={label || title}
      className={`group flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] text-neutral-400 hover:text-white border border-white/[0.06] hover:border-white/10 transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/[0.03] disabled:hover:text-neutral-400 disabled:active:scale-100 flex-shrink-0 select-none shadow-sm ${className}`}
    >
      <LuArrowLeft
        className={`${iconClassName} transition-transform duration-150 group-hover:-translate-x-0.5 group-disabled:translate-x-0`}
      />
      {label && (
        <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition-colors pr-1">
          {label}
        </span>
      )}
    </button>
  )
}
