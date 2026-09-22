import React, { useState, useRef } from 'react'
import { Resume } from '../../../types'
import { ResumeWorkspaceToolbar } from './ResumeWorkspaceToolbar'
import { ResumeCanvasToolbar } from './ResumeCanvasToolbar'
import { ResumeDocumentCanvas } from './ResumeDocumentCanvas'
import { ResumeEditDrawer } from './ResumeEditDrawer'
import { ResumeCompareModal } from './ResumeCompareModal'
import Logger from '@utils/logger'

interface ResumeWorkspaceProps {
  resume: Resume
  parentResume?: Resume
  onBack: () => void
  onRename: (resume: Resume) => void
  onDelete: (resume: Resume) => void
  onSaveDetails: (resume: Resume) => Promise<void>
}

export function ResumeWorkspace({
  resume,
  parentResume,
  onBack,
  onRename,
  onDelete,
  onSaveDetails
}: ResumeWorkspaceProps): React.JSX.Element {
  const [zoomScale, setZoomScale] = useState(1.0)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const isBase = !resume.parentResumeId

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(1.5, Math.round((prev + 0.1) * 10) / 10))
  }

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))
  }

  const handleResetZoom = () => {
    setZoomScale(1.0)
  }

  const handleFitWidth = () => {
    setZoomScale(0.9)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyAll = async () => {
    const textToCopy =
      resume.rawResumeData ||
      resume.uploadedData ||
      `${resume.name}\n${resume.profileDetails?.firstName || ''} ${resume.profileDetails?.lastName || ''}\n${resume.profileDetails?.email || ''}`
    try {
      await navigator.clipboard.writeText(textToCopy)
      alert('Resume text copied to clipboard!')
    } catch (err) {
      Logger.error('ResumeWorkspace.tsx', 'handleCopyAll', 'Failed to copy resume text', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden relative select-none transition-colors duration-200">
      {/* Top Workspace Toolbar */}
      <ResumeWorkspaceToolbar
        resume={resume}
        parentResume={parentResume}
        isBase={isBase}
        onBack={onBack}
        onEdit={() => setIsEditDrawerOpen(true)}
        onCompare={() => setIsCompareModalOpen(true)}
        onPrint={handlePrint}
        onRename={() => onRename(resume)}
        onDelete={() => onDelete(resume)}
      />

      {/* Main Canvas Workspace with Floating Zoom Controls */}
      <div className="flex-1 min-h-0 w-full relative flex flex-col items-center overflow-auto bg-neutral-100 dark:bg-[#0d0e11] dark:[background-image:radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Floating Top Canvas Toolbar */}
        <div className="sticky top-4 z-20 mb-2">
          <ResumeCanvasToolbar
            currentPage={1}
            totalPages={1}
            zoomPercent={Math.round(zoomScale * 100)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetZoom={handleResetZoom}
            onFitWidth={handleFitWidth}
            onPrint={handlePrint}
            onCopyAll={handleCopyAll}
          />
        </div>

        {/* Realistic White Paper Document */}
        <ResumeDocumentCanvas
          resume={resume}
          zoomScale={zoomScale}
          printRef={printRef}
        />
      </div>

      {/* Edit Drawer */}
      <ResumeEditDrawer
        isOpen={isEditDrawerOpen}
        resume={resume}
        onClose={() => setIsEditDrawerOpen(false)}
        onSave={onSaveDetails}
      />

      {/* Side-by-side Compare Modal */}
      <ResumeCompareModal
        isOpen={isCompareModalOpen}
        tailoredResume={resume}
        baseResume={parentResume}
        onClose={() => setIsCompareModalOpen(false)}
      />
    </div>
  )
}
