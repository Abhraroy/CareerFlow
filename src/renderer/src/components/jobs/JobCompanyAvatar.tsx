import React, { useState } from 'react'

interface JobCompanyAvatarProps {
  company: string
  logoUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function JobCompanyAvatar({
  company,
  logoUrl,
  size = 'md'
}: JobCompanyAvatarProps): React.JSX.Element {
  const [imageError, setImageError] = useState(false)

  // Generate 1-2 letter uppercase initials
  const initials = React.useMemo(() => {
    if (!company) return 'CO'
    const words = company.trim().split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return company.slice(0, 2).toUpperCase()
  }, [company])

  // Deterministic subtle brand tint based on company string
  const brandTint = React.useMemo(() => {
    const c = (company || '').toLowerCase()
    if (c.includes('google')) return 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
    if (c.includes('microsoft')) return 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/20'
    if (c.includes('amazon')) return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20'
    if (c.includes('apple')) return 'border-neutral-400/30 text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/30'
    if (c.includes('meta')) return 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20'
    if (c.includes('netflix')) return 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20'
    if (c.includes('stripe')) return 'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20'
    if (c.includes('figma')) return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
    return 'border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-[#27272A]'
  }, [company])

  const sizeClasses = {
    sm: 'w-8 h-8 text-[11px] rounded-lg',
    md: 'w-10 h-10 text-[13px] rounded-xl',
    lg: 'w-12 h-12 text-[15px] rounded-xl'
  }[size]

  return (
    <div
      className={`shrink-0 ${sizeClasses} flex items-center justify-center font-bold tracking-wider overflow-hidden border shadow-xs ${brandTint} select-none`}
    >
      {logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt={`${company} logo`}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain p-1"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
