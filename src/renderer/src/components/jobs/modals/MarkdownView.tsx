import React from 'react'

interface MarkdownViewProps {
  content: string
}

export function MarkdownView({ content }: MarkdownViewProps): React.JSX.Element {
  if (!content) return <div />

  const lines = content.split('\n')
  const blocks: React.JSX.Element[] = []

  let currentParagraphLines: string[] = []
  let tableHeader: string[] = []
  let tableRows: string[][] = []
  let inTable = false

  const flushParagraph = (key: string) => {
    if (currentParagraphLines.length === 0) return
    const text = currentParagraphLines.join('\n').trim()
    if (!text) {
      currentParagraphLines = []
      return
    }

    blocks.push(
      <p key={key} className="text-xs text-neutral-200 leading-relaxed my-2 whitespace-pre-wrap">
        {renderInlineMarkdown(text)}
      </p>
    )
    currentParagraphLines = []
  }

  const flushTable = (key: string) => {
    if (!inTable) return
    blocks.push(
      <div key={key} className="my-4 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/80 p-0.5">
        <table className="w-full text-left text-xs border-collapse">
          {tableHeader.length > 0 && (
            <thead>
              <tr className="bg-neutral-900/90 border-b border-neutral-800 text-purple-300">
                {tableHeader.map((h, i) => (
                  <th key={i} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[11px]">
                    {renderInlineMarkdown(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-neutral-800/60">
            {tableRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-900/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2.5 text-neutral-300 font-normal align-top leading-relaxed">
                    {renderInlineMarkdown(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    inTable = false
    tableHeader = []
    tableRows = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Table line check
    if (line.startsWith('|') && line.endsWith('|')) {
      flushParagraph(`p-before-table-${i}`)
      const cells = line.slice(1, -1).split('|')
      if (cells.every((c) => c.trim().match(/^:?-+:?$/))) {
        // Divider row
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
        flushTable(`table-${i}`)
      }

      if (line.startsWith('### ')) {
        flushParagraph(`p-${i}`)
        blocks.push(
          <h3 key={`h3-${i}`} className="text-xs font-bold text-purple-400 mt-4 mb-1.5 uppercase tracking-wide">
            {renderInlineMarkdown(line.slice(4))}
          </h3>
        )
      } else if (line.startsWith('## ')) {
        flushParagraph(`p-${i}`)
        blocks.push(
          <h2 key={`h2-${i}`} className="text-sm font-bold text-white mt-5 mb-2 flex items-center gap-2 border-b border-neutral-800/80 pb-1.5">
            {renderInlineMarkdown(line.slice(3))}
          </h2>
        )
      } else if (line.startsWith('# ')) {
        flushParagraph(`p-${i}`)
        blocks.push(
          <h1 key={`h1-${i}`} className="text-base font-extrabold text-white mt-6 mb-3">
            {renderInlineMarkdown(line.slice(2))}
          </h1>
        )
      } else if (line === '') {
        flushParagraph(`p-${i}`)
      } else {
        currentParagraphLines.push(lines[i])
      }
    }
  }

  if (inTable) flushTable(`table-end`)
  flushParagraph(`p-end`)

  return <div className="flex flex-col gap-1 select-text">{blocks}</div>
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Simple regex parser for **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-neutral-300">
          {part.slice(1, -1)}
        </em>
      )
    }
    return part
  })
}
