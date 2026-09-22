import React from 'react'
import { FiArrowRight, FiRefreshCw, FiRotateCcw, FiTarget, FiZap } from '@/components/icons'
import { useAppStore } from '../../../lib/zustandStore'
import { useTailoring } from '../../../utils/useTailoring'
import { matchTailoredResume } from '../../../utils/matchTailoredResume'
import Logger from '@utils/logger'

function formatTailoredResumeToText(data: any): string {
  if (!data || typeof data !== 'object') return ''
  const lines: string[] = []
  if (data.name) lines.push(data.name.toUpperCase())
  if (data.title) lines.push(data.title)
  if (data.contact) lines.push(data.contact)
  lines.push('')
  if (data.summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(data.summary)
    lines.push('')
  }
  if (data.skills && Array.isArray(data.skills)) {
    lines.push('TECHNICAL SKILLS')
    data.skills.forEach((s: any) => lines.push(`• ${s.category}: ${s.items}`))
    lines.push('')
  }
  if (data.experience && Array.isArray(data.experience)) {
    lines.push('PROFESSIONAL EXPERIENCE')
    data.experience.forEach((exp: any) => {
      lines.push(`${exp.role} | ${exp.company} | ${exp.period}`)
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b: string) => lines.push(`• ${b}`))
      }
      lines.push('')
    })
  }
  if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
    lines.push('PROJECTS')
    data.projects.forEach((proj: any) => lines.push(`• ${proj.title}: ${proj.desc}`))
    lines.push('')
  }
  return lines.join('\n').trim()
}

export function TailorActionButton(): React.JSX.Element {
  const {
    tailoringStatus,
    tailoringProgress,
    postTailorLlmResult,
    isPostTailorMatching,
    postTailorMatchStatus,
    tailoredResumeText,
    tailoredResume,
    scrapedJob,
    currentJob,
    userId,
    setPostTailorLlmResult,
    setIsPostTailorMatching,
    setPostTailorMatchStatus
  } = useAppStore()

  const {
    handleUnResolvedRequirements,
    handleTailoring,
    isProcessing,
    currentStepLabel
  } = useTailoring()

  const isCompleted =
    tailoringStatus === 'completed' || Boolean(postTailorLlmResult)

  const isBusy = isProcessing || isPostTailorMatching

  // Handler for running post-tailor matching
  const handleRunMatchTailoredResume = async (): Promise<void> => {
    if (isBusy) return
    setIsPostTailorMatching(true)
    setPostTailorMatchStatus('Preparing tailored resume & job description...')
    try {
      const activeTextToAnalyze =
        tailoredResumeText ||
        (tailoredResume ? formatTailoredResumeToText(tailoredResume) : '')
      if (!activeTextToAnalyze) {
        alert('No tailored resume content found. Please tailor your resume first.')
        return
      }

      const result = await matchTailoredResume({
        tailoredResumeText: activeTextToAnalyze,
        scrapedJob,
        currentJobDescription: currentJob?.description,
        userId,
        onStatusUpdate: (status) => setPostTailorMatchStatus(status)
      })

      if (result) {
        setPostTailorLlmResult(result)
      }
    } catch (err: any) {
      Logger.error('TailorActionButton.tsx', 'handleRunMatchTailoredResume', 'Tailored match error', err)
      alert(`Match analysis failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsPostTailorMatching(false)
      setPostTailorMatchStatus('')
    }
  }

  const handleClick = (): void => {
    if (isBusy) return
    if (isCompleted) {
      handleRunMatchTailoredResume()
    } else {
      handleUnResolvedRequirements()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={isBusy}
        className={`w-full relative group overflow-hidden rounded-2xl p-4 sm:p-4.5 font-sans text-left transition-all duration-200 cursor-pointer shadow-lg select-none ${
          isBusy
            ? 'bg-neutral-900 border border-emerald-500/40 cursor-wait'
            : isCompleted
              ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black active:scale-[0.99] border border-emerald-400/30 shadow-emerald-950/40'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black active:scale-[0.99]'
        }`}
      >
        {/* Background glow & highlights */}
        {!isBusy && (
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                isBusy
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-black/20 text-black'
              }`}
            >
              {isProcessing ? (
                <FiRefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              ) : isPostTailorMatching ? (
                <FiRefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              ) : isCompleted ? (
                <FiTarget className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <FiZap className="w-5 h-5 fill-current" />
              )}
            </div>

            <div className="flex flex-col">
              <span
                className={`text-sm font-bold tracking-tight ${
                  isBusy ? 'text-white' : 'text-black'
                }`}
              >
                {isProcessing
                  ? currentStepLabel || 'Optimizing Resume...'
                  : isPostTailorMatching
                    ? postTailorMatchStatus || 'Analyzing Tailored Match...'
                    : isCompleted
                      ? postTailorLlmResult
                        ? '✦ Match Tailored Resume'
                        : '✦ Match Tailored Resume'
                      : '✦ Tailor Resume'}
              </span>
              <span
                className={`text-xs ${
                  isBusy
                    ? 'text-neutral-400'
                    : 'text-neutral-900/80 font-medium'
                }`}
              >
                {isProcessing
                  ? `${tailoringProgress}% completed`
                  : isPostTailorMatching
                    ? 'Evaluating against job requirements'
                    : isCompleted
                      ? postTailorLlmResult
                        ? `Match Score: ${postTailorLlmResult.fitScore}% • Click to re-match`
                        : 'Calculate match score & ATS fit'
                      : 'Optimize for this job'}
              </span>
            </div>
          </div>

          {!isBusy && (
            <div className="flex items-center gap-1">
              {isCompleted && postTailorLlmResult && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/20 text-black">
                  {postTailorLlmResult.fitScore}%
                </span>
              )}
              <FiArrowRight className="w-4 h-4 text-black/70 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>

        {/* Progress Bar Line when tailoring */}
        {isProcessing && (
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-emerald-400 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${tailoringProgress}%` }}
            />
          </div>
        )}

        {/* Indeterminate Progress Line when matching */}
        {isPostTailorMatching && (
          <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-cyan-400 animate-pulse transition-all duration-300 ease-out rounded-full w-full" />
          </div>
        )}
      </button>

      {/* Secondary option to re-tailor if already tailored */}
      {isCompleted && !isBusy && (
        <button
          onClick={() => handleTailoring()}
          className="w-full py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/10 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FiRotateCcw className="w-3 h-3 text-neutral-400" />
          <span>Re-tailor resume from scratch</span>
        </button>
      )}
    </div>
  )
}

