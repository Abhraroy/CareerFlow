import React, { useState, useEffect } from 'react'
import { ApplicationItem, ApplicationStage } from './types'
import { JobMatchScore } from '../jobs/JobMatchScore'
import { LuClock, LuExternalLink, LuFileText, LuMapPin, LuSave, LuStar, LuStickyNote, LuTrash2, LuX } from '../icons'
import Logger from '@utils/logger'

interface ApplicationDetailModalProps {
  application: ApplicationItem | null
  onClose: () => void
  onToggleShortlist: (id: string, current: boolean) => void
  onUpdateStage: (id: string, newStage: ApplicationStage) => void
  onUpdateNotes: (id: string, notes: string) => Promise<void>
  onDeleteApplication: (id: string) => void
}

export function ApplicationDetailModal({
  application,
  onClose,
  onToggleShortlist,
  onUpdateStage,
  onUpdateNotes,
  onDeleteApplication
}: ApplicationDetailModalProps): React.JSX.Element | null {
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (application) {
      setNotes(application.notes || '')
    }
  }, [application])

  if (!application) return null

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      await onUpdateNotes(application.id, notes)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      Logger.error('ApplicationDetailModal.tsx', 'handleSaveNotes', 'Failed to save notes', err)
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#27272A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {application.companyLogo ? (
                <img src={application.companyLogo} alt={application.company} className="w-6 h-6 object-contain" />
              ) : (
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {application.company.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">{application.jobTitle}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">{application.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleShortlist(application.id, application.shortlisted)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                application.shortlisted
                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-neutral-100 dark:bg-white/[0.04] text-neutral-400 hover:text-amber-500 border-black/5 dark:border-white/10'
              }`}
              title={application.shortlisted ? 'Shortlisted' : 'Mark as shortlisted'}
            >
              <LuStar className={`w-4 h-4 ${application.shortlisted ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Status & Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-neutral-50 dark:bg-[#27272A] p-4 rounded-xl border border-black/5 dark:border-white/10">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-bold block mb-1">Status Stage</span>
              <select
                value={application.status}
                onChange={(e) => onUpdateStage(application.id, e.target.value as ApplicationStage)}
                className="bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-white font-bold outline-none w-full cursor-pointer shadow-xs"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-bold block mb-1">Applied Date</span>
              <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold pt-1">
                <LuClock className="w-3.5 h-3.5 text-neutral-400" />
                <span>{application.appliedDate}</span>
              </div>
            </div>

            <div>
              <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-bold block mb-1">Location</span>
              <div className="flex items-center gap-1.5 text-neutral-900 dark:text-white font-semibold pt-1">
                <LuMapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate">{application.location || 'Remote'}</span>
              </div>
            </div>
          </div>

          {/* Resume & Match Score */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-[#27272A] border border-black/5 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                <LuFileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold uppercase block">Resume Submitted</span>
                <span className="font-bold text-neutral-900 dark:text-white text-xs">{application.resumeName}</span>
              </div>
            </div>

            {application.matchScore !== undefined && application.matchScore > 0 && (
              <div className="flex items-center gap-3 bg-white dark:bg-[#1E1E22] px-3.5 py-2 rounded-xl border border-black/5 dark:border-white/10 shadow-xs">
                <JobMatchScore score={application.matchScore} size={42} strokeWidth={3} showLabel={false} />
                <div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold block">Match Fit</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{application.matchScore}% Match</span>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-1">
                <LuStickyNote className="w-3.5 h-3.5 text-amber-500" />
                <span>Application Notes</span>
              </label>
              {saveSuccess && <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">Saved!</span>}
            </div>
            <textarea
              rows={4}
              placeholder="Add interview notes, recruiter contacts, follow-up dates..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none resize-none font-medium"
            />
            <div className="flex items-center justify-end">
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LuSave className="w-3.5 h-3.5" />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#27272A]">
          {application.jobLink ? (
            <a
              href={application.jobLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            >
              <LuExternalLink className="w-3.5 h-3.5" />
              <span>View Job Link</span>
            </a>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              onDeleteApplication(application.id)
              onClose()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold transition-colors cursor-pointer"
          >
            <LuTrash2 className="w-3.5 h-3.5" />
            <span>Delete Application</span>
          </button>
        </div>
      </div>
    </div>
  )
}
