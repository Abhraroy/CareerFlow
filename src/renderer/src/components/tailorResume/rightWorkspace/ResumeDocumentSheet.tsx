import React from 'react'
import { useAppStore, TailorChangeDetail } from '../../../lib/zustandStore'
import { DEFAULT_PLACEHOLDER_RESUME } from '../../../utils/defaultResumeData'

export interface ResumeDocumentSheetProps {
  id?: string
  resumeDoc?: any
  tailoredResume?: any
  currentResume?: any
  template?: 'modern' | 'minimal' | 'classic'
  zoom?: number
  density?: 'standard' | 'compact' | 'ultra-compact'
  highlightChanges?: boolean
  onChangeClick?: (detail: TailorChangeDetail) => void
  containerClassName?: string
}

export function ResumeDocumentSheet({
  id = 'printable-resume-sheet',
  resumeDoc: propResumeDoc,
  tailoredResume: propTailoredResume,
  currentResume: propCurrentResume,
  template: propTemplate,
  zoom: propZoom,
  density: propDensity,
  highlightChanges = false,
  onChangeClick,
  containerClassName = ''
}: ResumeDocumentSheetProps): React.JSX.Element {
  const {
    tailoredResume: storeTailoredResume,
    currentResume: storeCurrentResume,
    canvasTemplate: storeCanvasTemplate,
    canvasZoom: storeCanvasZoom,
    setActiveChangeDetail,
    setIsChangeModalOpen
  } = useAppStore()

  const tailoredResume = propTailoredResume ?? storeTailoredResume
  const currentResume = propCurrentResume ?? storeCurrentResume
  const template = propTemplate ?? storeCanvasTemplate ?? 'classic'
  const zoom = propZoom ?? storeCanvasZoom ?? 1.0

  // 1. Resolve structured ResumeDocument if available
  const resumeDoc =
    propResumeDoc ??
    (tailoredResume && Array.isArray(tailoredResume.sections)
      ? tailoredResume
      : currentResume?.structuredData && Array.isArray((currentResume.structuredData as any).sections)
        ? (currentResume.structuredData as any)
        : null)

  const profile = (currentResume?.profileDetails as any) || {}
  const struct = (currentResume as any)?.structuredData || {}

  const docMeta = resumeDoc?.metadata || {}
  const docContactParts: string[] = []
  if (docMeta.email) docContactParts.push(docMeta.email)
  if (docMeta.phone) docContactParts.push(docMeta.phone)
  if (docMeta.location) docContactParts.push(docMeta.location)
  if (docMeta.linkedin) docContactParts.push(docMeta.linkedin)
  if (docMeta.github) docContactParts.push(docMeta.github)
  if (docMeta.portfolio) docContactParts.push(docMeta.portfolio)

  const candidateName =
    docMeta.name ||
    tailoredResume?.name ||
    (profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : struct?.name ||
        (currentResume?.name && currentResume.name !== 'Resume'
          ? currentResume.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
          : DEFAULT_PLACEHOLDER_RESUME.name))

  const candidateTitle =
    docMeta.title ||
    tailoredResume?.title ||
    profile?.headline ||
    struct?.title ||
    DEFAULT_PLACEHOLDER_RESUME.title

  const contactParts: string[] = []
  if (profile?.email) contactParts.push(profile.email)
  if (profile?.phone) contactParts.push(profile.phone)
  if (profile?.location) contactParts.push(profile.location)
  if (profile?.linkedin) contactParts.push(profile.linkedin)

  const contactInfo =
    (docContactParts.length > 0 ? docContactParts.join(' • ') : null) ||
    tailoredResume?.contact ||
    (contactParts.length > 0 ? contactParts.join(' • ') : struct?.contact || DEFAULT_PLACEHOLDER_RESUME.contact)

  const summary =
    tailoredResume?.summary ||
    profile?.summary ||
    struct?.summary ||
    DEFAULT_PLACEHOLDER_RESUME.summary

  const experienceList =
    tailoredResume?.experience && Array.isArray(tailoredResume.experience) && tailoredResume.experience.length > 0
      ? tailoredResume.experience
      : profile?.experience && Array.isArray(profile.experience) && profile.experience.length > 0
        ? profile.experience
        : struct?.experience && Array.isArray(struct.experience) && struct.experience.length > 0
          ? struct.experience
          : DEFAULT_PLACEHOLDER_RESUME.experience

  const skillsList =
    tailoredResume?.skills && Array.isArray(tailoredResume.skills) && tailoredResume.skills.length > 0
      ? tailoredResume.skills.flatMap((s: any) =>
          typeof s === 'string'
            ? [s]
            : s.items
              ? s.items.split(',').map((i: string) => i.trim())
              : [s.category || '']
        )
      : profile?.skills && Array.isArray(profile.skills) && profile.skills.length > 0
        ? profile.skills
        : struct?.skills && Array.isArray(struct.skills) && struct.skills.length > 0
          ? struct.skills.flatMap((s: any) =>
              typeof s === 'string'
                ? [s]
                : s.items
                  ? s.items.split(',').map((i: string) => i.trim())
                  : [s.category || '']
            )
          : DEFAULT_PLACEHOLDER_RESUME.skills.flatMap((s: any) => s.items.split(',').map((i: string) => i.trim()))

  // Density calculation to strictly fit standard A4 page (794x1123)
  const density = React.useMemo(() => {
    if (propDensity) return propDensity
    let totalLines = 0
    if (resumeDoc?.sections && Array.isArray(resumeDoc.sections)) {
      resumeDoc.sections.forEach((sec: any) => {
        totalLines += 1.5
        if (Array.isArray(sec.elements)) {
          sec.elements.forEach((el: any) => {
            const text = typeof el === 'string' ? el : el?.content || ''
            totalLines += Math.max(1, Math.ceil(text.length / 90))
          })
        }
      })
    } else {
      totalLines += Math.max(1, Math.ceil((summary || '').length / 90))
      experienceList.forEach((exp: any) => {
        totalLines += 2
        ;(exp.bullets || []).forEach((b: string) => {
          totalLines += Math.max(1, Math.ceil(b.length / 85))
        })
      })
      skillsList.forEach(() => {
        totalLines += 0.5
      })
    }
    if (totalLines > 38) return 'ultra-compact'
    if (totalLines > 26) return 'compact'
    return 'standard'
  }, [propDensity, resumeDoc, summary, experienceList, skillsList])

  const isUltraCompact = density === 'ultra-compact'
  const isCompact = density === 'compact' || isUltraCompact

  // ── Helper: Render Inline Diff with Green Word/Phrase Highlighting ──
  const renderInlineDiff = (
    content: string,
    changeInfo: {
      isChanged: boolean
      reason?: string
      before?: string
      after?: string
      matchedText?: string
      keywords?: string[]
    }
  ): React.ReactNode => {
    if (!highlightChanges || !changeInfo.isChanged) return content

    const targetText = changeInfo.after || content
    const beforeText = changeInfo.before

    // 1. If explicit matched keyword/phrase is provided
    if (changeInfo.matchedText && targetText.includes(changeInfo.matchedText)) {
      const parts = targetText.split(changeInfo.matchedText)
      return (
        <>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <mark className="bg-emerald-200 dark:bg-emerald-500/30 text-black dark:text-black font-semibold px-1 py-0.5 rounded shadow-xs">
                  {changeInfo.matchedText}
                </mark>
              )}
            </React.Fragment>
          ))}
        </>
      )
    }

    // 2. If keywords list provided (e.g. from JD keywords injection)
    if (changeInfo.keywords && changeInfo.keywords.length > 0) {
      const escaped = changeInfo.keywords
        .filter((k) => k && k.length > 1)
        .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      if (escaped.length > 0) {
        const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
        const parts = targetText.split(regex)
        const keywordSet = new Set(changeInfo.keywords.map((k) => k.toLowerCase()))
        return (
          <>
            {parts.map((part, i) => {
              if (keywordSet.has(part.toLowerCase())) {
                return (
                  <mark
                    key={i}
                    className="bg-emerald-200 dark:bg-emerald-500/30 text-black dark:text-black font-semibold px-1 py-0.5 rounded shadow-xs"
                  >
                    {part}
                  </mark>
                )
              }
              return part
            })}
          </>
        )
      }
    }

    // 3. Word-level diff comparison between before and after
    if (beforeText && beforeText.trim() && beforeText.trim() !== targetText.trim()) {
      const beforeWords = beforeText.trim().split(/\s+/)
      const afterWords = targetText.trim().split(/\s+/)

      let startMatch = 0
      while (
        startMatch < beforeWords.length &&
        startMatch < afterWords.length &&
        beforeWords[startMatch] === afterWords[startMatch]
      ) {
        startMatch++
      }

      let endBefore = beforeWords.length - 1
      let endAfter = afterWords.length - 1
      while (
        endBefore >= startMatch &&
        endAfter >= startMatch &&
        beforeWords[endBefore] === afterWords[endAfter]
      ) {
        endBefore--
        endAfter--
      }

      const prefix = afterWords.slice(0, startMatch).join(' ')
      const changed = afterWords.slice(startMatch, endAfter + 1).join(' ')
      const suffix = afterWords.slice(endAfter + 1).join(' ')

      if (changed) {
        return (
          <>
            {prefix ? prefix + ' ' : ''}
            <mark className="bg-emerald-200 dark:bg-emerald-500/30 text-black dark:text-black font-semibold px-1 py-0.5 rounded shadow-xs">
              {changed}
            </mark>
            {suffix ? ' ' + suffix : ''}
          </>
        )
      }
    }

    // 4. Fallback: if entire element is newly tailored / inserted
    return (
      <mark className="bg-emerald-200 dark:bg-emerald-500/30 text-black dark:text-black font-semibold px-1 py-0.5 rounded shadow-xs">
        {targetText}
      </mark>
    )
  }

  // ── Helper: Check if element / text is tailored / changed ─────────────
  const checkElementChange = React.useCallback(
    (
      elOrText: any,
      sectionTitle?: string
    ): {
      isChanged: boolean
      reason?: string
      before?: string
      after?: string
      matchedText?: string
      keywords?: string[]
    } => {
      if (!highlightChanges) return { isChanged: false }

      const content =
        typeof elOrText === 'string'
          ? elOrText
          : elOrText?.content || elOrText?.text || ''
      const elId = typeof elOrText === 'object' ? elOrText?.id : undefined
      const meta = typeof elOrText === 'object' ? elOrText?.metadata : undefined

      // 1. Explicit metadata in structured ResumeDocument
      if (meta?.tailored || meta?.insertedAfter || meta?.insertedBefore || meta?.editReason) {
        return {
          isChanged: true,
          reason: meta.editReason || 'Optimized for target job description',
          before: meta.originalContent,
          after: meta.newContent || content
        }
      }

      // 2. Matching tailoredResume.edits array
      if (tailoredResume?.edits && Array.isArray(tailoredResume.edits)) {
        const matchingEdit = tailoredResume.edits.find(
          (e: any) =>
            (elId && e.targetId === elId) ||
            (e.newContent && content && (content.includes(e.newContent) || e.newContent.includes(content)))
        )
        if (matchingEdit) {
          return {
            isChanged: true,
            reason: matchingEdit.reason || 'Tailored to match target requirements',
            before: matchingEdit.originalContent,
            after: matchingEdit.newContent || content,
            matchedText:
              matchingEdit.newContent && content.includes(matchingEdit.newContent)
                ? matchingEdit.newContent
                : undefined
          }
        }
      }

      // 3. Check against original resume content if available
      const origSummary = profile?.summary || struct?.summary
      if (sectionTitle?.toLowerCase().includes('summary') && origSummary && content !== origSummary) {
        return {
          isChanged: true,
          reason: 'Summary re-engineered with core job requirements and high-impact phrasing',
          before: origSummary,
          after: content
        }
      }

      return { isChanged: false }
    },
    [highlightChanges, tailoredResume, profile, struct]
  )

  const handleTriggerChangeModal = (
    changeInfo: { isChanged: boolean; reason?: string; before?: string; after?: string },
    title: string,
    section: string
  ): void => {
    if (!highlightChanges || !changeInfo.isChanged) return

    const detail: TailorChangeDetail = {
      id: `change-${Date.now()}`,
      sectionName: section,
      title: title,
      changesCount: 1,
      impactScore: '+8% Fit',
      impactBadge: 'High',
      summaryOfChange: changeInfo.reason || 'Content enhanced by AI tailoring model',
      beforeText: changeInfo.before || 'Original resume draft content',
      afterText: changeInfo.after || 'AI-optimized tailored version',
      keyImprovements: [
        'Aligned with extracted job requirements',
        'Enhanced action verbs and quantified impact',
        'Injected high-priority ATS keywords'
      ],
      atsKeywordGains: ['Job Alignment', 'Keyword Density', 'Readability']
    }

    if (onChangeClick) {
      onChangeClick(detail)
    } else {
      setActiveChangeDetail(detail)
      setIsChangeModalOpen(true)
    }
  }

  // ── Render Structured ResumeDocument Sections ───────────────────────────
  const renderResumeDocumentSections = (): React.JSX.Element => {
    if (!resumeDoc || !Array.isArray(resumeDoc.sections)) {
      return <></>
    }

    return (
      <>
        {resumeDoc.sections.map((sec: any, sIdx: number) => {
          if (!sec) return null
          const elements: any[] = Array.isArray(sec.elements) ? sec.elements : []
          const title: string = sec.title || 'Section'

          return (
            <div key={sec.id || sIdx} className={`flex flex-col ${isUltraCompact ? 'gap-1' : isCompact ? 'gap-1.5' : 'gap-2'}`}>
              {/* Section Title */}
              {template === 'modern' ? (
                <div className="flex items-center gap-1.5 border-b border-emerald-500/20 pb-0.5">
                  <span className={`${isUltraCompact ? 'w-2 h-2' : 'w-2.5 h-2.5'} bg-emerald-500 rounded-xs`} />
                  <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-emerald-950 font-sans`}>
                    {title}
                  </h2>
                </div>
              ) : template === 'minimal' ? (
                <h2 className={`${isUltraCompact ? 'text-[10px]' : isCompact ? 'text-[10.5px]' : 'text-[11px]'} font-mono font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-0.5`}>
                  {title}
                </h2>
              ) : (
                <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 font-serif`}>
                  {title}
                </h2>
              )}

              {/* Elements */}
              <div
                className={`flex flex-col ${
                  template === 'modern'
                    ? isUltraCompact
                      ? 'gap-0.5 pl-2 border-l-2 border-emerald-500/20'
                      : isCompact
                        ? 'gap-1 pl-2.5 border-l-2 border-emerald-500/20'
                        : 'gap-1.5 pl-3 border-l-2 border-emerald-500/20'
                    : isUltraCompact
                      ? 'gap-0.5'
                      : 'gap-1'
                }`}
              >
                {elements.map((el: any, eIdx: number) => {
                  const content: string = typeof el === 'string' ? el : el?.content || ''
                  if (!content) return null

                  const isHeaderEntry =
                    el.type === 'experience' ||
                    el.type === 'education' ||
                    el.type === 'project' ||
                    el.type === 'heading' ||
                    el.type === 'entry' ||
                    /(?:experience|project|education)_[0-9]+$/.test(el.id || '')

                  const changeInfo = checkElementChange(el, title)

                  if (isHeaderEntry) {
                    return (
                      <div
                        key={el.id || eIdx}
                        className={`${isUltraCompact ? 'pt-1 pb-0' : isCompact ? 'pt-1.5 pb-0.5' : 'pt-2 pb-0.5'} first:pt-0 ${
                          changeInfo.isChanged ? 'cursor-pointer group/hdr' : ''
                        }`}
                        onClick={() =>
                          changeInfo.isChanged &&
                          handleTriggerChangeModal(changeInfo, `Optimized: ${content}`, title)
                        }
                      >
                        {template === 'modern' ? (
                          <strong
                            className={`${isUltraCompact ? 'text-[11.5px]' : isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold text-neutral-900`}
                          >
                            {renderInlineDiff(content, changeInfo)}
                          </strong>
                        ) : template === 'minimal' ? (
                          <strong
                            className={`${isUltraCompact ? 'text-[10.5px]' : 'text-xs'} font-semibold font-sans text-zinc-900`}
                          >
                            {renderInlineDiff(content, changeInfo)}
                          </strong>
                        ) : (
                          <strong
                            className={`${isUltraCompact ? 'text-[11.5px]' : isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold font-serif text-slate-900`}
                          >
                            {renderInlineDiff(content, changeInfo)}
                          </strong>
                        )}
                      </div>
                    )
                  }

                  // Bullet point element
                  const colonIdx = content.indexOf(':')
                  const hasCategoryPrefix =
                    colonIdx > 0 &&
                    colonIdx < 35 &&
                    !content.slice(0, colonIdx).includes('.') &&
                    (sec.type === 'skills' ||
                      sec.id?.includes('skills') ||
                      content.startsWith('Relevant Coursework:') ||
                      content.startsWith('CGPA:') ||
                      content.startsWith('GPA:') ||
                      content.startsWith('Marks:') ||
                      content.startsWith('Percentage:') ||
                      content.startsWith('Grade:'))

                  return (
                    <div
                      key={el.id || eIdx}
                      onClick={() =>
                        changeInfo.isChanged &&
                        handleTriggerChangeModal(changeInfo, `Optimized Bullet in ${title}`, title)
                      }
                      className={`${
                        isUltraCompact
                          ? 'leading-snug text-[10.5px] gap-1'
                          : isCompact
                            ? 'leading-normal text-[11px] gap-1.5'
                            : 'leading-relaxed text-xs gap-2'
                      } flex items-start transition-all ${
                        changeInfo.isChanged ? 'cursor-pointer group/bullet' : ''
                      }`}
                      title={changeInfo.isChanged ? `Tailored: ${changeInfo.reason} (Click for details)` : undefined}
                    >
                      {template === 'modern' ? (
                        <span
                          className={`font-bold flex-shrink-0 text-xs leading-none mt-0.5 ${
                            changeInfo.isChanged ? 'text-emerald-600' : 'text-emerald-500'
                          }`}
                        >
                          ›
                        </span>
                      ) : template === 'minimal' ? (
                        <span
                          className={`font-mono flex-shrink-0 text-[10px] ${
                            changeInfo.isChanged ? 'text-emerald-600 font-bold' : 'text-zinc-400'
                          }`}
                        >
                          —
                        </span>
                      ) : (
                        <span
                          className={`flex-shrink-0 leading-none mt-1 font-bold text-[9px] ${
                            changeInfo.isChanged ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          •
                        </span>
                      )}

                      <span
                        className={
                          template === 'minimal' ? 'text-zinc-600' : 'text-slate-700'
                        }
                      >
                        {hasCategoryPrefix ? (
                          <>
                            <strong className="font-semibold text-slate-900">
                              {content.slice(0, colonIdx + 1)}
                            </strong>{' '}
                            {renderInlineDiff(content.slice(colonIdx + 1).trim(), changeInfo)}
                          </>
                        ) : (
                          renderInlineDiff(content, changeInfo)
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </>
    )
  }

  // ── Render Fallback Resume Data ─────────────────────────────────────────
  const summaryChange = checkElementChange(summary, 'Professional Summary')

  const renderFallbackContent = (tmpl: 'modern' | 'minimal' | 'classic'): React.JSX.Element => {
    return (
      <>
        {/* Professional Summary */}
        <div className="flex flex-col gap-1">
          {tmpl === 'modern' ? (
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-0.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-emerald-950`}>
                Professional Summary
              </h2>
            </div>
          ) : tmpl === 'minimal' ? (
            <h2 className={`${isUltraCompact ? 'text-[10px]' : isCompact ? 'text-[10.5px]' : 'text-[11px]'} font-mono font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-0.5`}>
              Professional Summary
            </h2>
          ) : (
            <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 font-serif`}>
              Professional Summary
            </h2>
          )}

          <p
            onClick={() =>
              summaryChange.isChanged &&
              handleTriggerChangeModal(summaryChange, 'Tailored Professional Summary', 'Professional Summary')
            }
            className={`${isUltraCompact ? 'text-[11px]' : isCompact ? 'text-[12px]' : 'text-[13px]'} leading-relaxed ${
              tmpl === 'minimal'
                ? 'text-zinc-600 font-sans'
                : 'text-slate-700 font-sans'
            } ${summaryChange.isChanged ? 'cursor-pointer' : ''}`}
            title={summaryChange.isChanged ? 'Tailored Summary (Click for impact breakdown)' : undefined}
          >
            {renderInlineDiff(summary, summaryChange)}
          </p>
        </div>

        {/* Professional Experience */}
        <div className={`flex flex-col ${isUltraCompact ? 'gap-2' : isCompact ? 'gap-2.5' : 'gap-3'}`}>
          {tmpl === 'modern' ? (
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-0.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-emerald-950`}>
                Professional Experience
              </h2>
            </div>
          ) : tmpl === 'minimal' ? (
            <h2 className={`${isUltraCompact ? 'text-[10px]' : isCompact ? 'text-[10.5px]' : 'text-[11px]'} font-mono font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-0.5`}>
              Experience
            </h2>
          ) : (
            <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 font-serif`}>
              Professional Experience
            </h2>
          )}

          <div className={`flex flex-col ${isUltraCompact ? 'gap-2.5' : isCompact ? 'gap-3' : 'gap-4'}`}>
            {experienceList.map((exp: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <strong
                      className={`${isUltraCompact ? 'text-[11.5px]' : isCompact ? 'text-[12px]' : 'text-[13px]'} font-bold ${
                        tmpl === 'minimal' ? 'text-zinc-900 font-sans' : tmpl === 'modern' ? 'text-neutral-900' : 'text-slate-900'
                      }`}
                    >
                      {exp.role}
                    </strong>
                    <span className={tmpl === 'modern' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}>
                      {' '}
                      — {exp.company}
                    </span>
                  </div>
                  <span className="text-slate-500 font-medium text-[10.5px] font-mono">{exp.period}</span>
                </div>

                {exp.bullets && Array.isArray(exp.bullets) && (
                  <ul
                    className={`list-none space-y-1 ${
                      isUltraCompact ? 'text-[10.5px] leading-snug' : isCompact ? 'text-[11px] leading-normal' : 'text-xs leading-relaxed'
                    } mt-0.5`}
                  >
                    {exp.bullets.map((bullet: string, bIdx: number) => {
                      const bChange = checkElementChange(bullet, 'Professional Experience')

                      return (
                        <li
                          key={bIdx}
                          onClick={() =>
                            bChange.isChanged &&
                            handleTriggerChangeModal(bChange, `Tailored Experience Bullet (${exp.company})`, 'Experience')
                          }
                          className={`flex items-start gap-1.5 transition-colors ${
                            bChange.isChanged ? 'cursor-pointer group/bullet' : ''
                          }`}
                          title={bChange.isChanged ? `Tailored: ${bChange.reason} (Click for details)` : undefined}
                        >
                          <span
                            className={`flex-shrink-0 leading-none mt-1 font-bold ${
                              bChange.isChanged
                                ? 'text-emerald-700'
                                : tmpl === 'modern'
                                  ? 'text-emerald-500 text-xs mt-0.5'
                                  : tmpl === 'minimal'
                                    ? 'text-zinc-400 font-mono text-[10px]'
                                    : 'text-slate-800 text-[9px]'
                            }`}
                          >
                            {tmpl === 'modern' ? '›' : tmpl === 'minimal' ? '—' : '•'}
                          </span>

                          <span
                            className={
                              tmpl === 'minimal' ? 'text-zinc-600' : 'text-slate-700'
                            }
                          >
                            {renderInlineDiff(bullet, bChange)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Skills */}
        <div className="flex flex-col gap-1.5">
          {tmpl === 'modern' ? (
            <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-0.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
              <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-emerald-950`}>
                Technical Skills
              </h2>
            </div>
          ) : tmpl === 'minimal' ? (
            <h2 className={`${isUltraCompact ? 'text-[10px]' : isCompact ? 'text-[10.5px]' : 'text-[11px]'} font-mono font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-200 pb-0.5`}>
              Skills
            </h2>
          ) : (
            <h2 className={`${isUltraCompact ? 'text-[10.5px]' : isCompact ? 'text-[11px]' : 'text-xs'} font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 font-serif`}>
              Technical Skills
            </h2>
          )}

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {skillsList.map((skill: string, sIdx: number) => {
              const sChange = checkElementChange(skill, 'Technical Skills')

              return (
                <span
                  key={sIdx}
                  onClick={() =>
                    sChange.isChanged &&
                    handleTriggerChangeModal(sChange, `Target ATS Keyword: ${skill}`, 'Technical Skills')
                  }
                  className={`px-2 py-0.5 rounded transition-all ${
                    sChange.isChanged
                      ? 'bg-emerald-200 text-emerald-950 font-bold shadow-xs cursor-pointer hover:bg-emerald-300'
                      : tmpl === 'modern'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold'
                        : tmpl === 'minimal'
                          ? 'bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[11px]'
                          : 'bg-slate-100 border border-slate-200 text-slate-800 font-medium text-xs'
                  } ${isUltraCompact ? 'text-[10px]' : 'text-xs'}`}
                  title={sChange.isChanged ? `ATS Keyword added for JD alignment: ${skill}` : undefined}
                >
                  {skill}
                </span>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  // ── Template Layouts ───────────────────────────────────────────────────
  return (
    <div className={`flex flex-col items-center justify-start ${containerClassName}`}>
      {template === 'modern' ? (
        /* Modern Tech Template */
        <div
          id={id}
          className={`w-[794px] min-h-[1123px] h-auto bg-white text-[#1a1a1a] shadow-2xl rounded-sm ${
            isUltraCompact ? 'p-7 pb-10' : isCompact ? 'p-9 pb-12' : 'p-12 pb-16'
          } transition-all duration-300 ease-out origin-top border border-neutral-200 select-text flex flex-col relative`}
          style={{
            transform: `scale(${zoom})`,
            marginBottom: `${Math.max(0, (zoom - 1) * 600)}px`
          }}
        >
          {/* Top Emerald Gradient Stripe */}
          <div
            className={`h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 ${
              isUltraCompact ? '-mx-7 -mt-7 mb-4' : isCompact ? '-mx-9 -mt-9 mb-5' : '-mx-12 -mt-12 mb-8'
            } rounded-t-sm`}
          />

          <div className={`flex flex-col ${isUltraCompact ? 'gap-3' : isCompact ? 'gap-4' : 'gap-6'}`}>
            {/* Header: Left Aligned Modern */}
            <div className={`flex flex-col gap-1 ${isUltraCompact ? 'pb-2' : isCompact ? 'pb-3' : 'pb-4'} border-b-2 border-emerald-500/20`}>
              <h1 className={`${isUltraCompact ? 'text-2xl' : isCompact ? 'text-[26px]' : 'text-3xl'} font-extrabold tracking-tight text-neutral-950 uppercase font-sans`}>
                {candidateName}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`${isUltraCompact ? 'text-xs' : 'text-sm'} font-bold text-emerald-700 tracking-wide`}>
                  {candidateTitle}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 font-mono tracking-tight">{contactInfo}</p>
            </div>

            {/* Content Sections */}
            {resumeDoc ? renderResumeDocumentSections() : renderFallbackContent('modern')}
          </div>
        </div>
      ) : template === 'minimal' ? (
        /* Minimalist Template */
        <div
          id={id}
          className={`w-[794px] min-h-[1123px] h-auto bg-white text-[#222] shadow-2xl rounded-sm ${
            isUltraCompact ? 'p-7 pb-10' : isCompact ? 'p-9 pb-12' : 'p-12 pb-16'
          } transition-all duration-300 ease-out origin-top border border-zinc-200 select-text flex flex-col`}
          style={{
            transform: `scale(${zoom})`,
            marginBottom: `${Math.max(0, (zoom - 1) * 600)}px`
          }}
        >
          <div className={`flex flex-col ${isUltraCompact ? 'gap-2.5' : isCompact ? 'gap-3.5' : 'gap-5'}`}>
            {/* Header: Minimal Monochrome */}
            <div className={`${isUltraCompact ? 'pb-2' : isCompact ? 'pb-2.5' : 'pb-3'} border-b border-zinc-200`}>
              <h1 className={`${isUltraCompact ? 'text-xl' : isCompact ? 'text-[22px]' : 'text-2xl'} font-light tracking-tight text-zinc-900 uppercase font-sans`}>
                {candidateName}
              </h1>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                {candidateTitle}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{contactInfo}</p>
            </div>

            {/* Content Sections */}
            {resumeDoc ? renderResumeDocumentSections() : renderFallbackContent('minimal')}
          </div>
        </div>
      ) : (
        /* Classic ATS Template (Default) */
        <div
          id={id}
          className={`w-[794px] min-h-[1123px] h-auto bg-white text-[#1a1a1a] shadow-2xl rounded-sm ${
            isUltraCompact ? 'p-7 pb-10' : isCompact ? 'p-9 pb-12' : 'p-12 pb-16'
          } transition-all duration-300 ease-out origin-top border border-neutral-200 select-text flex flex-col`}
          style={{
            transform: `scale(${zoom})`,
            marginBottom: `${Math.max(0, (zoom - 1) * 600)}px`
          }}
        >
          <div className={`flex flex-col ${isUltraCompact ? 'gap-3' : isCompact ? 'gap-4' : 'gap-6'}`}>
            {/* Header: Centered Classic ATS */}
            <div className={`text-center ${isUltraCompact ? 'pb-2.5' : isCompact ? 'pb-3' : 'pb-4'} border-b-2 border-slate-300`}>
              <h1 className={`${isUltraCompact ? 'text-xl' : isCompact ? 'text-[22px]' : 'text-2xl'} font-bold tracking-normal text-slate-900 uppercase font-serif`}>
                {candidateName}
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 mt-0.5">
                {candidateTitle}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-mono tracking-tight">{contactInfo}</p>
            </div>

            {/* Content Sections */}
            {resumeDoc ? renderResumeDocumentSections() : renderFallbackContent('classic')}
          </div>
        </div>
      )}
    </div>
  )
}
