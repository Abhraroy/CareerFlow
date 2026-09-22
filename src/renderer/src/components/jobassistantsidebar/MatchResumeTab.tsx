import React from 'react'
import { MatchResumeTabProps } from './types'
import { useAppStore } from '../../lib/zustandStore'
import { useNavigation } from '../../navigation/useNavigation'
import { SemicircleFitScoreGauge } from './SemicircleFitScoreGauge'
import { TopChangesList } from './TopChangesList'
import { LuCheck, LuCopy, LuEye, LuSend, LuSparkles } from '@/components/icons'

export function MatchResumeTab({
  matching,
  matchstatus,
  elapsedTime,
  handleMatchResume,
  handleCopyAllMatchData,
  copiedAllMatchData,
  onViewFullAnalysis
}: MatchResumeTabProps): React.JSX.Element {
  const { llmResult, scrapedJob, setIsOutreachModalOpen } = useAppStore()
  const { goToJobMatch, goToTailorResume } = useNavigation()

  const changesList =
    llmResult?.top5ChangesBeforeApplying || llmResult?.resumeImprovements || []

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 select-text">
      {/* Primary Action: Match Resume Button */}
      <button
        onClick={() => handleMatchResume()}
        disabled={matching}
        className={`w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
          matching ? 'opacity-55 cursor-not-allowed' : ''
        }`}
      >
        {matching ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5 text-emerald-400 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{matchstatus || 'Analyzing role...'}</span>
          </>
        ) : (
          <>
            <LuSparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Match Resume with Job</span>
          </>
        )}
      </button>

      {/* Loading Status Indicator */}
      {matching && (
        <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-3 flex items-center gap-2.5 text-xs text-neutral-300 animate-pulse">
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="font-medium text-xs leading-tight text-neutral-300">
            {matchstatus || `Time taking ${elapsedTime.toFixed(1)}s`}
          </span>
        </div>
      )}

      {/* SUCCESSFUL MATCH RESULTS DISPLAY */}
      {llmResult && (
        <div className="flex flex-col gap-4">
          {/* 1. COMPANY LOGO, NAME & JOB TITLE */}
          <div className="flex items-center gap-3 border-b border-neutral-900 pb-3.5">
            {scrapedJob?.logo ? (
              <img
                src={scrapedJob.logo}
                alt={`${scrapedJob.company || 'Company'} logo`}
                className="w-10 h-10 rounded-xl bg-neutral-900 object-contain border border-neutral-800 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 font-bold text-sm shrink-0">
                {(scrapedJob?.company || llmResult.executiveSummary?.company || '?')
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <h3
                className="text-sm font-bold text-white break-words leading-tight"
                title={scrapedJob?.company || llmResult.executiveSummary?.company || 'Company'}
              >
                {scrapedJob?.company || llmResult.executiveSummary?.company || 'Company'}
              </h3>
              <span
                className="text-xs text-neutral-400 font-medium break-words leading-tight mt-0.5"
                title={
                  scrapedJob?.jobTitle ||
                  llmResult.executiveSummary?.jobTitle ||
                  'Target Position'
                }
              >
                {scrapedJob?.jobTitle ||
                  llmResult.executiveSummary?.jobTitle ||
                  'Target Position'}
              </span>
            </div>
          </div>

          {/* 2. SEMICIRCLE FIT SCORE GAUGE */}
          <SemicircleFitScoreGauge
            score={llmResult.executiveSummary?.currentFitScore ?? llmResult.fitScore ?? 0}
            potentialScore={llmResult.executiveSummary?.potentialFitScore}
            elapsedTime={elapsedTime}
            totalTokens={llmResult.usage?.totalTokens}
          />

          {/* 3. TOP 5 CHANGES BEFORE APPLYING (Show top 3 with View More trigger) */}
          <TopChangesList
            changes={changesList}
            onViewFullAnalysis={() => {
              const company = llmResult?.executiveSummary?.company || 'Analysis'
              goToJobMatch(company)
              onViewFullAnalysis?.()
            }}
          />

          {/* 4. MAKE MOVE BUTTON (Triggers global Outreach Modal state) */}
          <button
            type="button"
            onClick={() => setIsOutreachModalOpen(true)}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99] select-none"
          >
            <LuSend className="w-3.5 h-3.5" />
            <span>Make Move</span>
          </button>

          {/* 5. TAILOR RESUME BUTTON */}
          <button
            type="button"
            onClick={() => goToTailorResume()}
            className="w-full py-2.5 px-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm select-none"
          >
            <LuSparkles className="w-3.5 h-3.5 text-neutral-900" />
            <span>Tailor Resume</span>
          </button>

          {/* Secondary Actions: View Full Analysis & Copy Report */}
          <div className="flex flex-col gap-2 pt-1 border-t border-neutral-900/80">
            <button
              onClick={() => {
                const company = llmResult?.executiveSummary?.company || 'Analysis'
                goToJobMatch(company)
                onViewFullAnalysis?.()
              }}
              className="w-full py-2 px-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-300 font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LuEye className="w-3.5 h-3.5 text-neutral-400" />
              <span>View full analysis breakdown</span>
            </button>

            <button
              onClick={handleCopyAllMatchData}
              className="w-full py-1.5 text-xs text-neutral-400 hover:text-white font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer select-none"
            >
              {copiedAllMatchData ? (
                <>
                  <LuCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Full Report Copied</span>
                </>
              ) : (
                <>
                  <LuCopy className="w-3 h-3 text-neutral-500" />
                  <span>Copy Full Analysis →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* INITIAL / EMPTY STATE */}
      {!llmResult && !matching && (
        <div className="flex flex-col gap-2 text-center py-8 px-3 text-neutral-400 bg-neutral-950/40 rounded-2xl border border-neutral-900/50">
          <LuSparkles className="w-6 h-6 text-neutral-600 mx-auto" />
          <p className="text-xs leading-relaxed text-neutral-400">
            Select a resume and click{' '}
            <strong className="text-white font-semibold">Match Resume with Job</strong> to evaluate match fit score and receive instant tailored recommendations.
          </p>
        </div>
      )}
    </div>
  )
}
