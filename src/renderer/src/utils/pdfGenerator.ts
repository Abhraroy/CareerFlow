import { jsPDF } from 'jspdf'
import { Resume, StructuredItem } from '../types'

export const handleDownloadPDF = (resume: Resume): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const margin = 15
  let y = 15
  const pageHeight = 282

  const addNewPageIfNeeded = (heightNeeded: number): void => {
    if (y + heightNeeded > pageHeight) {
      doc.addPage()
      y = 15
    }
  }

  const drawSectionHeader = (title: string): void => {
    addNewPageIfNeeded(18)
    y += 2
    doc.setFont('times', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(title.toUpperCase(), margin, y)
    y += 1.5
    doc.setDrawColor(80, 80, 80)
    doc.setLineWidth(0.3)
    doc.line(margin, y, 210 - margin, y)
    y += 4.5
  }

  // 1. Centered Header Area
  const fullName =
    `${resume.profileDetails.firstName || ''} ${resume.profileDetails.lastName || ''}`.trim() ||
    'Resume'
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text(fullName.toUpperCase(), 105, y, { align: 'center' })
  y += 5.5

  if (resume.profileDetails.location) {
    doc.setFont('times', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(80, 80, 80)
    doc.text(resume.profileDetails.location, 105, y, { align: 'center' })
    y += 5
  }

  // Contact Links Info Row
  doc.setFont('times', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 30, 30)

  const contactParts: string[] = []
  if (resume.profileDetails.portfolio) {
    contactParts.push(resume.profileDetails.portfolio.replace(/^https?:\/\/(www\.)?/, ''))
  }
  if (resume.profileDetails.email) {
    contactParts.push(resume.profileDetails.email)
  }
  if (resume.profileDetails.phone) {
    contactParts.push(resume.profileDetails.phone)
  }
  if (resume.profileDetails.linkedin) {
    contactParts.push(
      resume.profileDetails.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')
    )
  }
  if (resume.profileDetails.github) {
    contactParts.push(resume.profileDetails.github.replace(/^https?:\/\/(www\.)?github\.com\//, ''))
  }

  doc.text(contactParts.join('  —  '), 105, y, { align: 'center' })
  y += 6

  // 2. Summary Section
  if (resume.uploadedData || resume.profileDetails.customFields) {
    // Find Summary field in customFields or check if uploadedData is summary
    const summaryField = resume.profileDetails.customFields?.find(
      (f) => f.label.toLowerCase() === 'summary'
    )
    const summaryText =
      summaryField?.value ||
      (resume.uploadedData && resume.uploadedData.length < 800 ? resume.uploadedData : '')

    if (summaryText) {
      drawSectionHeader('SUMMARY')
      doc.setFont('times', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 30, 30)
      const wrappedSummary = doc.splitTextToSize(summaryText.trim(), 210 - 2 * margin)
      wrappedSummary.forEach((line: string) => {
        addNewPageIfNeeded(4.5)
        doc.text(line, margin, y)
        y += 4.2
      })
      y += 2
    }
  }

  // 3. Sections Rendering
  if (resume.profileDetails.customFields) {
    // Re-order to match standard layout: Experience, Skills, Projects, Education, others
    const orderedFields = [...resume.profileDetails.customFields].sort((a, b) => {
      const order = ['experience', 'work', 'skills', 'project', 'education', 'achievement']
      const aIndex = order.findIndex((o) => a.label.toLowerCase().includes(o))
      const bIndex = order.findIndex((o) => b.label.toLowerCase().includes(o))
      const finalA = aIndex === -1 ? 99 : aIndex
      const finalB = bIndex === -1 ? 99 : bIndex
      return finalA - finalB
    })

    orderedFields.forEach((field) => {
      const label = field.label.trim()
      const lowerLabel = label.toLowerCase()
      if (lowerLabel === 'summary') return // Already handled above

      let items: StructuredItem[] = []
      let isStructured = false
      if (
        lowerLabel.includes('experience') ||
        lowerLabel.includes('project') ||
        lowerLabel.includes('education') ||
        lowerLabel.includes('work')
      ) {
        try {
          const parsed = JSON.parse(field.value)
          if (Array.isArray(parsed)) {
            items = parsed
            isStructured = true
          }
        } catch {
          // Not structured JSON
        }
      }

      if (isStructured && items.length > 0) {
        drawSectionHeader(label)

        items.forEach((item) => {
          if (lowerLabel.includes('experience') || lowerLabel.includes('work')) {
            addNewPageIfNeeded(16)
            // Row 1: Role & Duration
            doc.setFont('times', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const roleStr = item.role || 'Position'
            doc.text(roleStr, margin, y)

            doc.setFont('times', 'normal')
            doc.setFontSize(9.5)
            const durationStr = item.duration || ''
            doc.text(durationStr, 210 - margin, y, { align: 'right' })
            y += 4.2

            // Row 2: Company & Location
            addNewPageIfNeeded(6)
            doc.setFont('times', 'italic')
            doc.setFontSize(9.5)
            doc.setTextColor(50, 50, 50)
            const companyStr = item.company || ''
            doc.text(companyStr, margin, y)

            const locationStr = item.location || ''
            doc.text(locationStr, 210 - margin, y, { align: 'right' })
            y += 4.5

            // Description bullets
            if (item.description) {
              doc.setFont('times', 'normal')
              doc.setFontSize(9.5)
              doc.setTextColor(30, 30, 30)
              const bulletLines = item.description.split('\n')
              bulletLines.forEach((bLine: string) => {
                const cleaned = bLine.replace(/^[-•*#\d.\s]+/, '').trim()
                if (cleaned) {
                  const bulletText = `–  ${cleaned}`
                  const splitLines = doc.splitTextToSize(bulletText, 210 - 2 * margin - 6)
                  splitLines.forEach((sLine: string, sIdx: number) => {
                    addNewPageIfNeeded(4.5)
                    if (sIdx === 0) {
                      doc.text(sLine, margin + 3, y)
                    } else {
                      doc.text(sLine, margin + 6, y)
                    }
                    y += 4.2
                  })
                }
              })
            }
            y += 1.5
          } else if (lowerLabel.includes('project')) {
            addNewPageIfNeeded(14)
            // Title & Tech Stack on Left, Date on Right
            doc.setFont('times', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const titleStr = item.title || 'Project'
            doc.text(titleStr, margin, y)
            const titleWidth = doc.getTextWidth(titleStr)

            let techStr = ''
            if (item.technologies) {
              techStr = ` | ${item.technologies}`
            }
            doc.setFont('times', 'normal')
            doc.setFontSize(9.5)
            doc.setTextColor(60, 60, 60)
            doc.text(techStr, margin + titleWidth, y)

            const dateStr = item.duration || ''
            doc.setTextColor(0, 0, 0)
            doc.text(dateStr, 210 - margin, y, { align: 'right' })
            y += 4.5

            // Description bullets
            if (item.description) {
              doc.setFont('times', 'normal')
              doc.setFontSize(9.5)
              doc.setTextColor(30, 30, 30)
              const bulletLines = item.description.split('\n')
              bulletLines.forEach((bLine: string) => {
                const cleaned = bLine.replace(/^[-•*#\d.\s]+/, '').trim()
                if (cleaned) {
                  const bulletText = `–  ${cleaned}`
                  const splitLines = doc.splitTextToSize(bulletText, 210 - 2 * margin - 6)
                  splitLines.forEach((sLine: string, sIdx: number) => {
                    addNewPageIfNeeded(4.5)
                    if (sIdx === 0) {
                      doc.text(sLine, margin + 3, y)
                    } else {
                      doc.text(sLine, margin + 6, y)
                    }
                    y += 4.2
                  })
                }
              })
            }
            y += 1.5
          } else if (lowerLabel.includes('education')) {
            addNewPageIfNeeded(12)
            // Row 1: Institution & Duration
            doc.setFont('times', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            const instStr = item.institution || 'Institution'
            doc.text(instStr, margin, y)

            doc.setFont('times', 'normal')
            doc.setFontSize(9.5)
            const durStr = item.duration || ''
            doc.text(durStr, 210 - margin, y, { align: 'right' })
            y += 4.2

            // Row 2: Degree & Location
            addNewPageIfNeeded(6)
            doc.setFont('times', 'italic')
            doc.setFontSize(9.5)
            doc.setTextColor(50, 50, 50)
            const degGrade = [item.degree, item.grade ? `CGPA: ${item.grade}` : '']
              .filter(Boolean)
              .join(' — ')
            doc.text(degGrade, margin, y)

            const locStr = item.location || ''
            doc.text(locStr, 210 - margin, y, { align: 'right' })
            y += 5
          }
        })
      } else {
        // Plain Text Field or Skills Section
        if (field.value && field.value.trim()) {
          drawSectionHeader(label)

          if (lowerLabel.includes('skill')) {
            // Parse Skills as Key: Value lines
            const skillLines = field.value.split('\n')
            skillLines.forEach((sLine) => {
              const trimmed = sLine.trim()
              if (trimmed) {
                addNewPageIfNeeded(5)
                const colonIdx = trimmed.indexOf(':')
                if (colonIdx !== -1) {
                  const labelPart = trimmed.substring(0, colonIdx + 1)
                  const valPart = trimmed.substring(colonIdx + 1)

                  doc.setFont('times', 'bold')
                  doc.setFontSize(9.5)
                  doc.text(labelPart, margin, y)
                  const labelWidth = doc.getTextWidth(labelPart) + 1.5

                  doc.setFont('times', 'normal')
                  const wrappedVal = doc.splitTextToSize(valPart, 210 - 2 * margin - labelWidth)
                  wrappedVal.forEach((vLine: string, vIdx: number) => {
                    if (vIdx > 0) {
                      addNewPageIfNeeded(4.5)
                      doc.text(vLine, margin + 10, y)
                    } else {
                      doc.text(vLine, margin + labelWidth, y)
                    }
                    y += 4.2
                  })
                } else {
                  doc.setFont('times', 'normal')
                  doc.setFontSize(9.5)
                  const wrapped = doc.splitTextToSize(trimmed, 210 - 2 * margin)
                  wrapped.forEach((wLine: string) => {
                    addNewPageIfNeeded(4.5)
                    doc.text(wLine, margin, y)
                    y += 4.2
                  })
                }
              }
            })
          } else {
            // Standard Plain Text Section
            doc.setFont('times', 'normal')
            doc.setFontSize(9.5)
            doc.setTextColor(30, 30, 30)

            const lines = field.value.split('\n')
            lines.forEach((line) => {
              const trimmed = line.trim()
              if (trimmed) {
                const isBullet =
                  trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')
                const cleanedText = trimmed.replace(/^[-•*#\d.\s]+/, '').trim()
                if (cleanedText) {
                  const textToPrint = isBullet ? `•  ${cleanedText}` : cleanedText
                  const splitText = doc.splitTextToSize(
                    textToPrint,
                    210 - 2 * margin - (isBullet ? 5 : 0)
                  )
                  splitText.forEach((tLine: string, tIdx: number) => {
                    addNewPageIfNeeded(4.5)
                    if (isBullet) {
                      doc.text(tLine, tIdx === 0 ? margin + 3 : margin + 6, y)
                    } else {
                      doc.text(tLine, margin, y)
                    }
                    y += 4.2
                  })
                }
              }
            })
          }
        }
      }
    })
  }

  const cleanName = fullName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  const pdfFileName = `${cleanName}_RESUME.pdf`
  doc.save(pdfFileName)
}
