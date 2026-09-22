import React from 'react'
import { JobMatchDetailViewProps } from './detail/types'
import { useJobMatchDetail } from './detail/useJobMatchDetail'
import { JobMatchDetailHeader } from './detail/JobMatchDetailHeader'
import { JobFitScoreGauge } from './detail/JobFitScoreGauge'
import { JobAnalysisRationale } from './detail/JobAnalysisRationale'
import { JobCategoryAlignment } from './detail/JobCategoryAlignment'
import { JobInlineTailoringCard } from './detail/JobInlineTailoringCard'
import { JobSavedTailoredVersions } from './detail/JobSavedTailoredVersions'
import { JobDetailTabsNav } from './detail/JobDetailTabsNav'
import { JobOverviewTab } from './detail/JobOverviewTab'
import { JobRequirementsTab } from './detail/JobRequirementsTab'
import { JobGapsTab } from './detail/JobGapsTab'
import { JobAtsTab } from './detail/JobAtsTab'
import { JobImprovementsTab } from './detail/JobImprovementsTab'
import { JobCoverLetterTab } from './detail/JobCoverLetterTab'
import { JobDescriptionTab } from './detail/JobDescriptionTab'

/**
 * Main JobMatchDetailView component.
 * Displays comprehensive match analysis, AI tailoring tools, and requirements breakdowns.
 */
export function JobMatchDetailView(props: JobMatchDetailViewProps): React.JSX.Element {
  const { match, resumes, onSelectTab } = props

  const {
    llmAnalysis,
    activeTab,
    setActiveTab,
    copiedCoverLetter,
    copiedDescription,
    copiedReport,
    tailoringFlow,
    contextQuestions,
    contextAnswers,
    setContextAnswers,
    tailoring,
    tailoredResult,
    tailoringStages,
    comparisonMatch,
    legacyRequirements,
    currentFitScore,
    potentialFitScore,
    coverLetter,
    verdictDecision,
    rationale,
    legacyResumeImprovements,
    warnings,
    handleTailorResume,
    handleStartTailoring,
    handleCopyCoverLetter,
    handleCopyDescription,
    handleCopyReport,
    handleNavigateToTailorResume,
    clearComparison
  } = useJobMatchDetail(props)

  const requirementsCount = llmAnalysis
    ? llmAnalysis.strongMatches?.length || 0
    : legacyRequirements.length

  return (
    <div className="flex-1 bg-[var(--bg-app)] text-[var(--text-main)] p-6 lg:p-8 overflow-y-auto flex flex-col gap-6 h-full transition-colors duration-200">
      {/* Sticky Header with Navigation and Main Actions */}
      <JobMatchDetailHeader
        company={match.jobs?.company_name || match.jobs?.company || 'Unknown Company'}
        title={match.jobs?.job_title || match.jobs?.title || ''}
        hasLlmAnalysis={Boolean(llmAnalysis)}
        tailoringFlow={tailoringFlow}
        tailoring={tailoring}
        tailoredResult={tailoredResult}
        jobUrl={match.jobs?.job_link || match.jobs?.parsed_data?.url}
        copiedReport={copiedReport}
        onNavigateToTailorResume={handleNavigateToTailorResume}
        onCopyReport={handleCopyReport}
      />

      {/* Main Grid: Left Column (Metrics & Tailoring) + Right Column (Tabs & Analysis) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left Column: Scores & Tailoring Pipeline */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          <JobFitScoreGauge
            currentFitScore={currentFitScore}
            potentialFitScore={potentialFitScore}
            verdictDecision={verdictDecision}
          />

          <JobAnalysisRationale rationale={rationale} />

          <JobCategoryAlignment
            skillScore={match.skill_score || 0}
            experienceScore={match.experience_score || 0}
            semanticScore={match.semantic_score || 0}
          />

          <JobInlineTailoringCard
            tailoringFlow={tailoringFlow}
            tailoring={tailoring}
            tailoredResult={tailoredResult}
            tailoringStages={tailoringStages}
            comparisonMatch={comparisonMatch}
            contextQuestions={contextQuestions}
            contextAnswers={contextAnswers}
            setContextAnswers={setContextAnswers}
            onStartTailoring={handleStartTailoring}
            onTailorResume={handleTailorResume}
            onClearComparison={clearComparison}
          />

          <JobSavedTailoredVersions
            resumes={resumes}
            parentResumeId={match.resume_id}
            targetJobId={match.job_id}
            onSelectTab={onSelectTab}
          />
        </div>

        {/* Right Column: Tabs & LLM Analysis Sections */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[600px] shadow-lg shadow-slate-200/50 dark:shadow-none transition-colors duration-200">
          <JobDetailTabsNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            requirementsCount={requirementsCount}
            hasCoverLetter={Boolean(coverLetter)}
          />

          {/* Active Tab Content Area */}
          <div className="flex-1 mt-2 overflow-y-auto pr-1 flex flex-col gap-4">
            {activeTab === 'overview' && (
              <JobOverviewTab
                llmAnalysis={llmAnalysis}
                verdictDecision={verdictDecision}
                rationale={rationale}
              />
            )}

            {activeTab === 'requirements' && (
              <JobRequirementsTab
                llmAnalysis={llmAnalysis}
                legacyRequirements={legacyRequirements}
                warnings={warnings}
              />
            )}

            {activeTab === 'gaps' && (
              <JobGapsTab
                llmAnalysis={llmAnalysis}
                skillScore={match.skill_score || 0}
                experienceScore={match.experience_score || 0}
                semanticScore={match.semantic_score || 0}
              />
            )}

            {activeTab === 'ats' && <JobAtsTab llmAnalysis={llmAnalysis} />}

            {activeTab === 'improvements' && (
              <JobImprovementsTab
                llmAnalysis={llmAnalysis}
                legacyResumeImprovements={legacyResumeImprovements}
              />
            )}

            {activeTab === 'coverletter' && (
              <JobCoverLetterTab
                coverLetter={coverLetter}
                copiedCoverLetter={copiedCoverLetter}
                onCopyCoverLetter={handleCopyCoverLetter}
              />
            )}

            {activeTab === 'description' && (
              <JobDescriptionTab
                description={match.jobs?.job_description || match.jobs?.description || ''}
                copiedDescription={copiedDescription}
                onCopyDescription={handleCopyDescription}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default JobMatchDetailView
