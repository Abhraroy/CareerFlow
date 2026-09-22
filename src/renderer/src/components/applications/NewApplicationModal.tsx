import React, { useState } from 'react'
import { ApplicationStage } from './types'
import { Resume } from '../../types'
import { LuBriefcase, LuFileText, LuSend, LuStickyNote, LuX } from '../icons'
import Logger from '@utils/logger'

interface NewApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    jobTitle: string
    company: string
    jobId?: string
    resumeId?: string
    tailoredResumeId?: string
    status: ApplicationStage
    notes: string
  }) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existingJobs?: any[]
  resumes?: Resume[]
}

export function NewApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  existingJobs = [],
  resumes = []
}: NewApplicationModalProps): React.JSX.Element | null {
  const [selectedJobId, setSelectedJobId] = useState<string>('custom')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '')
  const [status, setStatus] = useState<ApplicationStage>('applied')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleJobSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedJobId(val)
    if (val !== 'custom') {
      const found = existingJobs.find((j) => j.id === val || j.job_id === val)
      if (found) {
        setJobTitle(found.job_title || found.title || found.jobs?.job_title || '')
        setCompany(found.company_name || found.company || found.jobs?.company_name || '')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() || !company.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        jobId: selectedJobId !== 'custom' ? selectedJobId : undefined,
        resumeId: selectedResumeId || undefined,
        status,
        notes: notes.trim()
      })
      onClose()
    } catch (err) {
      Logger.error('NewApplicationModal.tsx', 'handleSubmit', 'Error submitting application', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1E1E22] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-neutral-900 dark:text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-[#27272A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold shadow-xs">
              <LuSend className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Log Job Application</h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Record a new application in your tracking pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {/* Select Existing Job posting or Custom */}
          {existingJobs.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                Link Existing Job Listing
              </label>
              <select
                value={selectedJobId}
                onChange={handleJobSelectChange}
                className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="custom">Custom Application (Manual entry)</option>
                {existingJobs.map((j) => (
                  <option key={j.id || j.job_id} value={j.id || j.job_id}>
                    {j.jobs?.company || j.company || 'Company'} — {j.jobs?.title || j.title || 'Job Title'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Job Title & Company Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                Job Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <LuBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Frontend Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stripe, Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
              />
            </div>
          </div>

          {/* Resume & Stage Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                Resume Used
              </label>
              <div className="relative">
                <LuFileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-neutral-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">No Resume Linked</option>
                  {resumes.map((r) => (
                    <option key={r.id || r.name} value={r.id || r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                Initial Pipeline Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStage)}
                className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="in_progress">In Progress</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Received</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Notes textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase flex items-center gap-1">
              <LuStickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span>Notes & Follow-ups</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Applied via referral, follow up next Tuesday..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-[#27272A] border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none resize-none font-medium"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#27272A] hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !jobTitle.trim() || !company.trim()}
              className="px-5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
