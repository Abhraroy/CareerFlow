import React, { useMemo } from 'react'
import { Resume, StructuredResume } from '../../../types'

interface ResumeDocumentCanvasProps {
  resume: Resume
  zoomScale: number
  printRef?: React.RefObject<HTMLDivElement | null>
}

interface ParsedResumeDocument {
  name: string
  title: string
  contactInfo: string[]
  summary?: string
  skills?: string[]
  experience?: Array<{
    role: string
    company: string
    duration?: string
    location?: string
    description?: string
  }>
  education?: Array<{
    degree: string
    institution: string
    duration?: string
    grade?: string
  }>
  projects?: Array<{
    title: string
    description?: string
    technologies?: string
    link?: string
  }>
  awards?: string[]
  certifications?: Array<{
    name: string
    issuer?: string
    date?: string
  }>
  customSections?: Array<{
    title: string
    content: string
  }>
  rawText?: string
}

export function ResumeDocumentCanvas({
  resume,
  zoomScale,
  printRef
}: ResumeDocumentCanvasProps): React.JSX.Element {
  // Parse resume content from structuredData, profileDetails & rawResumeData
  const docData: ParsedResumeDocument = useMemo(() => {
    const rawStruct = resume.structuredData as any
    if (rawStruct && Array.isArray(rawStruct.sections)) {
      const meta = rawStruct.metadata || {}
      const fullName =
        meta.name ||
        resume.name
          .replace(/\.[^/.]+$/, '')
          .replace(/_/g, ' ')
          .replace(/—/g, '-')

      const contactParts: string[] = []
      if (meta.email) contactParts.push(meta.email)
      if (meta.phone) contactParts.push(meta.phone)
      if (meta.location) contactParts.push(meta.location)
      if (meta.linkedin) contactParts.push(meta.linkedin)
      if (meta.github) contactParts.push(meta.github)
      if (meta.portfolio) contactParts.push(meta.portfolio)

      return {
        name: fullName,
        title: meta.title || (resume.name.includes('—') ? resume.name.split('—')[1].trim() : 'Professional Resume'),
        contactInfo: contactParts.length > 0 ? contactParts : ['No contact information provided'],
        rawText: resume.rawResumeData || resume.uploadedData || ''
      }
    }

    const sData = (resume.structuredData || {}) as StructuredResume
    const profile = resume.profileDetails || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    }

    const firstName = sData.firstName || profile.firstName || ''
    const lastName = sData.lastName || profile.lastName || ''
    const fullName =
      firstName && lastName
        ? `${firstName} ${lastName}`.trim()
        : firstName ||
          lastName ||
          resume.name
            .replace(/\.[^/.]+$/, '')
            .replace(/_/g, ' ')
            .replace(/—/g, '-')

    const contactParts: string[] = []
    const email = sData.email || profile.email
    const phone = sData.phone || profile.phone
    const location = sData.location || profile.location
    const linkedin = sData.linkedin || profile.linkedin
    const github = sData.github || profile.github
    const portfolio = sData.portfolio || profile.portfolio

    if (email) contactParts.push(email)
    if (phone) contactParts.push(phone)
    if (location) contactParts.push(location)
    if (linkedin) contactParts.push(linkedin)
    if (github) contactParts.push(github)
    if (portfolio) contactParts.push(portfolio)

    const raw = resume.rawResumeData || resume.uploadedData || ''

    // Collect custom sections from structuredData extra keys or customFields
    const customSecs: Array<{ title: string; content: string }> = []
    if (profile.customFields && profile.customFields.length > 0) {
      profile.customFields.forEach((cf) => {
        customSecs.push({ title: cf.label, content: cf.value })
      })
    }

    // Check if extra properties exist on structuredData
    const standardKeys = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'location',
      'linkedin',
      'github',
      'portfolio',
      'summary',
      'skills',
      'experience',
      'education',
      'projects',
      'certifications',
      'awards',
      'languages',
      'publications'
    ]

    Object.keys(sData).forEach((key) => {
      if (!standardKeys.includes(key) && sData[key]) {
        const val = sData[key]
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val)
        const label = key.charAt(0).toUpperCase() + key.slice(1)
        if (!customSecs.some((c) => c.title.toLowerCase() === label.toLowerCase())) {
          customSecs.push({ title: label, content: strVal })
        }
      }
    })

    return {
      name: fullName,
      title: resume.name.includes('—') ? resume.name.split('—')[1].trim() : 'Professional Resume',
      contactInfo:
        contactParts.length > 0
          ? contactParts
          : ['contact@example.com', '(555) 019-2834', 'San Francisco, CA'],
      summary: sData.summary,
      skills: sData.skills,
      experience: sData.experience,
      education: sData.education,
      projects: sData.projects,
      awards: sData.awards,
      certifications: sData.certifications,
      customSections: customSecs,
      rawText: raw
    }
  }, [resume])

  const hasStructuredSections = Boolean(
    docData.summary ||
      (docData.skills && docData.skills.length > 0) ||
      (docData.experience && docData.experience.length > 0) ||
      (docData.education && docData.education.length > 0) ||
      (docData.projects && docData.projects.length > 0) ||
      (docData.awards && docData.awards.length > 0)
  )

  // Fallback block parser if only rawText exists
  const parsedRawBlocks = useMemo(() => {
    if (hasStructuredSections || !docData.rawText) return null

    const lines = docData.rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    const sections: { title: string; lines: string[] }[] = []
    let currentSection: { title: string; lines: string[] } | null = null

    const SECTION_HEADERS = [
      'PROFESSIONAL SUMMARY',
      'SUMMARY',
      'TECHNICAL SKILLS',
      'SKILLS',
      'CORE SKILLS',
      'CORE COMPETENCIES',
      'PROFESSIONAL EXPERIENCE',
      'EXPERIENCE',
      'WORK EXPERIENCE',
      'RELEVANT PROJECTS',
      'PROJECTS',
      'EDUCATION',
      'CERTIFICATIONS',
      'AWARDS'
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const upper = line.toUpperCase()

      const isHeader =
        SECTION_HEADERS.includes(upper) ||
        (upper.length < 35 && upper === line && !line.includes('•') && !line.includes('|') && i > 1)

      if (isHeader) {
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = { title: line, lines: [] }
      } else if (currentSection) {
        currentSection.lines.push(line)
      }
    }

    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }, [hasStructuredSections, docData.rawText])

  return (
    <div className="flex flex-col items-center justify-start w-full py-8 px-4">
      {/* Zoom transform container */}
      <div
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="w-[794px] shrink-0"
      >
        {/* Printable Realistic White Paper Sheet */}
        <div
          ref={printRef as any}
          className="w-[794px] min-h-[1123px] bg-[#ffffff] text-[#1f2937] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_1px_3px_rgba(0,0,0,0.2)] rounded-[3px] font-sans antialiased border border-neutral-200/40 relative select-text"
        >
          {/* Top Header */}
          <div className="border-b-2 border-neutral-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">
              {docData.name}
            </h1>
            <p className="text-sm font-semibold text-indigo-700 tracking-wide mt-0.5">
              {docData.title}
            </p>
            {docData.contactInfo.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-neutral-600 mt-2 font-normal">
                {docData.contactInfo.map((contact, i) => (
                  <React.Fragment key={i}>
                    <span>{contact}</span>
                    {i < docData.contactInfo.length - 1 && (
                      <span className="text-neutral-400 font-bold">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Structured Document Body */}
          {(resume.structuredData as any)?.sections && Array.isArray((resume.structuredData as any).sections) ? (
            <div className="space-y-5 text-[13px] leading-relaxed text-neutral-800">
              {((resume.structuredData as any).sections as any[]).map((sec, sIdx) => {
                const elements = Array.isArray(sec.elements) ? sec.elements : []
                return (
                  <div key={sec.id || sIdx} className="space-y-1.5">
                    <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                      {sec.title || 'Section'}
                    </h2>
                    <div className="space-y-1">
                      {elements.map((el: any, eIdx: number) => {
                        const content = typeof el === 'string' ? el : el?.content || ''
                        if (!content) return null

                        const isHeader =
                          el.type === 'experience' ||
                          el.type === 'education' ||
                          el.type === 'project' ||
                          el.type === 'heading' ||
                          el.type === 'entry' ||
                          /(?:experience|project|education)_[0-9]+$/.test(el.id || '')

                        if (isHeader) {
                          return (
                            <div key={el.id || eIdx} className="pt-2 pb-0.5 first:pt-0">
                              <strong className="text-[13px] font-bold text-neutral-900">{content}</strong>
                            </div>
                          )
                        }

                        const colonIdx = content.indexOf(':')
                        const hasCategory =
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
                            className="flex items-start gap-2 text-[12px] text-neutral-700 leading-relaxed"
                          >
                            <span className="text-neutral-700 font-bold leading-none mt-1">•</span>
                            <span>
                              {hasCategory ? (
                                <>
                                  <strong className="font-semibold text-neutral-900">
                                    {content.slice(0, colonIdx + 1)}
                                  </strong>{' '}
                                  {content.slice(colonIdx + 1).trim()}
                                </>
                              ) : (
                                content
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : hasStructuredSections ? (
            <div className="space-y-5 text-[13px] leading-relaxed text-neutral-800">
              {/* Summary */}
              {docData.summary && (
                <div className="space-y-1.5">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Professional Summary
                  </h2>
                  <p className="text-[12.5px] text-neutral-700 leading-normal">
                    {docData.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {docData.skills && docData.skills.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Technical Skills
                  </h2>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {docData.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[11.5px] text-neutral-800 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {docData.experience && docData.experience.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Professional Experience
                  </h2>
                  <div className="space-y-3 pl-0.5">
                    {docData.experience.map((exp, eIdx) => (
                      <div key={eIdx} className="space-y-1">
                        <div className="flex items-center justify-between font-semibold text-neutral-900 text-[13px]">
                          <span>
                            {exp.role}{' '}
                            <span className="text-neutral-500 font-normal">at</span>{' '}
                            <span className="text-indigo-800">{exp.company}</span>
                          </span>
                          <span className="text-neutral-500 text-[11.5px] font-medium">
                            {[exp.duration, exp.location].filter(Boolean).join(' | ')}
                          </span>
                        </div>
                        {exp.description && (
                          <div className="text-[12.5px] text-neutral-700 leading-normal pl-2 border-l-2 border-indigo-100">
                            {exp.description.split('\n').map((dLine, dIdx) => (
                              <p key={dIdx} className="mt-0.5">
                                {dLine}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {docData.projects && docData.projects.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Projects
                  </h2>
                  <div className="space-y-2.5 pl-0.5">
                    {docData.projects.map((proj, pIdx) => (
                      <div key={pIdx} className="space-y-0.5">
                        <div className="flex items-center justify-between font-semibold text-neutral-900 text-[12.5px]">
                          <span>{proj.title}</span>
                          {proj.technologies && (
                            <span className="text-neutral-500 text-[11px] font-normal">
                              {proj.technologies}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-[12px] text-neutral-700">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {docData.education && docData.education.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Education
                  </h2>
                  <div className="space-y-2 pl-0.5">
                    {docData.education.map((edu, eduIdx) => (
                      <div
                        key={eduIdx}
                        className="flex items-center justify-between text-[12.5px] text-neutral-800"
                      >
                        <div>
                          <span className="font-semibold text-neutral-900">{edu.degree}</span>
                          <span className="text-neutral-500"> — {edu.institution}</span>
                        </div>
                        <span className="text-neutral-500 text-[11.5px]">
                          {[edu.duration, edu.grade].filter(Boolean).join(' | ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {docData.awards && docData.awards.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Awards & Honors
                  </h2>
                  <div className="space-y-1 pl-2">
                    {docData.awards.map((award, aIdx) => (
                      <div key={aIdx} className="flex items-start gap-2 text-[12px] text-neutral-700">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{award}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Sections */}
              {docData.customSections && docData.customSections.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Additional Information
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    {docData.customSections.map((cs, i) => (
                      <div key={i} className="p-2 rounded bg-neutral-50 border border-neutral-200">
                        <span className="text-[11px] uppercase font-bold text-neutral-500 block mb-0.5">
                          {cs.title}
                        </span>
                        <span className="text-[12px] font-medium text-neutral-800">
                          {cs.content || 'Not specified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : parsedRawBlocks && parsedRawBlocks.length > 0 ? (
            <div className="space-y-5 text-[13px] leading-relaxed text-neutral-800">
              {parsedRawBlocks.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1 flex items-center gap-2">
                    <span>{sec.title}</span>
                  </h2>
                  <div className="space-y-1.5 pl-0.5">
                    {sec.lines.map((line, lIdx) => {
                      const isBullet =
                        line.startsWith('•') || line.startsWith('-') || line.startsWith('*')
                      const isJobHeader =
                        line.includes('|') || (line.includes('—') && line.length < 90)

                      if (isJobHeader) {
                        const parts = line.split(/[|—]/).map((p) => p.trim())
                        return (
                          <div
                            key={lIdx}
                            className="flex items-center justify-between font-semibold text-neutral-900 pt-1 text-[13px]"
                          >
                            <span>{parts[0]}</span>
                            <span className="text-neutral-600 text-[12px] font-medium">
                              {parts.slice(1).join(' | ')}
                            </span>
                          </div>
                        )
                      }

                      if (isBullet) {
                        return (
                          <div
                            key={lIdx}
                            className="flex items-start gap-2 pl-2 text-[12.5px] text-neutral-700"
                          >
                            <span className="text-indigo-600 font-bold leading-none mt-1.5">•</span>
                            <span className="flex-1">{line.replace(/^[•\-*]\s*/, '')}</span>
                          </div>
                        )
                      }

                      return (
                        <p key={lIdx} className="text-[12.5px] text-neutral-700 leading-normal">
                          {line}
                        </p>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback formatted display from profileDetails */
            <div className="space-y-5 text-[13px] text-neutral-800 leading-relaxed">
              <div className="space-y-1.5">
                <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-neutral-700 text-[12.5px]">
                  Experienced software professional with demonstrated track record in modern full-stack architectures, cloud scalability, and high-quality software engineering standards.
                </p>
              </div>

              {docData.customSections && docData.customSections.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-[13px] font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-300 pb-1">
                    Key Details & Qualifications
                  </h2>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {docData.customSections.map((cs, i) => (
                      <div key={i} className="p-2.5 rounded bg-neutral-50 border border-neutral-200">
                        <span className="text-[11px] uppercase font-bold text-neutral-500 block mb-0.5">
                          {cs.title}
                        </span>
                        <span className="text-[12.5px] font-medium text-neutral-800">
                          {cs.content || 'Not specified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
