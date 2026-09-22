import React, { useState, useRef } from 'react'
import { LuCircleAlert, LuCircleCheck, LuFileText, LuLoader, LuUpload, LuX } from '@/components/icons'
import Logger from '@utils/logger'

interface UploadResumeModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadFile: (
    file: File,
    customName?: string,
    onProgress?: (status: string) => void
  ) => Promise<void>
}

export function UploadResumeModal({
  isOpen,
  onClose,
  onUploadFile
}: UploadResumeModalProps): React.JSX.Element | null {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [customName, setCustomName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('Parsing Resume...')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null)
    const validExtensions = ['.pdf', '.docx', '.txt', '.md']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExt) {
      setErrorMessage('Please upload a valid PDF, DOCX, TXT, or MD resume document.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 15MB maximum limit.')
      return
    }

    setSelectedFile(file)
    if (!customName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setCustomName(cleanName)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    setErrorMessage(null)
    setStatusMessage('Reading document bytes...')
    try {
      await onUploadFile(selectedFile, customName.trim() || undefined, (msg) => {
        setStatusMessage(msg)
      })
      onClose()
    } catch (err) {
      Logger.error('UploadResumeModal.tsx', 'handleSubmit', 'Upload failed', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse and import resume.')
    } finally {
      setIsProcessing(false)
      setStatusMessage('Parsing Resume...')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#111215] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <LuUpload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Upload Base Resume</h2>
              <p className="text-[11px] text-neutral-400">
                Import document as a master base resume node
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isProcessing ? 'pointer-events-none opacity-60' : ''
            } ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                : selectedFile
                  ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                  : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 hover:bg-neutral-900/60'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleInputChange}
              className="hidden"
              disabled={isProcessing}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <LuCircleCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white truncate max-w-[260px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · Ready to import
                  </p>
                </div>
                {!isProcessing && (
                  <span className="inline-block text-[10.5px] text-indigo-400 hover:underline">
                    Click to replace file
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_16px_rgba(99,102,241,0.15)]">
                  <LuUpload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Drop your resume here
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    or <span className="text-indigo-400 font-medium hover:underline">browse files</span>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10.5px] text-neutral-500">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                    PDF / DOCX / TXT
                  </span>
                  <span>Maximum file size: 15MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Optional Rename input */}
          {selectedFile && !isProcessing && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-[11px] font-semibold text-neutral-300">
                Resume Display Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Processing step banner */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs animate-in fade-in duration-150">
              <LuLoader className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
              <div className="flex-1">
                <p className="font-semibold text-white text-[12px]">{statusMessage}</p>
                <p className="text-[10.5px] text-indigo-300/80 mt-0.5">
                  AI is extracting sections and preparing database record...
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <LuCircleAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isProcessing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <LuLoader className="w-3.5 h-3.5 animate-spin" />
                <span>{statusMessage}</span>
              </>
            ) : (
              <>
                <LuFileText className="w-3.5 h-3.5" />
                <span>Import Base Resume</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
