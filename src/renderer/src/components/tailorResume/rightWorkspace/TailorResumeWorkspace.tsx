import React, { useState, useRef } from 'react'
import { useAppStore } from '../../../lib/zustandStore'
import { ResumeToolbar, ViewMode, DocumentViewType } from './ResumeToolbar'
import { ResumeDocumentContainer } from './ResumeDocumentContainer'
import { FiAlertCircle, FiCheckCircle } from '@/components/icons'
import Logger from '@utils/logger'

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportToWordDocument(data: any, rawText: string, filename: string): void {
  let bodyContent = ''
  if (data && typeof data === 'object') {
    if (data.name) bodyContent += `<h1 style="font-size: 18pt; margin-bottom: 2px;">${data.name}</h1>`
    if (data.title) bodyContent += `<p style="font-size: 12pt; color: #555; margin-top: 0;">${data.title}</p>`
    if (data.contact) bodyContent += `<p style="font-size: 9.5pt; color: #777; margin-bottom: 12px;">${data.contact}</p>`
    if (data.summary) {
      bodyContent += `<h2 style="font-size: 12pt; color: #0d9488; border-bottom: 1px solid #0d9488; padding-bottom: 2px;">PROFESSIONAL SUMMARY</h2>`
      bodyContent += `<p style="font-size: 10.5pt; line-height: 1.4;">${data.summary}</p>`
    }
    if (data.skills && Array.isArray(data.skills)) {
      bodyContent += `<h2 style="font-size: 12pt; color: #0d9488; border-bottom: 1px solid #0d9488; padding-bottom: 2px; margin-top: 12px;">TECHNICAL SKILLS</h2>`
      data.skills.forEach((s: any) => {
        bodyContent += `<p style="font-size: 10.5pt; margin: 2px 0;"><strong>${s.category}:</strong> ${s.items}</p>`
      })
    }
    if (data.experience && Array.isArray(data.experience)) {
      bodyContent += `<h2 style="font-size: 12pt; color: #0d9488; border-bottom: 1px solid #0d9488; padding-bottom: 2px; margin-top: 12px;">EXPERIENCE</h2>`
      data.experience.forEach((exp: any) => {
        bodyContent += `<p style="font-size: 11pt; font-weight: bold; margin-bottom: 0;">${exp.role} — ${exp.company} <span style="font-weight: normal; font-size: 9.5pt; color: #777;">(${exp.period})</span></p>`
        if (exp.bullets && Array.isArray(exp.bullets)) {
          bodyContent += `<ul style="margin: 2px 0 8px 18px;">`
          exp.bullets.forEach((b: string) => {
            bodyContent += `<li style="font-size: 10.5pt; line-height: 1.35;">${b}</li>`
          })
          bodyContent += `</ul>`
        }
      })
    }
  } else {
    rawText.split('\n').forEach((line) => {
      if (!line.trim()) return
      bodyContent += `<p style="font-size: 10.5pt; margin: 3px 0;">${line}</p>`
    })
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${filename}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #222; }
  h1 { font-size: 18pt; margin: 0 0 4px 0; color: #111; }
  h2 { font-size: 12pt; margin-top: 12px; margin-bottom: 4px; }
  p { margin: 3px 0; }
  ul { margin: 3px 0 8px 20px; padding: 0; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>${bodyContent}</body>
</html>`

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  triggerFileDownload(blob, filename.endsWith('.doc') ? filename : `${filename}.doc`)
}
export function TailorResumeWorkspace(): React.JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [docViewType, setDocViewType] = useState<DocumentViewType>('document')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const workspaceContainerRef = useRef<HTMLDivElement>(null)

  const {
    tailoredResume,
    tailoredResumeText,
    currentResume
  } = useAppStore()

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      workspaceContainerRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const getExportBaseName = (): string => {
    const candidateName =
      tailoredResume?.name?.replace(/\s+/g, '_') ||
      (currentResume?.profileDetails?.firstName
        ? `${currentResume.profileDetails.firstName}_${currentResume.profileDetails.lastName || ''}`.replace(/\s+/g, '_')
        : (currentResume?.name || 'Resume').replace(/\.[^/.]+$/, '').replace(/\s+/g, '_'))
    return `${candidateName}_Tailored`
  }

  const handleExport = async (format: 'pdf' | 'doc' | 'md' | 'txt'): Promise<void> => {
    const baseName = getExportBaseName()

    try {
      if (format === 'pdf') {
        const sheetEl = document.getElementById('printable-resume-sheet')
        if (sheetEl && window.api?.exportResumeToPdf) {
          // Clone the element so we don't modify the on-screen DOM
          const clone = sheetEl.cloneNode(true) as HTMLElement
          clone.style.transform = 'none'
          clone.style.margin = '0 auto'
          clone.style.boxShadow = 'none'
          clone.style.border = 'none'

          // Collect all active stylesheets and style tags for full visual parity
          const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          const stylesHtml = styleElements.map((el) => el.outerHTML).join('\n')

          const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  ${stylesHtml}
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 794px;
      height: auto;
    }
    #printable-resume-sheet {
      transform: none !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      width: 794px !important;
      min-height: 1123px !important;
      height: auto !important;
      max-height: none !important;
    }
  </style>
</head>
<body style="display: flex; justify-content: center; align-items: flex-start; background: #ffffff; margin: 0; padding: 0;">
  ${clone.outerHTML}
</body>
</html>`

          const res = await window.api.exportResumeToPdf({
            html: fullHtml,
            defaultFileName: `${baseName}.pdf`
          })

          if (res.success) {
            setNotification({ type: 'success', message: `${baseName}.pdf exported successfully!` })
          } else if (res.canceled) {
            // User canceled the save dialog; do not trigger an error
          } else {
            setNotification({ type: 'error', message: `Export failed: ${res.error || 'Unknown error'}` })
          }
        } else {
          // Fallback simple print dialog for HTML document
          window.print()
          setNotification({ type: 'success', message: 'Print/PDF dialog opened.' })
        }
      } else if (format === 'doc') {
        exportToWordDocument(tailoredResume, tailoredResumeText, `${baseName}.doc`)
        setNotification({ type: 'success', message: `${baseName}.doc exported!` })
      } else if (format === 'md') {
        const text = tailoredResumeText || 'Tailored Resume Content'
        const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
        triggerFileDownload(blob, `${baseName}.md`)
        setNotification({ type: 'success', message: `${baseName}.md exported!` })
      } else if (format === 'txt') {
        const text = tailoredResumeText || 'Tailored Resume Content'
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
        triggerFileDownload(blob, `${baseName}.txt`)
        setNotification({ type: 'success', message: `${baseName}.txt exported!` })
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: `Export failed: ${err?.message || 'Unknown error'}` })
    }

    setTimeout(() => setNotification(null), 4000)
  }

  const handleSaveVersion = async (): Promise<void> => {
    setIsSaving(true)
    try {
      const {
        userId,
        currentResume,
        resumes,
        selectedResumeName,
        currentJob,
        currentJobId,
        tailoredResume,
        tailoredResumeText,
        postTailorLlmResult,
        llmResult,
        scrapedJob,
        currentLlmAnalysisId
      } = useAppStore.getState()

      const { supabase } = await import('../../../lib/supabase')
      if (!supabase) {
        throw new Error('Supabase client is not available')
      }

      // 1. Determine User ID
      let activeUserId = userId
      if (!activeUserId) {
        const { data: authData } = await supabase.auth.getUser()
        activeUserId = authData?.user?.id || null
      }

      if (!activeUserId) {
        throw new Error('User session not found. Please log in to save versions.')
      }

      // 2. Determine Base Resume ID
      const baseResume =
        currentResume ||
        resumes.find((r) => r.name === selectedResumeName) ||
        resumes[0]
      const baseResumeId = baseResume?.id || null

      if (!baseResumeId) {
        throw new Error('Base resume not found. Please select or upload a base resume first.')
      }

      // 3. Determine Target Job ID
      const activeJobId = currentJobId || currentJob?.id || null
      if (!activeJobId) {
        throw new Error('Target job not selected. Please select a target job description.')
      }

      // 4. Construct Version Name & Metadata
      const targetRole = scrapedJob?.jobTitle || currentJob?.title || 'Target Role'
      const baseName = baseResume.name ? baseResume.name.replace(/\.[^/.]+$/, '') : 'Resume'
      const versionName = `${baseName} — Tailored for ${targetRole}`

      const overallFit = postTailorLlmResult?.fitScore || llmResult?.fitScore || 85

      const payload = {
        user_id: activeUserId,
        resume_id: baseResumeId,
        job_id: activeJobId,
        name: versionName,
        raw_tailored_resume_data: tailoredResumeText || null,
        structured_output: (tailoredResume || {}) as any,
        tailored_based_on: {
          llmAnalysisId: currentLlmAnalysisId || null,
          targetRole,
          fitScore: overallFit,
          requirements: postTailorLlmResult?.requirements || llmResult?.requirements || [],
          savedAt: new Date().toISOString()
        } as any,
        fit_score: overallFit
      }

      // 5. Insert into Supabase public.tailored_resumes
      const { insertTailoredResume } = await import('../../../supabase_utils/tailoredResumes')
      const insertedRow = await insertTailoredResume(payload)

      // 6. Update link in llm_analysis if applicable
      if (currentLlmAnalysisId && insertedRow?.id) {
        try {
          await supabase
            .from('llm_analysis')
            .update({ tailor_resume_id: insertedRow.id } as any)
            .eq('id', currentLlmAnalysisId)
        } catch (updateErr) {
          Logger.warn('TailorResumeWorkspace.tsx', 'handleSaveVersion', 'Warning linking tailor_resume_id to llm_analysis', updateErr)
        }
      }

      setIsSaving(false)
      setSaveSuccess(true)
      setNotification({
        type: 'success',
        message: `Version saved to database: "${versionName}"`
      })

      setTimeout(() => {
        setSaveSuccess(false)
        setNotification(null)
      }, 4000)
    } catch (err: any) {
      Logger.error('TailorResumeWorkspace.tsx', 'handleSaveVersion', 'Failed to save tailored resume', err)
      setIsSaving(false)
      setNotification({
        type: 'error',
        message: err?.message || 'Failed to save tailored resume version to database.'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }
  }

  return (
    <main
      ref={workspaceContainerRef}
      className={`flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#0D0F0F]/60 backdrop-blur-md border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-100 dark:bg-[#080909]' : ''
      }`}
    >
      {/* ── Notification Banner ── */}
      {notification && (
        <div
          className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 text-xs px-4 py-2 rounded-xl flex items-center gap-2 border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 backdrop-blur-md'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300 backdrop-blur-md'
          }`}
        >
          {notification.type === 'success' ? (
            <FiCheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <FiAlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* ── 1. Resume Toolbar ── */}
      <ResumeToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        docViewType={docViewType}
        setDocViewType={setDocViewType}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onExport={handleExport}
        onSaveVersion={handleSaveVersion}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
      />

      {/* ── 2. Main Document Stage ── */}
      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        <ResumeDocumentContainer
          viewMode={viewMode}
          docViewType={docViewType}
        />
      </div>
    </main>
  )
}
