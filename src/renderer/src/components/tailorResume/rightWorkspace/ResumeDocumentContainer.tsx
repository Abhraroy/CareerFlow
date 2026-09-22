import React from 'react'
import { FiRefreshCw } from '@/components/icons'
import { useAppStore } from '../../../lib/zustandStore'
import { useTailoring } from '../../../utils/useTailoring'
import { DEFAULT_PLACEHOLDER_RESUME } from '../../../utils/defaultResumeData'
import { ViewMode, DocumentViewType } from './ResumeToolbar'
import { ResumeChangesView } from './ResumeChangesView'
import { ATSInsightsView } from './ATSInsightsView'
import { RequirementResolutionForm } from '../RequirementResolutionForm'
import { ResumeDocumentSheet } from './ResumeDocumentSheet'

interface ResumeDocumentContainerProps {
  viewMode: ViewMode
  docViewType: DocumentViewType
}

function formatResumeToText(tailoredResume: any, currentResume: any): string {
  // 1. Check if tailoredResume or currentResume is a structured ResumeDocument (sections array)
  const doc =
    tailoredResume && Array.isArray(tailoredResume.sections)
      ? tailoredResume
      : currentResume?.structuredData && Array.isArray((currentResume.structuredData as any).sections)
        ? (currentResume.structuredData as any)
        : null

  if (doc) {
    const lines: string[] = []
    const meta = doc.metadata || {}
    if (meta.name) lines.push(meta.name.toUpperCase())

    const contactParts: string[] = []
    if (meta.email) contactParts.push(meta.email)
    if (meta.phone) contactParts.push(meta.phone)
    if (meta.location) contactParts.push(meta.location)
    if (meta.linkedin) contactParts.push(meta.linkedin)
    if (meta.github) contactParts.push(meta.github)
    if (meta.portfolio) contactParts.push(meta.portfolio)
    if (contactParts.length > 0) lines.push(contactParts.join(' • '))
    lines.push('')

    doc.sections.forEach((sec: any) => {
      if (!sec) return
      if (sec.title) {
        lines.push(sec.title.toUpperCase())
      }
      if (Array.isArray(sec.elements)) {
        sec.elements.forEach((el: any) => {
          const content = typeof el === 'string' ? el : el?.content
          if (!content || typeof content !== 'string') return

          const isHeader =
            el.type === 'experience' ||
            el.type === 'education' ||
            el.type === 'project' ||
            el.type === 'heading' ||
            /(?:experience|project|education)_[0-9]+$/.test(el.id || '')

          if (isHeader) {
            lines.push('')
            lines.push(content)
          } else {
            lines.push(`• ${content}`)
          }
        })
      }
      lines.push('')
    })
    return lines.join('\n').trim()
  }

  // 2. Fallback to legacy tailoredResume format
  if (tailoredResume && typeof tailoredResume === 'object') {
    const lines: string[] = []
    if (tailoredResume.name) lines.push(tailoredResume.name.toUpperCase())
    if (tailoredResume.title) lines.push(tailoredResume.title)
    if (tailoredResume.contact) lines.push(tailoredResume.contact)
    lines.push('')
    if (tailoredResume.summary) {
      lines.push('PROFESSIONAL SUMMARY')
      lines.push(tailoredResume.summary)
      lines.push('')
    }
    if (tailoredResume.skills && Array.isArray(tailoredResume.skills) && tailoredResume.skills.length > 0) {
      lines.push('TECHNICAL SKILLS')
      tailoredResume.skills.forEach((s: any) => {
        if (typeof s === 'string') lines.push(`• ${s}`)
        else if (s.category && s.items) lines.push(`• ${s.category}: ${s.items}`)
      })
      lines.push('')
    }
    if (tailoredResume.experience && Array.isArray(tailoredResume.experience) && tailoredResume.experience.length > 0) {
      lines.push('PROFESSIONAL EXPERIENCE')
      tailoredResume.experience.forEach((exp: any) => {
        lines.push(`${exp.role || ''} | ${exp.company || ''} | ${exp.period || ''}`)
        if (exp.bullets && Array.isArray(exp.bullets)) {
          exp.bullets.forEach((b: string) => lines.push(`• ${b}`))
        }
        lines.push('')
      })
    }
    return lines.join('\n').trim()
  }

  // 3. Fallback to profile / currentResume
  const profile = (currentResume?.profileDetails as any) || {}
  const struct = (currentResume?.structuredData as any) || {}

  const lines: string[] = []
  const name = (
    profile.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : (struct.name || currentResume?.name || DEFAULT_PLACEHOLDER_RESUME.name).replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
  ).toUpperCase()

  if (name) lines.push(name)

  const title = profile.headline || struct.title || DEFAULT_PLACEHOLDER_RESUME.title
  if (title) lines.push(title)

  const contactParts: string[] = []
  if (profile.email) contactParts.push(profile.email)
  if (profile.phone) contactParts.push(profile.phone)
  if (profile.location) contactParts.push(profile.location)
  if (profile.linkedin) contactParts.push(profile.linkedin)
  const contact = contactParts.length > 0 ? contactParts.join(' • ') : (struct.contact || DEFAULT_PLACEHOLDER_RESUME.contact)
  if (contact) lines.push(contact)

  lines.push('')

  const summary = profile.summary || struct.summary || DEFAULT_PLACEHOLDER_RESUME.summary
  if (summary) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(summary)
    lines.push('')
  }

  const skills = (profile.skills && profile.skills.length > 0) ? profile.skills : (struct.skills && struct.skills.length > 0) ? struct.skills : DEFAULT_PLACEHOLDER_RESUME.skills
  if (skills && Array.isArray(skills) && skills.length > 0) {
    lines.push('TECHNICAL SKILLS')
    skills.forEach((s: any) => {
      if (typeof s === 'string') lines.push(`• ${s}`)
      else if (s.category && s.items) lines.push(`• ${s.category}: ${s.items}`)
    })
    lines.push('')
  }

  const experience = (profile.experience && profile.experience.length > 0) ? profile.experience : (struct.experience && struct.experience.length > 0) ? struct.experience : DEFAULT_PLACEHOLDER_RESUME.experience
  if (experience && Array.isArray(experience) && experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE')
    experience.forEach((exp: any) => {
      const header = [exp.role || exp.title, exp.company, exp.period || exp.duration].filter(Boolean).join(' | ')
      if (header) lines.push(header)
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((b: string) => lines.push(`• ${b}`))
      } else if (exp.description) {
        lines.push(`• ${exp.description}`)
      }
      lines.push('')
    })
  }

  return lines.join('\n').trim()
}

