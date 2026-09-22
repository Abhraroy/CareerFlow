import { Resume, StructuredResume } from '../types'

/**
 * Formats a single work experience item into clean text suitable for copy-paste into forms.
 */
export function formatExperienceItem(item: {
  role?: string
  company?: string
  duration?: string
  location?: string
  description?: string
}): string {
  const parts: string[] = []
  if (item.role) parts.push(`Role: ${item.role}`)
  if (item.company) parts.push(`Company: ${item.company}`)
  if (item.duration) parts.push(`Duration: ${item.duration}`)
  if (item.location) parts.push(`Location: ${item.location}`)
  if (item.description) parts.push(`Description:\n${item.description}`)
  return parts.join('\n')
}

/**
 * Formats a single education item into clean text suitable for copy-paste into forms.
 */
export function formatEducationItem(item: {
  degree?: string
  institution?: string
  duration?: string
  grade?: string
}): string {
  const parts: string[] = []
  if (item.degree) parts.push(`Degree: ${item.degree}`)
  if (item.institution) parts.push(`Institution: ${item.institution}`)
  if (item.duration) parts.push(`Duration: ${item.duration}`)
  if (item.grade) parts.push(`Grade / GPA: ${item.grade}`)
  return parts.join('\n')
}

/**
 * Formats a single project item into clean text suitable for copy-paste into forms.
 */
export function formatProjectItem(item: {
  title?: string
  technologies?: string
  link?: string
  description?: string
}): string {
  const parts: string[] = []
  if (item.title) parts.push(`Project: ${item.title}`)
  if (item.technologies) parts.push(`Technologies: ${item.technologies}`)
  if (item.link) parts.push(`Link: ${item.link}`)
  if (item.description) parts.push(`Description:\n${item.description}`)
  return parts.join('\n')
}

/**
 * Formats a single certification item into clean text.
 */
export function formatCertificationItem(item: {
  name?: string
  issuer?: string
  date?: string
}): string {
  const parts: string[] = []
  if (item.name) parts.push(`Certification: ${item.name}`)
  if (item.issuer) parts.push(`Issuer: ${item.issuer}`)
  if (item.date) parts.push(`Date: ${item.date}`)
  return parts.join('\n')
}

/**
 * Formats a single publication item into clean text.
 */
export function formatPublicationItem(item: {
  title?: string
  publisher?: string
  date?: string
  link?: string
}): string {
  const parts: string[] = []
  if (item.title) parts.push(`Publication: ${item.title}`)
  if (item.publisher) parts.push(`Publisher: ${item.publisher}`)
  if (item.date) parts.push(`Date: ${item.date}`)
  if (item.link) parts.push(`Link: ${item.link}`)
  return parts.join('\n')
}

/**
 * Formats an entire structured resume into clean, comprehensive plain text.
 */
