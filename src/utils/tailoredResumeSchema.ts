import { z } from 'zod'

export const ResumeEditSchema = z
  .object({
    targetId: z
      .string()
      .min(1)
      .describe(
        'ID of an existing editable resume element or valid existing insertion target.'
      ),

    operation: z
      .enum(['replace', 'insert_before', 'insert_after', 'append'])
      .describe(
        'Operation to apply to the existing element identified by targetId.'
      ),

    originalContent: z
      .string()
      .min(1)
      .describe(
        'Exact current content of the target element or insertion target as it appears in ResumeDocument.'
      ),

    newContent: z
      .string()
      .min(1)
      .describe('New content to apply to the target element or insertion point.'),

    reason: z
      .string()
      .min(1)
      .describe(
        'Concise explanation of why this edit improves alignment with the target job.'
      )
  })
  .strict()

export const EditPlanSchema = z
  .object({
    edits: z
      .array(ResumeEditSchema)
      .describe('Only meaningful targeted edits; empty when no edits are needed.')
  })
  .strict()

export type ResumeEdit = z.infer<typeof ResumeEditSchema>
export type EditPlan = z.infer<typeof EditPlanSchema>

// Export alias for compatibility
export const tailoredResumeSchema = EditPlanSchema
export type TailoredResume = EditPlan