export function ResumeDocumentContainer({
  viewMode,
  docViewType
}: ResumeDocumentContainerProps): React.JSX.Element {
  const {
    tailoringStatus,
    tailoredResumeText,
    setTailoredResumeText,
    tailoredResume,
    setTailoredResume,
    currentResume
  } = useAppStore()

  const { isProcessing, tailoringProgress, currentStepLabel } = useTailoring()

  // Update tailoredResumeText dynamically when currentResume or tailoredResume changes
  React.useEffect(() => {
    const formattedText = formatResumeToText(tailoredResume, currentResume)
    if (formattedText) setTailoredResumeText(formattedText)
  }, [currentResume, tailoredResume, setTailoredResumeText])

  const handleMarkdownTextChange = (newText: string): void => {
    setTailoredResumeText(newText)
    // Parse Markdown text on the fly to update structured tailoredResume state
    if (newText) {
      const lines = newText.split('\n').map((l) => l.trim())
      let parsedName = ''
      let parsedTitle = ''
      let parsedContact = ''

      lines.forEach((line, i) => {
        if (!line) return
        if (i === 0 && !parsedName) {
          parsedName = line.replace(/^[#\s]+/, '').trim()
        } else if ((line.includes('@') || line.includes('•') || line.includes('+')) && !parsedContact) {
          parsedContact = line
        } else if (!parsedTitle && i < 4 && !line.includes('@')) {
          parsedTitle = line
        }
      })

      if (parsedName) {
        setTailoredResume((prev: any) => ({
          ...(prev || {}),
          name: parsedName,
          title: parsedTitle || prev?.title,
          contact: parsedContact || prev?.contact
        }))
      }
    }
  }

  // 1. Requirement Resolution Form Phase
  if (tailoringStatus === 'resolving_requirements') {
    return (
      <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center bg-transparent transition-colors duration-200">
        <RequirementResolutionForm />
      </div>
    )
  }

  // 2. Processing / Loading State with Document Skeleton
  if (isProcessing) {
    return (
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center relative overflow-hidden p-6 select-none bg-transparent transition-colors duration-200">
        {/* Pulsing Document Skeleton Backdrop */}
        <div className="absolute inset-0 flex flex-col gap-4 opacity-10 animate-pulse pointer-events-none max-w-2xl mx-auto w-full p-8">
          <div className="flex flex-col items-center gap-2 border-b border-slate-300 dark:border-white pb-4">
            <div className="h-6 bg-slate-400 dark:bg-white rounded-md w-56" />
            <div className="h-3.5 bg-slate-400 dark:bg-white rounded w-72 mt-1" />
            <div className="h-3 bg-slate-400 dark:bg-white rounded w-96 mt-1" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-400 dark:bg-white rounded w-36" />
            <div className="h-2.5 bg-slate-400 dark:bg-white rounded w-full" />
            <div className="h-2.5 bg-slate-400 dark:bg-white rounded w-11/12" />
          </div>
          <div className="space-y-3">
            <div className="h-3.5 bg-slate-400 dark:bg-white rounded w-44" />
            <div className="h-2.5 bg-slate-400 dark:bg-white rounded w-full" />
            <div className="h-2.5 bg-slate-400 dark:bg-white rounded w-5/6" />
          </div>
        </div>

        {/* Centered Modern Progress Card */}
        <div className="relative z-10 bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/10 p-8 rounded-3xl max-w-md w-full flex flex-col items-center text-center shadow-xl dark:shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10">
            <FiRefreshCw className="w-6 h-6 animate-spin text-emerald-500 dark:text-emerald-400" />
          </div>

          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-2 border border-emerald-300 dark:border-emerald-500/30">
            {currentStepLabel || 'Optimizing'}
          </span>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            Tailoring Resume for Job Description
          </h3>

          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
            Extracting core requirements, mapping bullet points with impact metrics, and aligning ATS structure.
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-neutral-900 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.06] my-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${tailoringProgress}%` }}
            />
          </div>

          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {tailoringProgress}% Completed
          </div>
        </div>
      </div>
    )
  }

  // 3. View Mode: Changes Tab
  if (viewMode === 'changes') {
    return <ResumeChangesView />
  }

  // 4. View Mode: ATS Insights Tab
  if (viewMode === 'ats') {
    return <ATSInsightsView />
  }

  // 5. View Mode: Preview Tab (Markdown Editor Mode)
  if (docViewType === 'markdown') {
    return (
      <div className="w-full h-full p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 px-1">
          <span className="font-semibold text-slate-700 dark:text-neutral-300">Markdown Resume Editor</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Direct Markdown View</span>
        </div>
        <textarea
          value={tailoredResumeText}
          onChange={(e) => handleMarkdownTextChange(e.target.value)}
          className="flex-1 w-full bg-white dark:bg-[#080909] border border-slate-200 dark:border-white/[0.06] focus:border-emerald-500/40 rounded-xl p-5 text-xs font-mono text-slate-900 dark:text-neutral-200 leading-relaxed outline-none resize-none custom-scrollbar shadow-xs"
          placeholder="Resume content will appear here..."
        />
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-auto custom-scrollbar p-6 flex flex-col items-center justify-start bg-slate-100/90 dark:bg-[#050606]/50">
      <ResumeDocumentSheet highlightChanges={false} />
    </div>
  )
}

