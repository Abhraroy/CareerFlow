import React, { useState } from 'react'
import { ApplicationItem, ApplicationStage } from './types'
import { LuChevronDown, LuClock, LuExternalLink, LuFileText, LuMapPin, LuStar, LuStickyNote } from '../icons'

interface ApplicationCardProps {
  application: ApplicationItem
  onToggleShortlist: (id: string, current: boolean) => void
  onUpdateStage: (id: string, newStage: ApplicationStage) => void
  onSelectApplication: (application: ApplicationItem) => void
}

const STAGE_CONFIG: Record<ApplicationStage, { label: string; bg: string; text: string; border: string }> = {
  in_progress: { label: 'In Progress', bg: 'bg-indigo-100 dark:bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500/20' },
  applied: { label: 'Applied', bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
  interviewing: { label: 'Interviewing', bg: 'bg-purple-100 dark:bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20' },
  offer: { label: 'Offer', bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' },
  rejected: { label: 'Rejected', bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/20' }
}

export function ApplicationCard({
  application,
  onToggleShortlist,
  onUpdateStage,
  onSelectApplication
}: ApplicationCardProps): React.JSX.Element {
  const [logoFailed, setLogoFailed] = useState(false)
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false)

  const stageStyle = STAGE_CONFIG[application.status] || STAGE_CONFIG.applied

  return (
    <div className="group relative bg-white dark:bg-[#212124] hover:bg-slate-50 dark:hover:bg-[#27272A] border border-slate-200 dark:border-white/10 rounded-2xl p-4 transition-all duration-200 shadow-md shadow-slate-200/50 dark:shadow-none flex flex-col gap-3 select-none">
      {/* Top Header: Company Avatar + Shortlist Star + Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            {application.companyLogo && !logoFailed ? (
              <img
                src={application.companyLogo}
                alt={application.company}
                className="w-6 h-6 object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                {application.company ? application.company.charAt(0).toUpperCase() : 'J'}
              </span>
            )}
          </div>

          {/* Company & Location */}
          <div className="min-w-0 flex-1">
            <h4
              onClick={() => onSelectApplication(application)}
              className="text-sm font-bold text-neutral-900 dark:text-white truncate cursor-pointer hover:underline transition-colors"
              title={application.jobTitle}
            >
              {application.jobTitle}
            </h4>
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{application.company}</span>
              {application.location && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="truncate flex items-center gap-1">
                    <LuMapPin className="w-3 h-3 text-neutral-400" />
                    {application.location}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Shortlist Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleShortlist(application.id, application.shortlisted)
          }}
          className={`p-2 rounded-xl transition-all duration-200 border cursor-pointer ${
            application.shortlisted
              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
              : 'bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 hover:text-amber-500 border-black/5 dark:border-white/10'
          }`}
          title={application.shortlisted ? 'Shortlisted' : 'Mark as shortlisted'}
        >
          <LuStar
            className={`w-4 h-4 ${application.shortlisted ? 'fill-amber-400 text-amber-500' : ''}`}
          />
        </button>
      </div>

      {/* Meta Row: Resume name + Match score */}
      <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-black/5 dark:border-white/5">
        {/* Resume Tag */}
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-xl border border-black/5 dark:border-white/10 truncate max-w-[65%] font-medium">
          <LuFileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate">{application.resumeName}</span>
        </div>

        {/* Match Score Pill */}
        {application.matchScore !== undefined && application.matchScore > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20 shrink-0">
            <span>{application.matchScore}% match</span>
          </div>
        )}
      </div>

      {/* Notes snippet preview if present */}
      {application.notes && (
        <div
          onClick={() => onSelectApplication(application)}
          className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-black/40 p-2.5 rounded-xl border border-black/5 dark:border-white/5 flex items-start gap-2 cursor-pointer hover:border-black/10 dark:hover:border-white/10 transition-colors"
        >
          <LuStickyNote className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed text-[11.5px] font-medium">{application.notes}</p>
        </div>
      )}

      {/* Bottom Row: Stage Dropdown Pill & Date / Direct link */}
      <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs">
        {/* Stage Selector Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsStageMenuOpen(!isStageMenuOpen)
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
          >
            <span>{stageStyle.label}</span>
            <LuChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {isStageMenuOpen && (
            <div
              className="absolute left-0 bottom-full mb-1.5 w-36 bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl py-1 z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(['applied', 'shortlisted', 'interviewing', 'offer', 'rejected'] as ApplicationStage[]).map(
                (stg) => {
                  const cfg = STAGE_CONFIG[stg]
                  return (
                    <button
                      key={stg}
                      onClick={() => {
                        onUpdateStage(application.id, stg)
                        setIsStageMenuOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer ${
                        application.status === stg ? 'bg-neutral-100 dark:bg-white/[0.08] font-bold' : ''
                      }`}
                    >
                      <span className={cfg.text}>{cfg.label}</span>
                    </button>
                  )
                }
              )}
            </div>
          )}
        </div>

        {/* Date & Direct Link */}
        <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 font-medium">
          <span className="flex items-center gap-1">
            <LuClock className="w-3 h-3 text-neutral-400" />
            {application.appliedDate}
          </span>
          {application.jobLink && (
            <a
              href={application.jobLink}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Open job posting"
            >
              <LuExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
