import React, { useState, useEffect, useCallback } from 'react'
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { AIFeature, AI_FEATURE_LABELS, APIUsageData } from '../types'
import {
  connectKey,
  replaceKey,
  deleteKey,
  getUsageData,
  DateFilter
} from '../utils/apiUsageService'
import { BackButton } from './BackButton'

interface ApiUsagePageProps {
  supabase: SupabaseClient
  session: Session
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return n.toLocaleString()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block border-2 border-neutral-600 border-t-white rounded-full animate-spin"
    />
  )
}

function SkeletonLine({ width = '100%' }: { width?: string }) {
  return <div style={{ width }} className="h-3 bg-neutral-800 rounded animate-pulse" />
}

interface ConfirmModalProps {
  title: string
  body: React.ReactNode
  confirmLabel: string
  confirmClass?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  confirmClass = 'bg-red-600 hover:bg-red-500 text-white',
  loading,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <div className="text-xs text-neutral-400 leading-relaxed">{body}</div>
        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${confirmClass}`}
          >
            {loading && <Spinner size={12} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Modal = 'none' | 'replace' | 'delete'

export function ApiUsagePage({ supabase, session }: ApiUsagePageProps): React.JSX.Element {
  const userId = session.user.id

  // ── State ──────────────────────────────────────────────────────────────────
  const [usageData, setUsageData] = useState<APIUsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [featureFilter, setFeatureFilter] = useState<AIFeature | 'ALL'>('ALL')

  // Connect / replace input
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const [modal, setModal] = useState<Modal>('none')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Replace key input (used inside Replace modal)
  const [replaceKeyInput, setReplaceKeyInput] = useState('')
  const [showReplaceKey, setShowReplaceKey] = useState(false)
  const [replaceStep, setReplaceStep] = useState<'input' | 'confirm'>('input')
  const [replaceValidating, setReplaceValidating] = useState(false)
  const [replaceError, setReplaceError] = useState<string | null>(null)

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadUsage = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getUsageData(supabase, userId, dateFilter, featureFilter)
      setUsageData(data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Unable to load API usage.')
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, dateFilter, featureFilter])

  useEffect(() => {
    loadUsage()
  }, [loadUsage])

  // ── Connect key ────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    const trimmed = keyInput.trim()
    if (!trimmed) return
    setConnecting(true)
    setConnectError(null)
    try {
      const result = await connectKey(supabase, userId, trimmed)
      if (!result.success) {
        setConnectError(result.error || 'Unable to connect this API key.')
        return
      }
      setKeyInput('')
      await loadUsage()
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Unexpected error.')
    } finally {
      setConnecting(false)
    }
  }

  // ── Replace key (two-step: validate → confirm) ─────────────────────────────
  const handleReplaceValidate = async () => {
    const trimmed = replaceKeyInput.trim()
    if (!trimmed) return
    setReplaceValidating(true)
    setReplaceError(null)
    try {
      const result = await window.api.validateOpenAIKey(trimmed)
      if (!result.valid) {
        setReplaceError(result.error || 'Invalid API key.')
        return
      }
      setReplaceStep('confirm')
    } catch (e) {
      setReplaceError(e instanceof Error ? e.message : 'Unexpected error.')
    } finally {
      setReplaceValidating(false)
    }
  }

  const handleReplaceConfirm = async () => {
    setModalLoading(true)
    setModalError(null)
    try {
      const result = await replaceKey(supabase, userId, replaceKeyInput.trim())
      if (!result.success) {
        setModalError(result.error || 'Failed to replace key.')
        return
      }
      closeModal()
      await loadUsage()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Unexpected error.')
    } finally {
      setModalLoading(false)
    }
  }

  // ── Delete key ─────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setModalLoading(true)
    setModalError(null)
    try {
      const result = await deleteKey(supabase, userId)
      if (!result.success) {
        setModalError(result.error || 'Failed to delete key.')
        return
      }
      closeModal()
      await loadUsage()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : 'Unexpected error.')
    } finally {
      setModalLoading(false)
    }
  }

  const openModal = (m: Modal) => {
    setModal(m)
    setModalError(null)
    setModalLoading(false)
    if (m === 'replace') {
      setReplaceKeyInput('')
      setShowReplaceKey(false)
      setReplaceStep('input')
      setReplaceError(null)
    }
  }

  const closeModal = () => {
    setModal('none')
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const DATE_FILTERS: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7days' },
    { label: '30 Days', value: '30days' },
    { label: 'All', value: 'all' }
  ]

  const FEATURE_OPTIONS: (AIFeature | 'ALL')[] = [
    'ALL',
    'RESUME_TAILOR',
    'JOB_ANALYZE',
    'RESUME_MATCH',
    'COVER_LETTER',
    'AI_INTERVIEW',
    'RESUME_PARSE',
    'RESUME_EMBED'
  ]

  // Format full date and time for entry
  const formatDateTime = (isoString: string): string => {
    const d = new Date(isoString)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-neutral-950 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b border-neutral-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <BackButton title="Go back to previous page" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">API Usage</h1>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Connect your OpenAI key to power AI features and track token consumption.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 flex flex-col gap-6 max-w-3xl w-full mx-auto">
        {/* ── Loading state ── */}
        {loading && (
          <div className="flex flex-col gap-5">
            <div className="bg-black border border-neutral-900 rounded-xl p-6 flex flex-col gap-3">
              <SkeletonLine width="40%" />
              <SkeletonLine width="60%" />
              <SkeletonLine width="30%" />
            </div>
            <div className="bg-black border border-neutral-900 rounded-xl p-6 flex flex-col gap-3">
              <SkeletonLine width="50%" />
              <div className="flex gap-4 mt-2">
                <SkeletonLine width="30%" />
                <SkeletonLine width="30%" />
                <SkeletonLine width="30%" />
              </div>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {!loading && loadError && (
          <div className="bg-black border border-neutral-900 rounded-xl p-6 flex flex-col items-center gap-3">
            <p className="text-sm text-neutral-400">{loadError}</p>
            <button
              onClick={loadUsage}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !loadError && usageData && (
          <>
            {/* ── No key connected ── */}
            {!usageData.connected && (
              <div className="bg-black border border-neutral-900 rounded-xl p-8 flex flex-col items-center gap-5 text-center">
                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-neutral-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white mb-1">Connect your OpenAI API key</h2>
                  <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                    Use your own OpenAI API key to power AI features. Your key is securely stored
                    using OS-level encryption and is never exposed in the client.
                  </p>
                </div>

                {/* Input */}
                <div className="w-full max-w-sm flex flex-col gap-3">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider text-left">
                    OpenAI API Key
                  </label>
                  <div className="relative">
                    <input
                      id="api-key-input"
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                      placeholder="sk-••••••••••••••••••••••••••••"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 pr-10 text-xs text-white font-mono outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {connectError && <p className="text-[11px] text-red-400">{connectError}</p>}

                  <button
                    id="connect-api-key-btn"
                    onClick={handleConnect}
                    disabled={connecting || !keyInput.trim()}
                    className="w-full py-2.5 bg-white text-black text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <Spinner size={12} />
                        Validating...
                      </>
                    ) : (
                      'Connect API Key'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Key connected ── */}
            {usageData.connected && (
              <>
                {/* Key status card */}
                <div className="bg-black border border-neutral-900 rounded-xl p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3.5 h-3.5 text-emerald-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">OpenAI API</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded-full font-medium">
                          Connected
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        ••••••••••••{usageData.keyLast4 ?? '????'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="change-api-key-btn"
                      onClick={() => openModal('replace')}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      Change Key
                    </button>
                    <button
                      id="delete-api-key-btn"
                      onClick={() => openModal('delete')}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-red-900 text-red-400 hover:bg-red-950 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-black border border-neutral-900 rounded-lg p-1">
                    {DATE_FILTERS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setDateFilter(f.value)}
                        className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors ${
                          dateFilter === f.value
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <select
                      value={featureFilter}
                      onChange={(e) => setFeatureFilter(e.target.value as AIFeature | 'ALL')}
                      className="bg-black border border-neutral-900 text-neutral-400 text-[11px] rounded-lg px-3 py-2 pr-7 outline-none appearance-none cursor-pointer hover:border-neutral-700 transition-colors"
                    >
                      {FEATURE_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f === 'ALL' ? 'All Features' : AI_FEATURE_LABELS[f as AIFeature]}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-neutral-500 pointer-events-none">
                      ▼
                    </span>
                  </div>
                </div>

                {/* Usage Summary */}
                <div className="bg-black border border-neutral-900 rounded-xl p-5 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Usage Summary
                  </span>

                  {usageData.summary.totalTokens === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <svg
                        className="w-8 h-8 text-neutral-800"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                      </svg>
                      <p className="text-xs text-neutral-600">No AI usage yet.</p>
                      <p className="text-[11px] text-neutral-700">
                        Use Resume Tailor, Job Analyze, or another AI feature to see usage here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: 'Total Tokens',
                          value: usageData.summary.totalTokens,
                          highlight: true
                        },
                        { label: 'Input', value: usageData.summary.inputTokens, highlight: false },
                        { label: 'Output', value: usageData.summary.outputTokens, highlight: false }
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <span
                            className={`text-lg font-bold tabular-nums ${highlight ? 'text-white' : 'text-neutral-300'}`}
                          >
                            {formatNumber(value)}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-medium">{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Usage by Feature */}
                {usageData.byFeature.length > 0 && (
                  <div className="bg-black border border-neutral-900 rounded-xl p-5 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Usage by Feature
                    </span>
                    <div className="flex flex-col gap-2">
                      {usageData.byFeature.map(({ feature, totalTokens }) => {
                        const maxTokens = usageData.byFeature[0].totalTokens
                        const pct = maxTokens > 0 ? (totalTokens / maxTokens) * 100 : 0
                        return (
                           <div key={feature} className="flex items-center gap-3">
                            <span className="text-xs text-neutral-400 w-28 shrink-0">
                              {AI_FEATURE_LABELS[feature]}
                            </span>
                            <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neutral-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-400 tabular-nums w-20 text-right">
                              {formatNumber(totalTokens)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Usage History */}
                {usageData.history.length > 0 && (
                  <div className="bg-black border border-neutral-900 rounded-xl p-5 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Usage History (Detailed)
                    </span>
                    <div className="flex flex-col gap-2 divide-y divide-neutral-900">
                      {usageData.history.map((e, i) => (
                        <div key={i} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {AI_FEATURE_LABELS[e.feature]}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {formatDateTime(e.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="font-mono bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500">
                              {e.model}
                            </span>
                            <span className="tabular-nums">
                              {formatNumber(e.totalTokens)} total{' '}
                              <span className="text-neutral-600">
                                ({formatNumber(e.inputTokens)} in / {formatNumber(e.outputTokens)} out)
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Replace Key Modal ── */}
      {modal === 'replace' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            {replaceStep === 'input' ? (
              <>
                <h3 className="text-sm font-bold text-white">Change API Key</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Enter your new OpenAI API key. We'll validate it before replacing the current one.
                </p>
                <div className="relative">
                  <input
                    id="replace-api-key-input"
                    type={showReplaceKey ? 'text' : 'password'}
                    value={replaceKeyInput}
                    onChange={(e) => setReplaceKeyInput(e.target.value)}
                    placeholder="sk-••••••••••••••••••••••••••••"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 pr-10 text-xs text-white font-mono outline-none focus:border-neutral-600 transition-colors placeholder:text-neutral-700"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowReplaceKey(!showReplaceKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showReplaceKey ? (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {replaceError && <p className="text-[11px] text-red-400">{replaceError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplaceValidate}
                    disabled={replaceValidating || !replaceKeyInput.trim()}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-neutral-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {replaceValidating ? (
                      <>
                        <Spinner size={12} />
                        Validating...
                      </>
                    ) : (
                      'Validate Key'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <ConfirmModal
                title="Replace API key?"
                body={
                  <ul className="flex flex-col gap-1 list-none pl-0">
                    <li>• Your current API key will be removed</li>
                    <li>• All usage history will be deleted</li>
                    <li>• The new key will start with zero usage</li>
                    <li className="mt-2 text-amber-500">This action cannot be undone.</li>
                  </ul>
                }
                confirmLabel="Replace API Key"
                confirmClass="bg-white text-black hover:bg-neutral-200"
                loading={modalLoading}
                onConfirm={handleReplaceConfirm}
                onCancel={closeModal}
              />
            )}
            {modalError && <p className="text-[11px] text-red-400">{modalError}</p>}
          </div>
        </div>
      )}

      {/* ── Delete Key Modal ── */}
      {modal === 'delete' && (
        <ConfirmModal
          title="Delete OpenAI API key?"
          body={
            <ul className="flex flex-col gap-1 list-none pl-0">
              <li>• Disconnect your OpenAI API key</li>
              <li>• Delete all usage history associated with this key</li>
              <li>• Disable AI features until another key is connected</li>
              <li className="mt-2 text-red-400 font-medium">This action cannot be undone.</li>
            </ul>
          }
          confirmLabel="Delete API Key"
          loading={modalLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={closeModal}
        />
      )}
    </div>
  )
}
