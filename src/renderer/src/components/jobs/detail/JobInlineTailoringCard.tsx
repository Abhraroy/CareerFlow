import React from 'react'
import { TailoringFlowState, TailoringStageInfo, ComparisonMatch } from './types'
import { TailoringResult, TailoringQuestion, UserContextAnswer } from '@/utils/tailorEngine'

interface JobInlineTailoringCardProps {
  tailoringFlow: TailoringFlowState
  tailoring: boolean
  tailoredResult: TailoringResult | null
  tailoringStages: Record<string, TailoringStageInfo>
  comparisonMatch: ComparisonMatch | null
  contextQuestions: TailoringQuestion[]
  contextAnswers: Record<string, string>
  setContextAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  onStartTailoring: () => void
  onTailorResume: (answers?: UserContextAnswer[]) => void
  onClearComparison: () => void
}

/**
 * Direct AI Resume Tailoring card with interactive question flows (HITL),
 * stage execution tracking, and before/after match score comparison.
 */
export function JobInlineTailoringCard({
  tailoringFlow,
  tailoring,
  tailoredResult,
  tailoringStages,
  comparisonMatch,
  contextQuestions,
  contextAnswers,
  setContextAnswers,
  onStartTailoring,
  onTailorResume,
  onClearComparison
}: JobInlineTailoringCardProps): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-[#212124] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col gap-3.5 shadow-md shadow-slate-200/50 dark:shadow-none transition-colors duration-200">
      <h3 className="text-xs font-black text-slate-800 dark:text-neutral-300 uppercase tracking-wider border-b border-slate-100 dark:border-white/10 pb-2.5">
        AI Resume Tailoring
      </h3>

      {tailoringFlow === 'idle' && !tailoredResult && (
        <button
          onClick={onStartTailoring}
          className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <svg
            className="w-3.5 h-3.5 text-neutral-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 21l8.982-8.983m-1.785-1.785L19.5 7.5l-3-3M6.31 16.484c-1.464 1.464-3.528 2.249-4.81 2.249 0 0 .785-3.346 2.249-4.81m1.11 1.11L15.353 4.5l3.147 3.146L6.31 16.484z"
            />
          </svg>
          Tailor Resume for Role
        </button>
      )}

      {tailoringFlow === 'generating_questions' && (
        <div className="flex flex-col items-center gap-2 py-2">
          <svg
            className="animate-spin h-4 w-4 text-neutral-400"
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
          <span className="text-[11px] text-neutral-400">
            Analyzing resume for context questions…
          </span>
        </div>
      )}

      {tailoringFlow === 'awaiting_user_input' && contextQuestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
            🧠 Help the AI understand your background
          </div>
          {contextQuestions.map((q) => (
            <div key={q.id} className="flex flex-col gap-1.5">
              <label className="text-[11px] text-neutral-200 font-medium leading-snug">
                {q.question}
              </label>
              <p className="text-[10px] text-neutral-500 italic leading-relaxed">
                {q.hint}
              </p>
              {q.inputType === 'yesno' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setContextAnswers((prev) => ({ ...prev, [q.id]: 'Yes' }))}
                    className={`flex-1 py-1.5 border rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                      contextAnswers[q.id] === 'Yes'
                        ? 'bg-white/10 border-neutral-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setContextAnswers((prev) => ({ ...prev, [q.id]: 'No' }))}
                    className={`flex-1 py-1.5 border rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                      contextAnswers[q.id] === 'No'
                        ? 'bg-white/10 border-neutral-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              ) : (
                <textarea
                  value={contextAnswers[q.id] || ''}
                  onChange={(e) =>
                    setContextAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="Type your answer…"
                  rows={2}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[11px] text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                const answers = contextQuestions.map((q) => ({
                  question: q.question,
                  hint: q.hint,
                  answer: contextAnswers[q.id] || ''
                }))
                onTailorResume(answers)
              }}
              className="flex-1 py-2 bg-white text-black rounded-lg text-[11px] font-bold cursor-pointer hover:bg-neutral-200 transition-colors"
            >
              Submit & Tailor
            </button>
            <button
              onClick={() => onTailorResume([])}
              className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
            >
              Skip & Tailor
            </button>
          </div>
        </div>
      )}

      {tailoring && (
        <div className="flex flex-col gap-2 text-[11px]">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
            Pipeline Execution
          </span>
          <div className="flex flex-col gap-1.5">
            {Object.entries(tailoringStages).map(([stage, info]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="capitalize text-neutral-400">
                  {stage === 'prioritize' && 'Prioritizing requirements'}
                  {stage === 'retrieve' && 'Retrieving evidence'}
                  {stage === 'strategy' && 'Planning changes'}
                  {stage === 'rewrite' && 'Tailoring bullet points'}
                  {stage === 'validate' && 'Validating claims'}
                  {stage === 'ats' && 'ATS quality check'}
                </span>
                <span className="flex items-center gap-1 font-bold">
                  {info.status === 'running' && (
                    <span className="flex items-center gap-1 text-neutral-300">
                      <svg
                        className="animate-spin h-2.5 w-2.5 text-neutral-400"
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
                      Active
                    </span>
                  )}
                  {info.status === 'success' && <span className="text-emerald-400">✓ Done</span>}
                  {info.status === 'pending' && <span className="text-neutral-600">Pending</span>}
                  {info.status === 'failed' && <span className="text-rose-400">✗ Failed</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tailoredResult && (
        <div className="flex flex-col gap-3 text-xs">
          {comparisonMatch && (
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                  Original
                </span>
                <span className="text-sm font-bold text-neutral-400">
                  {comparisonMatch.originalScore}%
                </span>
              </div>
              <div className="text-neutral-600 text-xs">→</div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                  Tailored Match
                </span>
                <span className="text-sm font-bold text-white">
                  {comparisonMatch.tailoredScore}%
                  <span className="text-[10px] text-emerald-400 ml-1">
                    (+{comparisonMatch.tailoredScore - comparisonMatch.originalScore})
                  </span>
                </span>
              </div>
            </div>
          )}

          {tailoredResult.changes.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">
                ✨ Tailored Changes
              </span>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {tailoredResult.changes.map((c, i) => (
                  <div key={i} className="text-[10px] text-neutral-300 leading-tight">
                    <span className="text-emerald-400 font-semibold mr-1">
                      ✓ {c.section}:
                    </span>
                    {c.detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onClearComparison}
            className="w-full py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            Clear Comparison
          </button>
        </div>
      )}
    </div>
  )
}
