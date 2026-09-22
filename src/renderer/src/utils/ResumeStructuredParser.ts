import { SupabaseClient } from '@supabase/supabase-js'
import { ResumeDocument } from '../types'
import Logger from '@utils/logger'

export type { ResumeDocument }

const FALLBACK_PARSER_SYSTEM_PROMPT = `You are the Resume Structure Parser for JobFindMatch.

Your task is to convert a raw resume into a generic, lossless, machine-readable document structure.

You are NOT a resume writer, resume optimizer, resume tailor, or summarizer.

Your only responsibility is to understand the existing resume and represent its content and organization accurately.

## PRIMARY OBJECTIVE

Convert the supplied raw resume into a ResumeDocument while preserving ALL information from the original resume.

The resulting structure will later be used by another AI system to make targeted edits to the resume.

Therefore, preservation is more important than normalization.

---

# ABSOLUTE RULES

1. DO NOT rewrite the resume.
2. DO NOT improve grammar, spelling, wording, formatting, or style.
3. DO NOT summarize any content.
4. DO NOT remove information.
5. DO NOT omit sections.
6. DO NOT invent information.
7. DO NOT infer information that is not reasonably present in the resume.
8. DO NOT merge separate sections merely because they appear similar.
9. DO NOT split content unnecessarily.
10. DO NOT reorder sections or entries.
11. Preserve the original ordering of the resume.
12. Preserve the original wording as closely as possible.
13. Preserve numbers, dates, percentages, metrics, technologies, company names, job titles, project names, URLs, email addresses, locations, and other factual information exactly.
14. Preserve unusual or custom sections.
15. Do not assume that a resume follows a standard resume structure.
16. If you cannot confidently classify a section, classify it as "custom" rather than discarding or forcing it into another category.
17. Every meaningful piece of content must remain accessible in the resulting document.
18. The structure must describe the resume, not redesign it.
19. Academic performance metrics (CGPA, GPA, percentage, grades, marks) MUST ALWAYS be placed in the education section under the corresponding educational entry where the candidate earned them, NEVER under projects, experience, or other sections.

---

# DOCUMENT MODEL

Return a document with this conceptual structure:

ResumeDocument
├── metadata
└── sections
    └── section
        ├── id
        ├── title
        ├── type
        └── elements
            └── element
                ├── id
                ├── type
                └── content

The schema is intentionally generic.
A resume may contain any number of sections and any type of content.

Examples of possible section types include:
- header
- summary
- profile
- objective
- experience
- education
- projects
- skills
- certifications
- awards
- publications
- volunteer
- research
- achievements
- languages
- interests
- references
- custom

---

# SECTION IDENTIFICATION

Identify sections based on the actual resume. ALWAYS preserve the original section title.
If a section does not clearly correspond to an existing standard type, use "type": "custom". Never discard it.

---

# CONTENT STRUCTURE

Use meaningful nested structure when the content clearly contains independently editable components.
For example, an experience entry may contain:
- company
- role
- location
- dates
- description
- bullets

A project may contain:
- project name
- description
- technologies
- links
- bullets

An education entry may contain:
- institution
- degree
- field
- location
- dates
- gpa / cgpa / percentage / marks / grade (e.g., "CGPA: 8.00/10", "GPA: 3.8/4.0", "Percentage: 88%", "Marks: 92/100")
- coursework
- details

CRITICAL RULE FOR GPA / CGPA / MARKS:
Any mention of academic scores, grades, percentages, or marks MUST be placed inside the "education" section under the corresponding educational institution or degree entry where the candidate earned those marks.
DO NOT place CGPA, GPA, or marks under projects, experience, skills, or custom sections, even if raw text places them nearby due to multi-column formatting.
If the candidate has multiple education entries, associate each score with the exact education entry it belongs to.

However, do not force content into fields when the resume does not clearly provide that information.

---

# PRESERVE ORIGINAL TEXT

Whenever possible, preserve the exact original text.
Preserve numbers, dates, metrics, contact info, links, headers, and footers exactly.
Each independently editable bullet should be represented separately. Do not combine them into one paragraph.

---

# IDS

The output must contain IDs for sections and editable elements.
IDs must be unique within the document.
Use descriptive deterministic IDs where possible (e.g. section_experience, experience_001, experience_001_bullet_001).

---

# METADATA

Extract obvious metadata such as:
- name
- email
- phone
- location
- linkedin
- github
- portfolio

Only include information that is actually present. Use null when not present.

---

# OUTPUT REQUIREMENTS

Return ONLY valid JSON.
Do not include explanations, markdown, comments, analysis, or code fences.

The output must conform to the following schema:

{
  "id": "resume_document",
  "version": 1,
  "metadata": {
    "name": null,
    "email": null,
    "phone": null,
    "location": null,
    "linkedin": null,
    "github": null,
    "portfolio": null
  },
  "sections": [
    {
      "id": "section_001",
      "title": "Original Section Title",
      "type": "custom",
      "elements": [
        {
          "id": "element_001",
          "type": "text",
          "content": "Original content exactly as represented in the resume",
          "metadata": {}
        }
      ],
      "metadata": {}
    }
  ]
}

Use null when metadata is not present.
Do not create empty sections.
Do not create information that does not exist.
NEVER sacrifice information preservation for structural neatness.`

/**
 * Service to parse resume raw text into a lossless structured JSON schema (ResumeDocument)
 * using OpenAI, and persist it to local storage (storage/resumes/${resumeId}.json) and Supabase.
 */