export function formatResumeForCopy(resume: Resume | undefined): string {
  if (!resume) return ''

  let sData: StructuredResume = {}
  if (resume.structuredData) {
    if (typeof resume.structuredData === 'string') {
      try {
        sData = JSON.parse(resume.structuredData)
      } catch {
        sData = {}
      }
    } else {
      sData = resume.structuredData as StructuredResume
    }
  }

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
      : firstName || lastName || resume.name || ''

  const sections: string[] = []

  // 1. Contact Information
  const contactLines: string[] = []
  if (fullName) contactLines.push(`Name: ${fullName}`)
  if (sData.email || profile.email) contactLines.push(`Email: ${sData.email || profile.email}`)
  if (sData.phone || profile.phone) contactLines.push(`Phone: ${sData.phone || profile.phone}`)
  if (sData.location || profile.location)
    contactLines.push(`Location: ${sData.location || profile.location}`)
  if (sData.linkedin || profile.linkedin)
    contactLines.push(`LinkedIn: ${sData.linkedin || profile.linkedin}`)
  if (sData.github || profile.github)
    contactLines.push(`GitHub: ${sData.github || profile.github}`)
  if (sData.portfolio || profile.portfolio)
    contactLines.push(`Portfolio: ${sData.portfolio || profile.portfolio}`)

  if (contactLines.length > 0) {
    sections.push(`=== CONTACT INFORMATION ===\n${contactLines.join('\n')}`)
  }

  // 2. Summary
  if (sData.summary) {
    sections.push(`=== SUMMARY ===\n${sData.summary}`)
  }

  // 3. Skills
  if (sData.skills && sData.skills.length > 0) {
    sections.push(`=== SKILLS ===\n${sData.skills.join(', ')}`)
  }

  // 4. Experience
  if (sData.experience && sData.experience.length > 0) {
    const expText = sData.experience
      .map((exp, idx) => {
        const header = [exp.role, exp.company].filter(Boolean).join(' at ')
        const meta = [exp.duration, exp.location].filter(Boolean).join(' | ')
        const titleLine = `${idx + 1}. ${header || 'Experience'}${meta ? ` (${meta})` : ''}`
        return exp.description ? `${titleLine}\n${exp.description}` : titleLine
      })
      .join('\n\n')
    sections.push(`=== WORK EXPERIENCE ===\n${expText}`)
  }

  // 5. Education
  if (sData.education && sData.education.length > 0) {
    const eduText = sData.education
      .map((edu, idx) => {
        const header = [edu.degree, edu.institution].filter(Boolean).join(' - ')
        const meta = [edu.duration, edu.grade ? `Grade/GPA: ${edu.grade}` : '']
          .filter(Boolean)
          .join(' | ')
        return `${idx + 1}. ${header || 'Education'}${meta ? ` (${meta})` : ''}`
      })
      .join('\n')
    sections.push(`=== EDUCATION ===\n${eduText}`)
  }

  // 6. Projects
  if (sData.projects && sData.projects.length > 0) {
    const projText = sData.projects
      .map((proj, idx) => {
        let line = `${idx + 1}. ${proj.title || 'Project'}`
        if (proj.technologies) line += ` [Tech: ${proj.technologies}]`
        if (proj.link) line += ` (${proj.link})`
        if (proj.description) line += `\n${proj.description}`
        return line
      })
      .join('\n\n')
    sections.push(`=== PROJECTS ===\n${projText}`)
  }

  // 7. Certifications
  if (sData.certifications && sData.certifications.length > 0) {
    const certText = sData.certifications
      .map((c, idx) => {
        const meta = [c.issuer, c.date].filter(Boolean).join(', ')
        return `${idx + 1}. ${c.name || 'Certification'}${meta ? ` (${meta})` : ''}`
      })
      .join('\n')
    sections.push(`=== CERTIFICATIONS ===\n${certText}`)
  }

  // 8. Languages
  if (sData.languages && sData.languages.length > 0) {
    sections.push(`=== LANGUAGES ===\n${sData.languages.join(', ')}`)
  }

  // 9. Publications
  if (sData.publications && sData.publications.length > 0) {
    const pubText = sData.publications
      .map((p, idx) => {
        const meta = [p.publisher, p.date].filter(Boolean).join(', ')
        return `${idx + 1}. ${p.title || 'Publication'}${meta ? ` (${meta})` : ''}${p.link ? ` [${p.link}]` : ''}`
      })
      .join('\n')
    sections.push(`=== PUBLICATIONS ===\n${pubText}`)
  }

  // 10. Awards & Achievements
  if (sData.awards && sData.awards.length > 0) {
    const awardsText = sData.awards.map((a, i) => `${i + 1}. ${a}`).join('\n')
    sections.push(`=== AWARDS & ACHIEVEMENTS ===\n${awardsText}`)
  }

  // 11. Custom Fields
  if (profile.customFields && profile.customFields.length > 0) {
    const cfText = profile.customFields.map((cf) => `${cf.label}: ${cf.value}`).join('\n')
    sections.push(`=== CUSTOM FIELDS ===\n${cfText}`)
  }

  // 12. Other dynamic keys on structuredData
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

  const extraKeys = Object.keys(sData).filter((k) => !standardKeys.includes(k) && sData[k])
  if (extraKeys.length > 0) {
    const extraText = extraKeys
      .map((k) => {
        const val = sData[k]
        const label = k.charAt(0).toUpperCase() + k.slice(1)
        return `${label}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`
      })
      .join('\n')
    sections.push(`=== OTHER SECTIONS ===\n${extraText}`)
  }

  return sections.join('\n\n')
}
