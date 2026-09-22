import React, { useState, useMemo, useEffect } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiPlus,
  FiRefreshCw,
  FiX,
  FiXCircle,
  FiZap
} from '@/components/icons'
import { useAppStore } from '../../lib/zustandStore'
import { useTailoring } from '../../utils/useTailoring'
import Logger from '@utils/logger'
import type { RequirementAnalysis } from '../../../../utils/zodSchema'
import { supabase } from '../../lib/supabase'
import {
  saveRequirementInteractions,
  fetchRequirementInteractions,
  type RequirementInteractionInput
} from '../../supabase_utils/requirementInteractions'

export function RequirementResolutionForm(): React.JSX.Element {
  const {
    llmResult,
    setTailoringStatus,
    setResolvedRequirementsData,
    resolutionQuestions,
    isGeneratingQuestions,
    currentLlmAnalysisId,
    userId
  } = useAppStore()

  const {
    handleUnResolvedRequirements,
    handleTailoring,
    isProcessing,
    apiKeyError,
    clearApiKeyError
  } = useTailoring()

  // Track active question index for single-card view
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0)

  // Trigger question generation on mount if not yet generated
  useEffect(() => {
    const { resolutionQuestions, isGeneratingQuestions } = useAppStore.getState()
    if (resolutionQuestions.length === 0 && !isGeneratingQuestions) {
      handleUnResolvedRequirements()
    }
  }, [])

  // Extract all requirements from llmResult
  const requirements: RequirementAnalysis[] = useMemo(() => {
    if (llmResult?.requirements && Array.isArray(llmResult.requirements)) {
      return llmResult.requirements
    }
    if ((llmResult as any)?.llmAnalysis?.requirements && Array.isArray((llmResult as any).llmAnalysis.requirements)) {
      return (llmResult as any).llmAnalysis.requirements
    }
    return []
  }, [llmResult])

  // Track answers for generated questions: { [requirement]: { hasExperience: boolean, userEvidence: string } }
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, { hasExperience: boolean; userEvidence: string }>
  >({})

  // Custom user-added requirements
  const [customReqText, setCustomReqText] = useState('')
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [customEntries, setCustomEntries] = useState<{ id: string; requirement: string; evidence: string }[]>([])

  // Initialize or synchronize question answers when resolutionQuestions change
  useEffect(() => {
    if (resolutionQuestions.length > 0) {
      setQuestionAnswers((prev) => {
        const next = { ...prev }
        resolutionQuestions.forEach((q) => {
          if (!next[q.requirement]) {
            next[q.requirement] = {
              hasExperience: true,
              userEvidence: ''
            }
          }
        })
        return next
      })
    }
  }, [resolutionQuestions])

  // Clamp currentCardIndex if resolutionQuestions change
  useEffect(() => {
    if (resolutionQuestions.length > 0 && currentCardIndex >= resolutionQuestions.length) {
      setCurrentCardIndex(Math.max(0, resolutionQuestions.length - 1))
    }
  }, [resolutionQuestions, currentCardIndex])

  // Fetch previously saved requirement interactions from Supabase
  useEffect(() => {
    if (!currentLlmAnalysisId || !supabase) return
    let cancelled = false

    fetchRequirementInteractions(supabase, currentLlmAnalysisId)
      .then((savedInteractions) => {
        if (cancelled || savedInteractions.length === 0) return

        setQuestionAnswers((prev) => {
          const next = { ...prev }
          savedInteractions.forEach((row) => {
            next[row.requirement] = {
              hasExperience: row.has_experience,
              userEvidence: row.user_evidence || ''
            }
          })
          return next
        })
      })
      .catch((err) => Logger.error('RequirementResolutionForm.tsx', 'useEffect', 'Failed to fetch saved interactions', err))

    return () => {
      cancelled = true
    }
  }, [currentLlmAnalysisId])

  const handleToggleQuestionExperience = (requirement: string, value: boolean): void => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [requirement]: {
        hasExperience: value,
        userEvidence: prev[requirement]?.userEvidence || ''
      }
    }))
  }

  const handleQuestionEvidenceChange = (requirement: string, text: string): void => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [requirement]: {
        hasExperience: prev[requirement]?.hasExperience ?? true,
        userEvidence: text
      }
    }))
  }

  const handleAddCustomRequirement = (): void => {
    if (!customReqText.trim()) return
    const newEntry = {
      id: `custom-${Date.now()}`,
      requirement: customReqText.trim(),
      evidence: ''
    }
    setCustomEntries((prev) => [...prev, newEntry])
    setCustomReqText('')
    setIsAddingCustom(false)
  }

  const handleCustomEvidenceChange = (id: string, text: string): void => {
    setCustomEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, evidence: text } : item))
    )
  }

  // Handle form submission and start tailoring
  const handleSubmit = async (skipResolution = false): Promise<void> => {
    if (skipResolution) {
      setResolvedRequirementsData(null)
      setTailoringStatus('analyzing')
      await handleTailoring(undefined, true)
      return
    }

    const context: Record<string, string> = {}

    // Add answers from generated questions
    resolutionQuestions.forEach((q) => {
      const entry = questionAnswers[q.requirement]
      if (entry?.hasExperience && entry.userEvidence.trim()) {
        context[q.requirement] = entry.userEvidence.trim()
      }
    })

    // Add custom requirements
    customEntries.forEach((c) => {
      if (c.evidence.trim()) {
        context[c.requirement] = c.evidence.trim()
      }
    })

    // Persist interactions to Supabase
    if (supabase && currentLlmAnalysisId && userId) {
      try {
        const interactions: RequirementInteractionInput[] = []

        resolutionQuestions.forEach((q) => {
          const entry = questionAnswers[q.requirement]
          if (entry) {
            const matchingReq = requirements.find((r) => r.requirement === q.requirement)
            interactions.push({
              requirement_id: matchingReq?.id || q.requirement,
              requirement: q.requirement,
              has_experience: entry.hasExperience,
              user_evidence: entry.userEvidence.trim() || null,
              question: q.question || null,
              hint: q.followUp || null,
              answer: entry.hasExperience
                ? (entry.userEvidence.trim() || 'Yes')
                : 'No'
            })
          }
        })

        if (interactions.length > 0) {
          await saveRequirementInteractions(supabase, userId, currentLlmAnalysisId, interactions)
        }
      } catch (saveErr) {
        Logger.error('RequirementResolutionForm.tsx', 'handleSubmit', 'Failed to save requirement interactions', saveErr)
      }
    }

    setResolvedRequirementsData(context)
    await handleTailoring(context)
  }

  const totalQuestions = resolutionQuestions.length
  const currentQuestion = resolutionQuestions[currentCardIndex]
  const isLastCard = currentCardIndex === totalQuestions - 1

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="max-w-md sm:max-w-[420px] w-full flex flex-col gap-3.5">
        {/* ─── Top Header ─── */}
        <div className="flex items-center justify-between gap-3 px-1 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-tight">
              Requirement Clarification
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={isProcessing}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              Skip all & Tailor →
            </button>
            <button
              onClick={() => setTailoringStatus('idle')}
              className="w-6 h-6 rounded-md bg-slate-100 dark:bg-[#272C34] hover:bg-slate-200 dark:hover:bg-[#323943] border border-slate-200 dark:border-[#383F4B] flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Cancel"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── API Key Error Banner ─── */}
        {apiKeyError && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200 text-xs px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
              <span>{apiKeyError}</span>
            </div>
            <button
              onClick={clearApiKeyError}
              className="text-rose-600 dark:text-rose-400 hover:underline text-xs cursor-pointer ml-3 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── Loading State ─── */}
        {isGeneratingQuestions ? (
          <div className="bg-white/90 dark:bg-[#1E2228]/95 border border-slate-200/80 dark:border-[#2F353E] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm backdrop-blur-md transition-colors duration-200 min-h-[440px]">
            <FiRefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Analyzing requirements...
            </h3>
          </div>
        ) : totalQuestions === 0 ? (
          /* ─── Zero Questions / Fully Matched State ─── */
          <div className="bg-white/90 dark:bg-[#1E2228]/95 border border-slate-200/80 dark:border-[#2F353E] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm backdrop-blur-md transition-colors duration-200 min-h-[440px]">
            <FiCheckCircle className="w-7 h-7 text-emerald-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Requirements fully matched
            </h3>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isProcessing}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 transition-colors shadow-xs cursor-pointer"
            >
              {isProcessing ? 'Tailoring…' : 'Tailor Resume Now'}
            </button>
          </div>
        ) : (
          /* ─── Portrait Professional Question Card (Light Grayish Dark Theme) ─── */
          currentQuestion && (
            <div className="bg-white/95 dark:bg-[#1E2228]/95 border border-slate-900/80 dark:border-[#2F353E] rounded-3xl p-6 sm:p-7 flex flex-col justify-between min-h-[460px] sm:min-h-[490px] shadow-sm dark:shadow-xl backdrop-blur-md transition-all duration-200">
              <div className="flex flex-col gap-4">
                {/* Progress Bar & Counter */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-400 font-mono">
                    <span>Step {currentCardIndex + 1} of {totalQuestions}</span>
                    <span>{Math.round(((currentCardIndex + 1) / totalQuestions) * 100)}%</span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#292F38] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${((currentCardIndex + 1) / totalQuestions) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug tracking-tight mt-1">
                  {currentQuestion.question}
                </h3>

                {/* Step 1: Yes / No Option Buttons */}
                {(() => {
                  const ans = questionAnswers[currentQuestion.requirement] || {
                    hasExperience: true,
                    userEvidence: ''
                  }
                  const isYes = ans.hasExperience

                  return (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleQuestionExperience(currentQuestion.requirement, true)
                          }
                          className={`py-2.5 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isYes
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-500 dark:border-emerald-500/60 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#272C34] dark:hover:bg-[#303640] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#38404C]'
                          }`}
                        >
                          <FiCheck className={`w-3.5 h-3.5 ${isYes ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'}`} />
                          <span>Yes, I have experience</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleQuestionExperience(currentQuestion.requirement, false)
                          }
                          className={`py-2.5 px-3.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            !isYes
                              ? 'bg-slate-100 dark:bg-[#323943] text-slate-800 dark:text-slate-100 border-2 border-slate-400 dark:border-slate-400 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#272C34] dark:hover:bg-[#303640] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#38404C]'
                          }`}
                        >
                          <FiXCircle className={`w-3.5 h-3.5 ${!isYes ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'}`} />
                          <span>No, skip</span>
                        </button>
                      </div>

                      {/* Evidence Input Box */}
                      {isYes && (
                        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150 mt-1">
                          <textarea
                            rows={3}
                            value={ans.userEvidence}
                            onChange={(e) =>
                              handleQuestionEvidenceChange(
                                currentQuestion.requirement,
                                e.target.value
                              )
                            }
                            placeholder={currentQuestion.followUp || "Provide context, key metrics, or impact..."}
                            className="w-full bg-slate-50 dark:bg-[#14171B] border border-slate-200 focus:border-emerald-500 dark:border-[#343B46] dark:focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 outline-none resize-none transition-colors leading-relaxed"
                          />
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#2D333C] flex items-center justify-between gap-3 mt-auto">
                <button
                  type="button"
                  onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentCardIndex === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FiArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                {!isLastCard ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentCardIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                    }
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FiZap className="w-3.5 h-3.5 fill-current" />
                    <span>{isProcessing ? 'Tailoring…' : 'Submit & Tailor'}</span>
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* ─── Minimal Custom Note ─── */}
        {!isGeneratingQuestions && (
          <div className="flex flex-col gap-2">
            {!isAddingCustom ? (
              <button
                onClick={() => setIsAddingCustom(true)}
                className="self-center flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <FiPlus className="w-3 h-3 text-emerald-500" />
                <span>Add custom note</span>
              </button>
            ) : (
              <div className="bg-white/90 dark:bg-[#1E2228]/95 border border-slate-200 dark:border-[#2F353E] rounded-xl p-3 flex flex-col gap-2 animate-in fade-in shadow-xs backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <span>Add Extra Note:</span>
                  <button
                    onClick={() => setIsAddingCustom(false)}
                    className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customReqText}
                    onChange={(e) => setCustomReqText(e.target.value)}
                    placeholder="e.g., 2 years GraphQL experience..."
                    className="flex-1 bg-slate-50 dark:bg-[#14171B] border border-slate-200 dark:border-[#343B46] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddCustomRequirement}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {customEntries.map((c) => (
              <div
                key={c.id}
                className="bg-white/90 dark:bg-[#1E2228]/95 border border-slate-200 dark:border-[#2F353E] rounded-xl p-3 flex flex-col gap-1.5 shadow-xs"
              >
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  Note: {c.requirement}
                </span>
                <textarea
                  rows={2}
                  value={c.evidence}
                  onChange={(e) => handleCustomEvidenceChange(c.id, e.target.value)}
                  placeholder="Provide experience details..."
                  className="w-full bg-slate-50 dark:bg-[#14171B] border border-slate-200 dark:border-[#343B46] rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 outline-none resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