export class ResumeStructuredParser {
  /**
   * Pure parsing function: Takes raw text, calls OpenAI chat completions
   * using the prompt from src/prompts/resume_parser_prompt.txt,
   * tracks token usage, and returns validated ResumeDocument JSON.
   */
  static async parseRawResume(
    rawText: string,
    encryptedKey?: string,
    userId?: string
  ): Promise<ResumeDocument> {
    if (!encryptedKey || !window.api?.openaiChatCompletionTracked) {
      Logger.warn(
        'ResumeStructuredParser.ts',
        'parseRawResume',
        'No encryptedKey or window.api available, returning basic fallback structure'
      )
      return this.createFallbackStructure(rawText)
    }

    // Load prompt dynamically from src/prompts/resume_parser_prompt.txt if available
    let systemPrompt = FALLBACK_PARSER_SYSTEM_PROMPT
    if (window.api?.getResumeParserPrompt) {
      try {
        const diskPrompt = await window.api.getResumeParserPrompt()
        if (diskPrompt && diskPrompt.trim().length > 0) {
          systemPrompt = diskPrompt
        }
      } catch (promptErr) {
        Logger.warn(
          'ResumeStructuredParser.ts',
          'parseRawResume',
          'Could not read prompt from disk via IPC, using embedded fallback prompt',
          promptErr
        )
      }
    }

    const userPrompt = `Convert the supplied raw resume into a ResumeDocument while preserving ALL information from the original resume. Return ONLY valid JSON conforming to the schema.

--- RAW RESUME TEXT ---
${rawText}
----------------------`

    // Call OpenAI completions with the encrypted key via Electron preload API
    const result = await window.api.openaiChatCompletionTracked({
      encryptedKey,
      text: userPrompt,
      systemMessage: systemPrompt,
      jsonMode: true
    })

    if (!result || !result.content) {
      throw new Error('Failed to get response from OpenAI parse-resume completion')
    }

    // Record usage in the database if userId is provided (fire-and-forget)
    if (userId) {
      try {
        const { trackApiUsage } = await import('./trackUsage')
        trackApiUsage(userId, 'RESUME_PARSE', {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          model: result.usage.model
        }).catch((e) =>
          Logger.error('ResumeStructuredParser.ts', 'parseRawResume', 'trackApiUsage failed', e)
        )
      } catch (trackErr) {
        Logger.error(
          'ResumeStructuredParser.ts',
          'parseRawResume',
          'Failed to track API usage',
          trackErr
        )
      }
    }

    let parsedOutput: ResumeDocument
    try {
      let rawContent = result.content.trim()
      // Remove any accidental markdown code fences if present
      if (rawContent.startsWith('```')) {
        rawContent = rawContent.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      }
      parsedOutput = JSON.parse(rawContent) as ResumeDocument
    } catch (err) {
      Logger.error(
        'ResumeStructuredParser.ts',
        'parseRawResume',
        'Failed to parse OpenAI JSON response',
        result.content
      )
      throw new Error(
        'Failed to parse structured JSON from AI completion: ' +
          (err instanceof Error ? err.message : String(err))
      )
    }

    // Ensure basic required fields exist
    if (!parsedOutput.id) parsedOutput.id = 'resume_document'
    if (!parsedOutput.version) parsedOutput.version = 1
    if (!parsedOutput.metadata) {
      parsedOutput.metadata = {
        name: null,
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        github: null,
        portfolio: null
      }
    }
    if (!Array.isArray(parsedOutput.sections)) {
      parsedOutput.sections = []
    }

    return parsedOutput
  }

  /**
   * Parses the raw resume text using OpenAI, saves the output to `storage/resumes/${resumeId}.json`
   * and saves the output to `resumes.structured_data` in Supabase.
   */
  static async parseAndSave(
    supabase: SupabaseClient,
    userId: string,
    resumeId: string,
    rawText: string,
    encryptedKey?: string
  ): Promise<ResumeDocument> {
    const parsedOutput = await this.parseRawResume(rawText, encryptedKey, userId)

    // 1. Save structured output to resumes table in Supabase
    const { error: updateErr } = await supabase
      .from('resumes')
      .update({
        structured_data: parsedOutput,
        raw_resume_data: rawText
      })
      .eq('id', resumeId)

    if (updateErr) {
      Logger.error(
        'ResumeStructuredParser.ts',
        'parseAndSave',
        'Failed to update structured_data in resumes table',
        updateErr
      )
    }

    // 2. Save structured output to local file storage (storage/resumes/${resumeId}.json)
    if (window.api?.saveParsedResume) {
      try {
        await window.api.saveParsedResume(resumeId, parsedOutput)
        Logger.info(
          'ResumeStructuredParser.ts',
          'parseAndSave',
          `Successfully saved parsed resume to storage/resumes/${resumeId}.json`
        )
      } catch (fileErr) {
        Logger.error(
          'ResumeStructuredParser.ts',
          'parseAndSave',
          `Failed to save parsed resume to storage/resumes/${resumeId}.json`,
          fileErr
        )
      }
    }

    return parsedOutput
  }

  /**
   * Fallback structure builder when AI is unavailable or offline
   */
  private static createFallbackStructure(rawText: string): ResumeDocument {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const phoneMatch = rawText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    const githubMatch = rawText.match(/github\.com\/[a-zA-Z0-9_-]+/i)
    const linkedinMatch = rawText.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i)

    const firstLine = lines[0] || 'Candidate'

    return {
      id: 'resume_document',
      version: 1,
      metadata: {
        name: firstLine,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        location: null,
        linkedin: linkedinMatch ? linkedinMatch[0] : null,
        github: githubMatch ? githubMatch[0] : null,
        portfolio: null
      },
      sections: [
        {
          id: 'section_001',
          title: 'Raw Resume Content',
          type: 'custom',
          elements: lines.map((line, idx) => ({
            id: `element_${idx + 1}`,
            type: 'text',
            content: line,
            metadata: {}
          })),
          metadata: {}
        }
      ]
    }
  }
}
