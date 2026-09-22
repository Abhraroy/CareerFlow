import type { EditPlan, ResumeEdit } from './tailoredResumeSchema'

export interface ResumeDocumentMetadata {
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  github: string | null
  portfolio: string | null
  [key: string]: any
}

export interface ResumeDocumentElement {
  id: string
  type: string
  content: string | Record<string, any>
  metadata?: Record<string, any>
}

export interface ResumeDocumentSection {
  id: string
  title: string
  type: string
  elements: ResumeDocumentElement[]
  metadata?: Record<string, any>
}

export interface ResumeDocument {
  id: string
  version: number
  metadata: ResumeDocumentMetadata
  sections: ResumeDocumentSection[]
  [key: string]: any
}

/**
 * Normalizes text content for comparison (trims and compresses whitespace).
 */
function normalizeText(text: string): string {
  return (text || '').trim().replace(/\s+/g, ' ')
}

/**
 * Combines original content and new content for an append operation.
 * Ensures proper punctuation and spacing.
 */
function appendContent(original: string, addition: string): string {
  const origTrimmed = (original || '').trim()
  const addTrimmed = (addition || '').trim()

  if (!origTrimmed) return addTrimmed
  if (!addTrimmed) return origTrimmed

  // If original does not end with punctuation, add a period before appending
  const endsWithPunctuation = /[.!?;:]$/.test(origTrimmed)
  const separator = endsWithPunctuation ? ' ' : '. '

  return `${origTrimmed}${separator}${addTrimmed}`
}

/**
 * Applies an EditPlan (array of ResumeEdit items) to a structured ResumeDocument.
 * Performs deep cloning so the original object is never mutated.
 *
 * Supported operations:
 * - replace: Replaces the element's content with newContent.
 * - append: Appends newContent to the element's existing content.
 * - insert_after: Inserts a new element directly after the target element.
 * - insert_before: Inserts a new element directly before the target element.
 */
export function applyEditPlanToResume(
  originalResume: ResumeDocument,
  editPlan: EditPlan
): ResumeDocument {
  if (!originalResume || !Array.isArray(originalResume.sections)) {
    return originalResume
  }

  // Deep clone
  const updatedResume: ResumeDocument = JSON.parse(JSON.stringify(originalResume))
  const edits = Array.isArray(editPlan?.edits) ? editPlan.edits : []

  // Ensure sections do NOT carry stale tailored flags from prior runs:
  // If some sections are already there, no need to rewrite them; only follow the edit plan!
  for (const section of updatedResume.sections) {
    if (!Array.isArray(section.elements)) continue
    for (const el of section.elements) {
      if (el.metadata?.tailored) {
        delete el.metadata.tailored
        delete el.metadata.originalContent
        delete el.metadata.newContent
        delete el.metadata.editReason
        delete el.metadata.editedAt
      }
    }
  }

  if (edits.length === 0) {
    ;(updatedResume as any).edits = []
    return updatedResume
  }

  edits.forEach((edit: ResumeEdit, editIndex: number) => {
    const { targetId, operation, originalContent, newContent, reason } = edit
    if (!targetId || !newContent) return

    let applied = false

    // 1. Search for target element across all sections
    for (const section of updatedResume.sections) {
      if (!Array.isArray(section.elements)) continue

      const elemIndex = section.elements.findIndex(
        (el) =>
          el.id === targetId ||
          (originalContent &&
            typeof el.content === 'string' &&
            normalizeText(el.content) === normalizeText(originalContent))
      )

      if (elemIndex !== -1) {
        const targetElement = section.elements[elemIndex]
        const existingContentStr = typeof targetElement.content === 'string' ? targetElement.content : ''
        const resolvedOriginal = originalContent || existingContentStr

        switch (operation) {
          case 'replace': {
            targetElement.content = newContent
            targetElement.metadata = {
              ...(targetElement.metadata || {}),
              tailored: true,
              originalContent: resolvedOriginal,
              newContent: newContent,
              editReason: reason,
              editedAt: new Date().toISOString()
            }
            applied = true
            break
          }

          case 'append': {
            const combined =
              typeof targetElement.content === 'string'
                ? appendContent(targetElement.content, newContent)
                : newContent
            targetElement.content = combined
            targetElement.metadata = {
              ...(targetElement.metadata || {}),
              tailored: true,
              originalContent: resolvedOriginal,
              newContent: combined,
              editReason: reason,
              editedAt: new Date().toISOString()
            }
            applied = true
            break
          }

          case 'insert_after': {
            const newElem: ResumeDocumentElement = {
              id: `${targetElement.id}_tailored_${editIndex}_${Date.now()}`,
              type: targetElement.type || 'text',
              content: newContent,
              metadata: {
                tailored: true,
                originalContent: resolvedOriginal || '(New addition to section)',
                newContent: newContent,
                editReason: reason,
                insertedAfter: targetId,
                editedAt: new Date().toISOString()
              }
            }
            section.elements.splice(elemIndex + 1, 0, newElem)
            applied = true
            break
          }

          case 'insert_before': {
            const newElem: ResumeDocumentElement = {
              id: `${targetElement.id}_tailored_before_${editIndex}_${Date.now()}`,
              type: targetElement.type || 'text',
              content: newContent,
              metadata: {
                tailored: true,
                originalContent: resolvedOriginal || '(New addition to section)',
                newContent: newContent,
                editReason: reason,
                insertedBefore: targetId,
                editedAt: new Date().toISOString()
              }
            }
            section.elements.splice(elemIndex, 0, newElem)
            applied = true
            break
          }
        }

        if (applied) break
      }
    }

    // 2. If not matched on element, check if targetId matches a whole section
    if (!applied) {
      const section = updatedResume.sections.find((s) => s.id === targetId)
      if (section) {
        if (!Array.isArray(section.elements)) {
          section.elements = []
        }

        const resolvedOriginal = originalContent || section.title || '(New addition to section)'

        if (operation === 'append' || operation === 'insert_after') {
          section.elements.push({
            id: `${section.id}_tailored_elem_${editIndex}_${Date.now()}`,
            type: 'text',
            content: newContent,
            metadata: {
              tailored: true,
              originalContent: resolvedOriginal,
              newContent: newContent,
              editReason: reason,
              editedAt: new Date().toISOString()
            }
          })
          applied = true
        } else if (operation === 'insert_before') {
          section.elements.unshift({
            id: `${section.id}_tailored_elem_first_${editIndex}_${Date.now()}`,
            type: 'text',
            content: newContent,
            metadata: {
              tailored: true,
              originalContent: resolvedOriginal,
              newContent: newContent,
              editReason: reason,
              editedAt: new Date().toISOString()
            }
          })
          applied = true
        }
      }
    }
  })

  // Bump version & metadata
  updatedResume.version = (updatedResume.version || 1) + 1
  updatedResume.metadata = {
    ...(updatedResume.metadata || {}),
    lastTailoredAt: new Date().toISOString()
  }
  // Store edits on updatedResume as well
  ;(updatedResume as any).edits = edits

  return updatedResume
}
