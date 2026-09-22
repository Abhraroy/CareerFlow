import React, { useEffect } from 'react'
import { useAppStore } from '../../lib/zustandStore'
import { TailorHeader } from './header/TailorHeader'
import { TailorControlPanel } from './leftPanel/TailorControlPanel'
import { TailorResumeWorkspace } from './rightWorkspace/TailorResumeWorkspace'
import { ChangeImpactModal } from './ChangeImpactModal'

export function TailorResume(): React.JSX.Element {
  const resetTailoringState = useAppStore((s) => s.resetTailoringState)

  useEffect(() => {
    return () => {
      resetTailoringState()
    }
  }, [resetTailoringState])

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-sans select-none transition-colors duration-200">
      {/* 1. Global Page Header */}
      <TailorHeader />

      {/* 2. Main 2-Column Workspace (25% Controls / 75% Document Canvas) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 sm:p-5 overflow-hidden min-h-0">
        {/* Left Control Panel (~320-340px) */}
        <TailorControlPanel />

        {/* Right Resume Document Workspace (Dominant 75% Screen Space) */}
        <TailorResumeWorkspace />
      </div>

      {/* 3. Global Change Impact Modal overlay */}
      <ChangeImpactModal />
    </div>
  )
}
