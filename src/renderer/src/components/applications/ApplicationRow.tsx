import React, { useState } from 'react'
import { ApplicationItem, ApplicationStage } from './types'
import { JobMatchScore } from '../jobs/JobMatchScore'
import { LuChevronDown, LuClock, LuExternalLink, LuFileText, LuMapPin, LuStar, LuStickyNote, LuTrash2 } from '../icons'

interface ApplicationRowProps {
  application: ApplicationItem
  onToggleShortlist: (id: string, current: boolean) => void
  onUpdateStage: (id: string, newStage: ApplicationStage) => void
  onDeleteApplication: (id: string) => void
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

export function ApplicationRow({
  application,
  onToggleShortlist,
  onUpdateStage,
  onDeleteApplication,
  onSelectApplication
}: ApplicationRowProps): React.JSX.Element {
  const [logoFailed, setLogoFailed] = useState(false)
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false)

  const stageStyle = STAGE_CONFIG[application.status] || STAGE_CONFIG.applied

  return (
    <div
      onClick={() => onSelectApplication(application)}
      className="group relative bg-white dark:bg-[#212124] hover:bg-slate-50 dark:hover:bg-[#27272A] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 transition-all duration-200 shadow-md shadow-slate-200/50 dark:shadow-none flex flex-col md:grid md:grid-cols-[36px_1fr_170px_90px_140px_90px_100px] items-center gap-4 cursor-pointer select-none"
    >
      {/* 1. Shortlist Star Column */}
      <div className="flex items-center justify-center w-[36px] shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleShortlist(application.id, application.shortlisted)
          }}
          className={`p-2 rounded-xl transition-all duration-200 border shrink-0 cursor-pointer ${
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

      {/* 2. Job & Company Info Column */}
      <div className="flex items-center gap-3 min-w-0 w-full">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          {application.companyLogo && !logoFailed ? (
            <img
              src={application.companyLogo}
              alt={application.company}
              className="w-5 h-5 object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {application.company ? application.company.charAt(0).toUpperCase() : 'J'}
            </span>
          )}
        </div>

        {/* Title, Company & Location */}
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate transition-colors">
            {application.jobTitle}
          </h4>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium min-w-0">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[140px]">
              {application.company}
            </span>
            {application.location && (
              <>
                <span className="opacity-40 shrink-0">•</span>
                <span className="truncate flex items-center gap-1 min-w-0">
                  <LuMapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{application.location}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Resume Used Column */}
      <div className="flex items-center justify-start min-w-0 w-full md:w-[170px]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/[0.04] px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/10 truncate min-w-0 w-full" title={application.resumeName}>
          <LuFileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="truncate">{application.resumeName}</span>
        </div>
      </div>

      {/* 4. Match Score Gauge Column */}
      <div className="flex items-center justify-center w-full md:w-[90px] shrink-0" onClick={(e) => e.stopPropagation()}>
        {application.matchScore !== undefined && application.matchScore > 0 ? (
          <JobMatchScore
            score={application.matchScore}
            size={48}
            strokeWidth={3.5}
            showLabel={false}
          />
        ) : (
          <div className="text-xs text-neutral-400 italic font-medium">No score</div>
        )}
      </div>

      {/* 5. Stage Selector Column */}
      <div className="relative w-full md:w-[140px] flex items-center justify-center shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsStageMenuOpen(!isStageMenuOpen)
          }}
          className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
        >
          <span className="truncate">{stageStyle.label}</span>
          <LuChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
        </button>

        {isStageMenuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl shadow-xl py-1 z-50 overflow-hidden">
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

      {/* 6. Applied Date Column */}
      <div className="flex items-center justify-center text-xs text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap w-full md:w-[90px] shrink-0">
        <span className="flex items-center gap-1">
          <LuClock className="w-3 h-3 shrink-0" />
          {application.appliedDate}
        </span>
      </div>

      {/* 7. Action Icons Column */}
      <div className="flex items-center justify-end gap-1 w-full md:w-[100px] shrink-0" onClick={(e) => e.stopPropagation()}>
        {application.notes ? (
          <span title={application.notes} className="p-1.5 text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
            <LuStickyNote className="w-4 h-4" />
          </span>
        ) : null}
        {application.jobLink ? (
          <a
            href={application.jobLink}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
            title="Open job link"
          >
            <LuExternalLink className="w-4 h-4" />
          </a>
        ) : null}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteApplication(application.id)
          }}
          className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
          title="Delete application"
        >
          <LuTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
