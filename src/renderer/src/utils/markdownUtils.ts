/**
 * Utility to parse Markdown (headings, tables, bold, lists) into:
 * 1. HTML string (for Rich Text clipboard paste in Gmail/Word/Docs)
 * 2. Plain Text string (clean text stripped of md syntax)
 */

function inlineMarkdownToHtml(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
}

export function markdownToHtml(md: string): string {
  if (!md) return ''

  let html = md

  // 1. Process Markdown Tables
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inTable = false
  let tableHeader: string[] = []
  let tableRows: string[][] = []

  const flushTable = () => {
    if (!inTable) return
    let tHtml = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; font-family: sans-serif; font-size: 13px;">'
    if (tableHeader.length > 0) {
      tHtml += '<thead><tr style="background-color: #f3f4f6;">'
      tableHeader.forEach((h) => {
        const cleanH = inlineMarkdownToHtml(h.trim())
        tHtml += `<th style="border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; font-weight: 600; color: #111827;">${cleanH}</th>`
      })
      tHtml += '</tr></thead>'
    }
    tHtml += '<tbody>'
    tableRows.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f9fafb'
      tHtml += `<tr style="background-color: ${bg};">`
      row.forEach((c) => {
        const cleanC = inlineMarkdownToHtml(c.trim())
        tHtml += `<td style="border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; color: #374151;">${cleanC}</td>`
      })
      tHtml += '</tr>'
    })
    tHtml += '</tbody></table>'
    processedLines.push(tHtml)
    inTable = false
    tableHeader = []
    tableRows = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|')
      if (cells.every((c) => c.trim().match(/^:?-+:?$/))) {
        // Divider row like |---|---|
        continue
      }
      if (!inTable) {
        inTable = true
        tableHeader = cells
      } else {
        tableRows.push(cells)
      }
    } else {
      if (inTable) {
        flushTable()
      }
      processedLines.push(lines[i])
    }
  }
  if (inTable) flushTable()

  html = processedLines.join('\n')

  // 2. Headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 15px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; color: #111827;">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 17px; font-weight: 700; margin-top: 20px; margin-bottom: 10px; color: #111827;">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 20px; font-weight: 800; margin-top: 24px; margin-bottom: 12px; color: #111827;">$1</h1>')

  // 3. Inline bold/italic
  html = inlineMarkdownToHtml(html)

  // 4. Paragraphs / line breaks
  const paragraphs = html.split(/\n\s*\n/)
  const formattedParagraphs = paragraphs.map((p) => {
    const trimmed = p.trim()
    if (trimmed.startsWith('<h') || trimmed.startsWith('<table')) {
      return trimmed
    }
    return `<p style="margin-bottom: 12px; line-height: 1.6; color: #374151; font-family: sans-serif; font-size: 13.5px;">${trimmed.replace(/\n/g, '<br/>')}</p>`
  })

  return `<div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">${formattedParagraphs.join('')}</div>`
}

export function markdownToPlainText(md: string): string {
  if (!md) return ''

  const lines = md.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim().replace(/\*\*/g, ''))
      if (cells.every((c) => c.match(/^:?-+:?$/))) {
        continue
      }
      result.push(cells.join(' \t '))
    } else {
      result.push(lines[i])
    }
  }

  let text = result.join('\n')
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
}
