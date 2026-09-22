import React, { useState, useRef, useEffect } from 'react'
import {
  FiCheck,
  FiChevronDown,
  FiCode,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiMaximize2,
  FiMinimize2,
  FiSave,
  FiZoomIn,
  FiZoomOut
} from '../../icons'
import { useAppStore } from '../../../lib/zustandStore'

export type ViewMode = 'preview' | 'changes' | 'ats'
export type DocumentViewType = 'document' | 'markdown'

interface ResumeToolbarProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  docViewType: DocumentViewType
  setDocViewType: (type: DocumentViewType) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onExport: (format: 'pdf' | 'doc' | 'md' | 'txt') => void
  onSaveVersion: () => void
  isSaving: boolean
  saveSuccess: boolean
}

const TEMPLATES: { id: 'classic' | 'modern' | 'minimal'; label: string }[] = [
  { id: 'classic', label: 'Classic ATS' },
  { id: 'modern', label: 'Modern Tech' },
  { id: 'minimal', label: 'Minimal' }
]

const ZOOM_LEVELS = [
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 }
]

export function ResumeToolbar({
  viewMode,
  setViewMode,
  docViewType,
  setDocViewType,
  isFullscreen,
  onToggleFullscreen,
  onExport,
  onSaveVersion,
  isSaving,
  saveSuccess
}: ResumeToolbarProps): React.JSX.Element {
  const {
    canvasTemplate,
    setCanvasTemplate,
    canvasZoom,
    setCanvasZoom,
    setIsEditingResume,
    tailoringStatus,
    postTailorLlmResult
  } = useAppStore()

  const [templateMenuOpen, setTemplateMenuOpen] = useState(false)
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const templateRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  const isTailored = tailoringStatus === 'completed' || Boolean(postTailorLlmResult)

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateMenuOpen(false)
      }
      if (zoomRef.current && !zoomRef.current.contains(e.target as Node)) {
        setZoomMenuOpen(false)
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTemplateLabel =
    TEMPLATES.find((t) => t.id === canvasTemplate)?.label || 'Classic ATS'

  const handleZoomChange = (delta: number): void => {
    const newZoom = Math.min(1.5, Math.max(0.5, Number((canvasZoom + delta).toFixed(2))))
    setCanvasZoom(newZoom)
  }

  const toggleEdit = (): void => {
    const nextType = docViewType === 'document' ? 'markdown' : 'document'
    setDocViewType(nextType)
    setIsEditingResume(nextType === 'markdown')
  }

  return (
    <div className="w-full bg-transparent backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-4 py-2 flex items-center justify-between gap-3 select-none flex-shrink-0 relative z-30 min-w-0 shadow-xs transition-colors duration-200 flex-wrap sm:flex-nowrap">
      {/* ── Left: Template & Edit Toggle ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Template Selector Dropdown */}
        <div className="relative" ref={templateRef}>
          <button
            onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
            className="h-8 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-800 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Select Resume Template"
          >
            <span className="text-slate-500 dark:text-neutral-400 font-bold">Template:</span>
            <span className="font-bold text-slate-900 dark:text-white">{currentTemplateLabel}</span>
            <FiChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-neutral-400 transition-transform ${templateMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {templateMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-40 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1 text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Template Layout
              </div>
              {TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === canvasTemplate
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setCanvasTemplate(tmpl.id)
                      setTemplateMenuOpen(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{tmpl.label}</span>
                    {isSelected && <FiCheck className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={toggleEdit}
          className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
            docViewType === 'markdown'
              ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
              : 'bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/[0.06]'
          }`}
          title="Toggle editing mode"
        >
          <FiEdit2 className="w-3.5 h-3.5" />
          <span>{docViewType === 'markdown' ? 'Editing' : 'Edit'}</span>
        </button>
      </div>

      {/* ── Center: View Mode Segmented Controls ── */}
      <div className="flex-1 flex justify-center items-center min-w-0">
        <div className="flex items-center bg-slate-100 dark:bg-black/40 p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-inner">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setViewMode('changes')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'changes'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Changes Diff
          </button>
          <button
            onClick={() => setViewMode('ats')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'ats'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ATS Insights
          </button>
        </div>
      </div>

      {/* ── Right: Zoom, Save Version, Export PDF & Fullscreen ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] rounded-xl h-8 p-0.5 shadow-xs">
          <button
            onClick={() => handleZoomChange(-0.1)}
            className="w-6 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <FiZoomOut className="w-3.5 h-3.5" />
          </button>

          <div className="relative" ref={zoomRef}>
            <button
              onClick={() => setZoomMenuOpen(!zoomMenuOpen)}
              className="px-1.5 font-mono text-[11px] font-bold text-slate-800 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {Math.round(canvasZoom * 100)}%
            </button>

            {zoomMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-24 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1 text-xs font-mono">
                {ZOOM_LEVELS.map((z) => (
                  <button
                    key={z.label}
                    onClick={() => {
                      setCanvasZoom(z.value)
                      setZoomMenuOpen(false)
                    }}
                    className="w-full px-3 py-1 text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleZoomChange(0.1)}
            className="w-6 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <FiZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Save Version Button (Deactivated if tailoring not happened) */}
        <button
          onClick={onSaveVersion}
          disabled={!isTailored || isSaving}
          className={`h-8 px-3 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-xs ${
            !isTailored
              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/[0.02] text-slate-400 dark:text-neutral-600 border-slate-200 dark:border-white/[0.04]'
              : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 cursor-pointer active:scale-95'
          }`}
          title={!isTailored ? 'Tailor resume first to save a version' : 'Save as a new tailored version'}
        >
          {saveSuccess ? (
            <>
              <FiCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400">Saved!</span>
            </>
          ) : (
            <>
              <FiSave className={`w-3.5 h-3.5 ${!isTailored ? 'text-slate-400 dark:text-neutral-600' : 'text-slate-700 dark:text-neutral-300'}`} />
              <span>{isSaving ? 'Saving...' : 'Save Version'}</span>
            </>
          )}
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="h-8 px-3 rounded-xl bg-slate-900 text-white dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-400 dark:text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Export tailored resume"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Export</span>
            <FiChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150 text-xs font-semibold">
              <div className="px-3.5 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Export Format
              </div>
              <button
                onClick={() => {
                  onExport('pdf')
                  setExportOpen(false)
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>PDF Document</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.pdf</span>
              </button>

              <button
                onClick={() => {
                  onExport('doc')
                  setExportOpen(false)
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Word Document</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.doc</span>
              </button>

              <button
                onClick={() => {
                  onExport('md')
                  setExportOpen(false)
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Markdown</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.md</span>
              </button>

              <button
                onClick={() => {
                  onExport('txt')
                  setExportOpen(false)
                }}
                className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Plain Text</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.txt</span>
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06] flex items-center justify-center transition-all cursor-pointer shadow-xs"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <FiMinimize2 className="w-3.5 h-3.5" />
          ) : (
            <FiMaximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
