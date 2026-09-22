import React, { useState } from 'react'
import { Resume } from '../../../types'
import { LuLoader, LuTrash2, LuTriangleAlert, LuX } from '@/components/icons'
import Logger from '@utils/logger'

interface DeleteResumeModalProps {
  isOpen: boolean
  resume: Resume | null
  childCount?: number
  onClose: () => void
  onConfirmDelete: (resume: Resume) => Promise<void>
}

export function DeleteResumeModal({
  isOpen,
  resume,
  childCount = 0,
  onClose,
  onConfirmDelete
}: DeleteResumeModalProps): React.JSX.Element | null {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen || !resume) return null

  const isBase = !resume.parentResumeId
  const hasChildren = isBase && childCount > 0

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirmDelete(resume)
      onClose()
    } catch (err) {
      Logger.error('DeleteResumeModal.tsx', 'handleConfirm', 'Failed to delete resume', err)
      alert('Error deleting resume.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#111215] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <LuTriangleAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Delete Resume</h2>
              <p className="text-[11px] text-neutral-400">Confirm permanent deletion</p>
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
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-200 leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-white">&quot;{resume.name}&quot;</span>?
          </p>

          {hasChildren && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 space-y-1">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
                <LuTriangleAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Base Resume with Tailored Children</span>
              </div>
              <p className="text-[11.5px] text-red-300/90 leading-normal">
                This will also delete or un-link its{' '}
                <span className="font-bold underline">{childCount} tailored version{childCount === 1 ? '' : 's'}</span> created from this base resume.
              </p>
            </div>
          )}

          <p className="text-[11px] text-neutral-400">
            This action cannot be undone and will remove the resume and associated analysis records from your library.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <LuLoader className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <LuTrash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
