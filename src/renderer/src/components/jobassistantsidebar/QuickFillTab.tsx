import React, { useState, useMemo } from 'react'
import { QuickFillTabProps } from './types'
import { StructuredResume } from '../../types'
import Logger from '@utils/logger'
import {
  formatResumeForCopy,
  formatExperienceItem,
  formatEducationItem,
  formatProjectItem,
  formatCertificationItem,
  formatPublicationItem
} from '../../utils/formatResumeData'
import {
  LuAward,
  LuBookOpen,
  LuBriefcase,
  LuCheck,
  LuCopy,
  LuExternalLink,
  LuFileText,
  LuFolderGit2,
  LuGithub,
  LuGlobe,
  LuGraduationCap,
  LuLanguages,
  LuLinkedin,
  LuMail,
  LuMapPin,
  LuPhone,
  LuSearch,
  LuSparkles,
  LuUser,
  LuX
} from '@/components/icons'

export function QuickFillTab({
  currentResumeForAssistant,
  copiedField,
  handleCopy,
  handleCopyAll
}: QuickFillTabProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('')
  const [localCopiedKey, setLocalCopiedKey] = useState<string | null>(null)

  const copyValue = (key: string, val: string) => {
    if (!val) return
    handleCopy(key, val)
    setLocalCopiedKey(key)
    setTimeout(() => setLocalCopiedKey(null), 1500)
  }

  const isCopied = (key: string) => copiedField === key || localCopiedKey === key

  // Extract structured resume data
  const structuredData: StructuredResume = useMemo(() => {
    if (!currentResumeForAssistant) return {}
    let s = currentResumeForAssistant.structuredData
    if (typeof s === 'string') {
      try {
        s = JSON.parse(s)
      } catch {
        s = {}
      }
    }
    return (s || {}) as StructuredResume
  }, [currentResumeForAssistant])

  const profile = currentResumeForAssistant?.profileDetails || {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: ''
  }

  const firstName = structuredData.firstName || profile.firstName || ''
  const lastName = structuredData.lastName || profile.lastName || ''
  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName || lastName || currentResumeForAssistant?.name || ''
  const email = structuredData.email || profile.email || ''
  const phone = structuredData.phone || profile.phone || ''
  const location = structuredData.location || profile.location || ''
  const linkedin = structuredData.linkedin || profile.linkedin || ''
  const github = structuredData.github || profile.github || ''
  const portfolio = structuredData.portfolio || profile.portfolio || ''
  const summary = structuredData.summary || ''
  const skills = Array.isArray(structuredData.skills) ? structuredData.skills : []
  const experience = Array.isArray(structuredData.experience) ? structuredData.experience : []
  const education = Array.isArray(structuredData.education) ? structuredData.education : []
  const projects = Array.isArray(structuredData.projects) ? structuredData.projects : []
  const certifications = Array.isArray(structuredData.certifications)
    ? structuredData.certifications
    : []
  const languages = Array.isArray(structuredData.languages) ? structuredData.languages : []
  const publications = Array.isArray(structuredData.publications)
    ? structuredData.publications
    : []
  const awards = Array.isArray(structuredData.awards) ? structuredData.awards : []

  // Custom fields & non-standard keys
  const customFields = useMemo(() => {
    const list: { id: string; label: string; value: string }[] = []
    if (profile.customFields && profile.customFields.length > 0) {
      list.push(...profile.customFields)
    }

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

    Object.keys(structuredData).forEach((key) => {
      if (!standardKeys.includes(key) && structuredData[key]) {
        const val = structuredData[key]
        const label = key.charAt(0).toUpperCase() + key.slice(1)
        if (!list.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
          list.push({
            id: `cf-${key}`,
            label,
            value: typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)
          })
        }
      }
    })

    return list
  }, [structuredData, profile.customFields])

  const query = searchTerm.trim().toLowerCase()
  const matchesSearch = (text?: string | null) => {
    if (!query) return true
    if (!text) return false
    return text.toLowerCase().includes(query)
  }

  const renderFieldRow = (
    label: string,
    key: string,
    value: string,
    icon?: React.ReactNode,
    linkUrl?: string
  ) => {
    if (!value && !matchesSearch(label)) return null
    if (query && !matchesSearch(label) && !matchesSearch(value)) return null

    const copied = isCopied(key)

    return (
      <div
        key={key}
        onClick={() => value && copyValue(key, value)}
        className={`group flex items-center justify-between gap-2.5 p-2 rounded-lg border transition-all select-none ${
          value ? 'cursor-pointer hover:bg-neutral-900/90 hover:border-neutral-800' : ''
        } ${copied ? 'border-emerald-500/50 bg-emerald-500/10' : 'bg-neutral-950/70 border-neutral-900'}`}
        title={value ? `Click to copy ${label}` : undefined}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
              copied
                ? 'text-emerald-400 bg-emerald-500/20'
                : 'text-neutral-500 bg-neutral-900 group-hover:text-neutral-300'
            }`}
          >
            {copied ? (
              <LuCheck className="w-3.5 h-3.5 animate-in zoom-in-50 duration-150" />
            ) : (
              icon || <LuCopy className="w-3 h-3" />
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              {label}
            </span>
            <span className="text-xs font-medium text-neutral-200 truncate" title={value}>
              {value || <span className="text-neutral-600 italic">Not set</span>}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {linkUrl && (
            <a
              href={linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Open Link"
            >
              <LuExternalLink className="w-3 h-3" />
            </a>
          )}
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                copyValue(key, value)
              }}
              className={`p-1 rounded transition-colors text-xs ${
                copied
                  ? 'text-emerald-400 bg-emerald-500/20'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-800'
              }`}
              title="Copy"
            >
              {copied ? <LuCheck className="w-3.5 h-3.5" /> : <LuCopy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
      {/* Quick Search Bar */}
      <div className="relative">
        <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search fields, skills, companies..."
          className="w-full pl-8 pr-7 py-2 bg-neutral-950 border border-neutral-900 rounded-lg text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-700"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            title="Clear search"
          >
            <LuX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* SECTION 1: PERSONAL & CONTACT INFO */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
            <LuUser className="w-3 h-3 text-neutral-400" />
            PERSONAL & CONTACT
          </span>
          {fullName && (
            <button
              onClick={() => copyValue('fullName', fullName)}
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('fullName')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy Full Name"
            >
              {isCopied('fullName') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>Name</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {renderFieldRow('Full Name', 'fullName', fullName, <LuUser className="w-3 h-3" />)}
          {firstName &&
            renderFieldRow('First Name', 'firstName', firstName, <LuUser className="w-3 h-3" />)}
          {lastName &&
            renderFieldRow('Last Name', 'lastName', lastName, <LuUser className="w-3 h-3" />)}
          {renderFieldRow('Email', 'email', email, <LuMail className="w-3 h-3" />)}
          {renderFieldRow('Phone', 'phone', phone, <LuPhone className="w-3 h-3" />)}
          {renderFieldRow('Location', 'location', location, <LuMapPin className="w-3 h-3" />)}
          {renderFieldRow(
            'LinkedIn',
            'linkedin',
            linkedin,
            <LuLinkedin className="w-3 h-3 text-sky-400" />,
            linkedin
          )}
          {renderFieldRow(
            'GitHub',
            'github',
            github,
            <LuGithub className="w-3 h-3 text-neutral-300" />,
            github
          )}
          {renderFieldRow(
            'Portfolio / Website',
            'portfolio',
            portfolio,
            <LuGlobe className="w-3 h-3 text-emerald-400" />,
            portfolio
          )}
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL SUMMARY */}
      {summary && matchesSearch(summary) && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuFileText className="w-3 h-3 text-neutral-400" />
              SUMMARY
            </span>
            <button
              onClick={() => copyValue('summary', summary)}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('summary')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy Summary"
            >
              {isCopied('summary') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('summary') ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div
            onClick={() => copyValue('summary', summary)}
            className={`p-2.5 rounded-lg border bg-neutral-950/70 cursor-pointer transition-all ${
              isCopied('summary')
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-neutral-900 hover:bg-neutral-900/90 hover:border-neutral-800'
            }`}
            title="Click to copy full summary"
          >
            <p className="text-xs text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: SKILLS */}
      {skills.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuSparkles className="w-3 h-3 text-amber-400" />
              SKILLS ({skills.length})
            </span>
            <button
              onClick={() => copyValue('skills-all', skills.join(', '))}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('skills-all')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all skills comma-separated"
            >
              {isCopied('skills-all') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('skills-all') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => {
              if (query && !matchesSearch(skill)) return null
              const skillKey = `skill-${idx}`
              const copied = isCopied(skillKey)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyValue(skillKey, skill)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-neutral-950/80 border-neutral-850 text-neutral-300 hover:text-white hover:bg-neutral-900 hover:border-neutral-700'
                  }`}
                  title={`Click to copy "${skill}"`}
                >
                  {copied && (
                    <LuCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0 animate-in zoom-in-50 duration-150" />
                  )}
                  <span>{skill}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: WORK EXPERIENCE */}
      {experience.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuBriefcase className="w-3 h-3 text-neutral-400" />
              WORK EXPERIENCE ({experience.length})
            </span>
            <button
              onClick={() =>
                copyValue(
                  'exp-all-entries',
                  experience.map((e) => formatExperienceItem(e)).join('\n\n')
                )
              }
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('exp-all-entries')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all work experience"
            >
              {isCopied('exp-all-entries') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('exp-all-entries') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {experience.map((exp, idx) => {
              const expKey = `exp-${idx}`
              const fullExpText = formatExperienceItem(exp)
              const isExpMatching =
                matchesSearch(exp.role) ||
                matchesSearch(exp.company) ||
                matchesSearch(exp.description) ||
                matchesSearch(exp.location)

              if (!isExpMatching) return null

              return (
                <div
                  key={idx}
                  className="bg-neutral-950/70 border border-neutral-900 rounded-lg p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-900 pb-1.5">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {exp.role || 'Role'}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {exp.company || 'Company'}
                      </p>
                      {(exp.duration || exp.location) && (
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {exp.duration && (
                            <span className="text-[9px] text-neutral-500 font-medium">
                              {exp.duration}
                            </span>
                          )}
                          {exp.location && (
                            <span className="text-[9px] text-neutral-500 font-medium">
                              • {exp.location}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => copyValue(`${expKey}-all`, fullExpText)}
                      className={`flex items-center justify-center px-1.5 py-1 rounded transition-colors shrink-0 text-xs gap-1 border select-none ${
                        isCopied(`${expKey}-all`)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      title="Copy entire role details"
                    >
                      {isCopied(`${expKey}-all`) ? (
                        <>
                          <LuCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-[9px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <LuCopy className="w-3 h-3" />
                          <span className="text-[9px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {renderFieldRow('Role Title', `${expKey}-role`, exp.role || '')}
                    {renderFieldRow('Company', `${expKey}-company`, exp.company || '')}
                    {exp.duration && renderFieldRow('Duration', `${expKey}-duration`, exp.duration)}
                    {exp.location && renderFieldRow('Location', `${expKey}-location`, exp.location)}
                    {exp.description && (
                      <div
                        onClick={() => copyValue(`${expKey}-desc`, exp.description || '')}
                        className={`p-2 rounded border transition-all cursor-pointer select-none text-[11px] ${
                          isCopied(`${expKey}-desc`)
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-black/50 border-neutral-900 hover:bg-neutral-900/80 hover:border-neutral-800'
                        }`}
                        title="Click to copy description"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            Description
                          </span>
                          <span className="text-[9px] text-neutral-500">
                            {isCopied(`${expKey}-desc`) ? '✓ Copied' : 'Click to copy'}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">
                          {exp.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: EDUCATION */}
      {education.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuGraduationCap className="w-3 h-3 text-neutral-400" />
              EDUCATION ({education.length})
            </span>
            <button
              onClick={() =>
                copyValue(
                  'edu-all-entries',
                  education.map((e) => formatEducationItem(e)).join('\n\n')
                )
              }
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('edu-all-entries')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all education"
            >
              {isCopied('edu-all-entries') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('edu-all-entries') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {education.map((edu, idx) => {
              const eduKey = `edu-${idx}`
              const fullEduText = formatEducationItem(edu)
              const isEduMatching =
                matchesSearch(edu.degree) ||
                matchesSearch(edu.institution) ||
                matchesSearch(edu.grade)

              if (!isEduMatching) return null

              return (
                <div
                  key={idx}
                  className="bg-neutral-950/70 border border-neutral-900 rounded-lg p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-900 pb-1.5">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {edu.degree || 'Degree'}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {edu.institution || 'Institution'}
                      </p>
                      {(edu.duration || edu.grade) && (
                        <div className="flex items-center gap-2 mt-0.5">
                          {edu.duration && (
                            <span className="text-[9px] text-neutral-500">{edu.duration}</span>
                          )}
                          {edu.grade && (
                            <span className="text-[9px] text-neutral-500">• Grade: {edu.grade}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => copyValue(`${eduKey}-all`, fullEduText)}
                      className={`flex items-center justify-center px-1.5 py-1 rounded transition-colors shrink-0 text-xs gap-1 border select-none ${
                        isCopied(`${eduKey}-all`)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                      title="Copy education entry"
                    >
                      {isCopied(`${eduKey}-all`) ? (
                        <>
                          <LuCheck className="w-3 h-3 text-emerald-400" />
                          <span className="text-[9px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <LuCopy className="w-3 h-3" />
                          <span className="text-[9px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    {renderFieldRow('Degree', `${eduKey}-degree`, edu.degree || '')}
                    {renderFieldRow('Institution', `${eduKey}-institution`, edu.institution || '')}
                    {edu.duration && renderFieldRow('Duration', `${eduKey}-duration`, edu.duration)}
                    {edu.grade && renderFieldRow('Grade / GPA', `${eduKey}-grade`, edu.grade)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 6: PROJECTS */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-2.5 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuFolderGit2 className="w-3 h-3 text-neutral-400" />
              PROJECTS ({projects.length})
            </span>
            <button
              onClick={() =>
                copyValue(
                  'proj-all-entries',
                  projects.map((p) => formatProjectItem(p)).join('\n\n')
                )
              }
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('proj-all-entries')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all projects"
            >
              {isCopied('proj-all-entries') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('proj-all-entries') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {projects.map((proj, idx) => {
              const projKey = `proj-${idx}`
              const fullProjText = formatProjectItem(proj)
              const isProjMatching =
                matchesSearch(proj.title) ||
                matchesSearch(proj.technologies) ||
                matchesSearch(proj.description)

              if (!isProjMatching) return null

              return (
                <div
                  key={idx}
                  className="bg-neutral-950/70 border border-neutral-900 rounded-lg p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-900 pb-1.5">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {proj.title || 'Project'}
                      </h4>
                      {proj.technologies && (
                        <p className="text-[10px] text-neutral-400 truncate font-mono">
                          {proj.technologies}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {proj.link && (
                        <a
                          href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                          title="Open Project"
                        >
                          <LuExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => copyValue(`${projKey}-all`, fullProjText)}
                        className={`flex items-center justify-center px-1.5 py-1 rounded transition-colors text-xs gap-1 border select-none ${
                          isCopied(`${projKey}-all`)
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800'
                        }`}
                        title="Copy project"
                      >
                        {isCopied(`${projKey}-all`) ? (
                          <LuCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <LuCopy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {renderFieldRow('Title', `${projKey}-title`, proj.title || '')}
                    {proj.technologies &&
                      renderFieldRow('Tech Stack', `${projKey}-tech`, proj.technologies)}
                    {proj.link &&
                      renderFieldRow('Link', `${projKey}-link`, proj.link, undefined, proj.link)}
                    {proj.description && (
                      <div
                        onClick={() => copyValue(`${projKey}-desc`, proj.description || '')}
                        className={`p-2 rounded border transition-all cursor-pointer select-none text-[11px] ${
                          isCopied(`${projKey}-desc`)
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-black/50 border-neutral-900 hover:bg-neutral-900/80 hover:border-neutral-800'
                        }`}
                        title="Click to copy description"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            Description
                          </span>
                          <span className="text-[9px] text-neutral-500">
                            {isCopied(`${projKey}-desc`) ? '✓ Copied' : 'Click to copy'}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed break-words whitespace-pre-wrap">
                          {proj.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 7: CERTIFICATIONS */}
      {certifications.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuAward className="w-3 h-3 text-neutral-400" />
              CERTIFICATIONS ({certifications.length})
            </span>
            <button
              onClick={() =>
                copyValue(
                  'cert-all-entries',
                  certifications.map((c) => formatCertificationItem(c)).join('\n\n')
                )
              }
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('cert-all-entries')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all certifications"
            >
              {isCopied('cert-all-entries') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('cert-all-entries') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {certifications.map((cert, idx) => {
              const certKey = `cert-${idx}`
              const isCertMatching =
                matchesSearch(cert.name) || matchesSearch(cert.issuer) || matchesSearch(cert.date)

              if (!isCertMatching) return null
              const fullCertText = formatCertificationItem(cert)

              return (
                <div
                  key={idx}
                  onClick={() => copyValue(certKey, fullCertText)}
                  className={`p-2 rounded-lg border bg-neutral-950/70 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isCopied(certKey)
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-neutral-900 hover:bg-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-neutral-200 truncate">
                      {cert.name || 'Certification'}
                    </h4>
                    {(cert.issuer || cert.date) && (
                      <p className="text-[10px] text-neutral-400 truncate">
                        {[cert.issuer, cert.date].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyValue(certKey, fullCertText)
                    }}
                    className={`p-1 rounded transition-colors text-xs ${
                      isCopied(certKey)
                        ? 'text-emerald-400 bg-emerald-500/20'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {isCopied(certKey) ? (
                      <LuCheck className="w-3.5 h-3.5" />
                    ) : (
                      <LuCopy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 8: LANGUAGES */}
      {languages.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuLanguages className="w-3 h-3 text-neutral-400" />
              LANGUAGES ({languages.length})
            </span>
            <button
              onClick={() => copyValue('lang-all', languages.join(', '))}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('lang-all')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all languages"
            >
              {isCopied('lang-all') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('lang-all') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang, idx) => {
              if (query && !matchesSearch(lang)) return null
              const langKey = `lang-${idx}`
              const copied = isCopied(langKey)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => copyValue(langKey, lang)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                    copied
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-neutral-950/80 border-neutral-850 text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                  title={`Click to copy "${lang}"`}
                >
                  {copied && <LuCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                  <span>{lang}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 9: PUBLICATIONS */}
      {publications.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuBookOpen className="w-3 h-3 text-neutral-400" />
              PUBLICATIONS ({publications.length})
            </span>
            <button
              onClick={() =>
                copyValue(
                  'pub-all-entries',
                  publications.map((p) => formatPublicationItem(p)).join('\n\n')
                )
              }
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('pub-all-entries')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all publications"
            >
              {isCopied('pub-all-entries') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('pub-all-entries') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {publications.map((pub, idx) => {
              const pubKey = `pub-${idx}`
              const isPubMatching =
                matchesSearch(pub.title) || matchesSearch(pub.publisher) || matchesSearch(pub.date)

              if (!isPubMatching) return null
              const fullPubText = formatPublicationItem(pub)

              return (
                <div
                  key={idx}
                  onClick={() => copyValue(pubKey, fullPubText)}
                  className={`p-2 rounded-lg border bg-neutral-950/70 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isCopied(pubKey)
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-neutral-900 hover:bg-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-neutral-200 truncate">
                      {pub.title || 'Publication'}
                    </h4>
                    {(pub.publisher || pub.date) && (
                      <p className="text-[10px] text-neutral-400 truncate">
                        {[pub.publisher, pub.date].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pub.link && (
                      <a
                        href={pub.link.startsWith('http') ? pub.link : `https://${pub.link}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-neutral-500 hover:text-white rounded hover:bg-neutral-800 transition-colors"
                        title="Open Link"
                      >
                        <LuExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyValue(pubKey, fullPubText)
                      }}
                      className={`p-1 rounded transition-colors text-xs ${
                        isCopied(pubKey)
                          ? 'text-emerald-400 bg-emerald-500/20'
                          : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      {isCopied(pubKey) ? (
                        <LuCheck className="w-3.5 h-3.5" />
                      ) : (
                        <LuCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 10: AWARDS & HONORS */}
      {awards.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider flex items-center gap-1.5">
              <LuAward className="w-3 h-3 text-amber-400" />
              AWARDS & HONORS ({awards.length})
            </span>
            <button
              onClick={() => copyValue('awards-all', awards.join('\n'))}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCopied('awards-all')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title="Copy all awards"
            >
              {isCopied('awards-all') ? (
                <LuCheck className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <LuCopy className="w-2.5 h-2.5" />
              )}
              <span>{isCopied('awards-all') ? 'Copied All' : 'Copy All'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {awards.map((award, idx) => {
              if (query && !matchesSearch(award)) return null
              const awardKey = `award-${idx}`
              const copied = isCopied(awardKey)
              return (
                <div
                  key={idx}
                  onClick={() => copyValue(awardKey, award)}
                  className={`p-2 rounded-lg border bg-neutral-950/70 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    copied
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-neutral-900 hover:bg-neutral-900 hover:border-neutral-800'
                  }`}
                  title={`Click to copy award`}
                >
                  <span className="text-xs text-neutral-200 leading-snug break-words">
                    {award}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyValue(awardKey, award)
                    }}
                    className={`p-1 rounded transition-colors text-xs shrink-0 ${
                      copied
                        ? 'text-emerald-400 bg-emerald-500/20'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {copied ? <LuCheck className="w-3.5 h-3.5" /> : <LuCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* SECTION 11: CUSTOM FIELDS */}
      {customFields.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-neutral-900/80 pt-3">
          <span className="text-[10px] font-bold text-neutral-500 tracking-wider">
            CUSTOM FIELDS ({customFields.length})
          </span>

          <div className="flex flex-col gap-1.5">
            {customFields.map((cf) => renderFieldRow(cf.label, cf.id, cf.value))}
          </div>
        </div>
      )}

      {/* COPY ALL FIELDS ACTION */}
      <div className="border-t border-neutral-900/80 pt-3">
        <button
          className={`w-full p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
            copiedField === 'all' || localCopiedKey === 'all'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white shadow-sm'
          }`}
          onClick={async () => {
            const text = formatResumeForCopy(currentResumeForAssistant)
            if (text) {
              try {
                await navigator.clipboard.writeText(text)
                setLocalCopiedKey('all')
                handleCopyAll(currentResumeForAssistant)
                setTimeout(() => setLocalCopiedKey(null), 1500)
              } catch (err) {
                Logger.error('QuickFillTab.tsx', 'onClick', 'Failed copying all resume fields', err)
              }
            }
          }}
        >
          {copiedField === 'all' || localCopiedKey === 'all' ? (
            <>
              <LuCheck className="w-4 h-4 text-white animate-in zoom-in-50 duration-150" />
              <span>Copied All Fields!</span>
            </>
          ) : (
            <>
              <LuCopy className="w-4 h-4 text-neutral-300" />
              <span>Copy All Fields</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
