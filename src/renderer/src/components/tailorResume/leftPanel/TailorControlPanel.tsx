import React from 'react'
import { TargetJobCard } from './TargetJobCard'
import { BaseResumeCard } from './BaseResumeCard'
import { TailorActionButton } from './TailorActionButton'
import { AIOptimizationSummary } from './AIOptimizationSummary'

export function TailorControlPanel(): React.JSX.Element {
  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar select-none pr-0.5">
      {/* 1. Target Job Card */}
      <TargetJobCard />

      {/* 2. Base Resume Selector Card */}
      <BaseResumeCard />

      {/* 3. Primary Tailor CTA */}
      <TailorActionButton />

      {/* 4. AI Optimization Checklist */}
      <AIOptimizationSummary />
    </aside>
  )
}
