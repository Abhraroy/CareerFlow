import React, { useState, useEffect } from 'react'
import { JobItem } from '../types'
import { LuCopy, LuRefreshCw, LuSparkles, LuX, LuCheck, LuFileText } from '../../icons'
import { useAppStore } from '../../../lib/zustandStore'
import { supabase } from '../../../lib/supabase'
import { getActiveKey } from '../../../utils/apiUsageService'
import { markdownToHtml, markdownToPlainText } from '../../../utils/markdownUtils'
import { MarkdownView } from './MarkdownView'
import Logger from '@utils/logger'

interface CoverLetterModalProps {
  isOpen: boolean
  job: JobItem | null
  onClose: () => void
}

export function CoverLetterModal({
  isOpen,
  job,
  onClose
}: CoverLetterModalProps): React.JSX.Element | null {
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedMode, setCopiedMode] = useState<'formatted' | 'text' | 'markdown' | null>(null)

  const { resumes, selectedResumeName, currentResume, userId } = useAppStore()

  const generateCoverLetter = async () => {
    if (!job) return

    setIsLoading(true)
    setError(null)
    setCoverLetter('')

    try {
      // 1. Resolve Active Global Resume
      const activeResume =
        currentResume ||
        resumes.find((r) => r.name === selectedResumeName) ||
        resumes[0]

      if (!activeResume) {
        setError('No resume found. Please select or upload a resume first.')
        setIsLoading(false)
        return
      }

      const resumeText =
        activeResume.rawResumeData ||
        activeResume.uploadedData ||
        (activeResume.structuredData
          ? JSON.stringify(activeResume.structuredData)
          : '')

      if (!resumeText) {
        setError('Selected resume content is empty.')
        setIsLoading(false)
        return
      }

      // 2. Resolve OpenAI API Key
      let activeApiKey = ''
      if (supabase && userId) {
        const keyRecord = await getActiveKey(supabase, userId)
        if (keyRecord?.encrypted_key) {
          activeApiKey = keyRecord.encrypted_key
        }
      }

      if (!activeApiKey) {
        setError('No active OpenAI API key found. Please connect your API key in Settings.')
        setIsLoading(false)
        return
      }

      // 3. Prepare Job Payload
      const jobData = {
        jobTitle: job.jobTitle,
        company: job.company,
        description: job.description || job.rawMatch?.evidence || ''
      }

      // 4. Call LLM Backend via IPC
      if (!window.api?.LLMGenerateCoverLetter) {
        throw new Error('Cover letter backend API is unavailable.')
      }

      const result = await window.api.LLMGenerateCoverLetter(
        'openai',
        resumeText,
        activeApiKey,
        JSON.stringify(jobData),
        userId || undefined
      )

      if (result?.coverLetter) {
        setCoverLetter(result.coverLetter)
      } else {
        throw new Error('LLM returned an empty response.')
      }
    } catch (err: any) {
      Logger.error('CoverLetterModal.tsx', 'generateCoverLetter', 'Error generating cover letter', err)
      setError(err?.message || 'Failed to generate cover letter. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && job) {
      generateCoverLetter()
    }
  }, [isOpen, job?.id])

  if (!isOpen || !job) return null

  // Copy as Formatted Rich Text (HTML table & styled text) for Gmail, Word, Docs, Outlook
  const handleCopyFormatted = async () => {
    if (!coverLetter) return
    try {
      const htmlStr = markdownToHtml(coverLetter)
      const textStr = markdownToPlainText(coverLetter)

      if (navigator.clipboard && window.ClipboardItem) {
        const htmlBlob = new Blob([htmlStr], { type: 'text/html' })
        const textBlob = new Blob([textStr], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
          })
        ])
      } else {
        await navigator.clipboard.writeText(textStr)
      }
      setCopiedMode('formatted')
      setTimeout(() => setCopiedMode(null), 2000)
    } catch (err) {
      Logger.error('CoverLetterModal.tsx', 'handleCopyFormatted', 'Failed copying formatted text', err)
      try {
        await navigator.clipboard.writeText(markdownToPlainText(coverLetter))
        setCopiedMode('formatted')
        setTimeout(() => setCopiedMode(null), 2000)
      } catch (fallbackErr) {
        Logger.error('CoverLetterModal.tsx', 'handleCopyFormatted', 'Fallback copy failed', fallbackErr)
      }
    }
  }

  // Copy as Clean Plain Text
  const handleCopyPlainText = async () => {
    if (!coverLetter) return
    try {
      const textStr = markdownToPlainText(coverLetter)
      await navigator.clipboard.writeText(textStr)
      setCopiedMode('text')
      setTimeout(() => setCopiedMode(null), 2000)
    } catch (err) {
      Logger.error('CoverLetterModal.tsx', 'handleCopyPlainText', 'Plain text copy failed', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#111215] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <LuSparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Cover Letter — {job.company}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">{job.jobTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col bg-neutral-950/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                <LuSparkles className="w-5 h-5 text-purple-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Generating Tailored Cover Letter...</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Analyzing job requirements and matching profile evidence with AI
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <LuX className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-red-400">{error}</p>
              <button
                onClick={generateCoverLetter}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <LuRefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 shadow-inner">
              <MarkdownView content={coverLetter} />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            {!isLoading && coverLetter && (
              <>
                <button
                  type="button"
                  onClick={generateCoverLetter}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LuRefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPlainText}
                  title="Copy as clean plain text without formatting"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedMode === 'text' ? (
                    <>
                      <LuCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Text!</span>
                    </>
                  ) : (
                    <>
                      <LuFileText className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Plain Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyFormatted}
                  title="Copy formatted text (HTML & Tables) ready to paste in Word, Gmail, Docs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                >
                  {copiedMode === 'formatted' ? (
                    <>
                      <LuCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied Formatted!</span>
                    </>
                  ) : (
                    <>
                      <LuCopy className="w-3.5 h-3.5" />
                      <span>Copy Formatted (Rich Text)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

