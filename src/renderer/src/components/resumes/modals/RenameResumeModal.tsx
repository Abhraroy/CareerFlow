import React, { useState, useEffect } from 'react'
import { Resume } from '../../../types'
import { LuPencil, LuX } from '@/components/icons'
import Logger from '@utils/logger'

interface RenameResumeModalProps {
  isOpen: boolean
  resume: Resume | null
  onClose: () => void
  onConfirmRename: (resume: Resume, newName: string) => Promise<void>
}

export function RenameResumeModal({
  isOpen,
  resume,
  onClose,
  onConfirmRename
}: RenameResumeModalProps): React.JSX.Element | null {
  const [nameValue, setNameValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (resume) {
      setNameValue(resume.name)
    }
  }, [resume, isOpen])

  if (!isOpen || !resume) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nameValue.trim()
    if (!trimmed || trimmed === resume.name) {
      onClose()
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirmRename(resume, trimmed)
      onClose()
    } catch (err) {
      Logger.error('RenameResumeModal.tsx', 'handleSubmit', 'Failed to rename resume', err)
      alert('Error renaming resume.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#111215] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <LuPencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Rename Resume</h2>
              <p className="text-[11px] text-neutral-400">Update resume display name</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-300">
              Resume Name
            </label>
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nameValue.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
