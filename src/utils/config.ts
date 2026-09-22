/**
 * Storage File Name Constants
 * Standardized constant filenames used across the app for file storage operations.
 * Writing to these constant paths ensures files are directly overwritten on each write.
 */
export const JOB_DESCRIPTION_FILE = 'jobdescription/job_description.json'
export const LLM_RUN_FILE = 'llm_run.json'
export const TAILOR_RUN_FILE = 'tailor_run.json'
export const EDIT_PLAN_FILE = 'edit_plan.json'
export const SYSTEM_PROMPT_FILE = 'prompts/system_prompt.txt'
export const USER_PROMPT_FILE = 'prompts/user_prompt.txt'
export const TAILOR_SYSTEM_PROMPT_FILE = 'prompts/tailor_resume_system_prompt.txt'
export const TAILOR_USER_PROMPT_FILE = 'prompts/tailor_resume_user_prompt.txt'
export const COVER_LETTER_SYSTEM_PROMPT_FILE = 'prompts/cover_letter_system_prompt.txt'
export const COVER_LETTER_USER_PROMPT_FILE = 'prompts/cover_letter_user_prompt.txt'
export const RESUME_PARSER_PROMPT_FILE = 'prompts/resume_parser_prompt.txt'
export const RESUMES_STORAGE_DIR = 'resumes'

export const STORAGE_FILES = {
  JOB_DESCRIPTION: JOB_DESCRIPTION_FILE,
  LLM_RUN: LLM_RUN_FILE,
  TAILOR_RUN: TAILOR_RUN_FILE,
  EDIT_PLAN: EDIT_PLAN_FILE,
  SYSTEM_PROMPT: SYSTEM_PROMPT_FILE,
  USER_PROMPT: USER_PROMPT_FILE,
  TAILOR_SYSTEM_PROMPT: TAILOR_SYSTEM_PROMPT_FILE,
  TAILOR_USER_PROMPT: TAILOR_USER_PROMPT_FILE,
  COVER_LETTER_SYSTEM_PROMPT: COVER_LETTER_SYSTEM_PROMPT_FILE,
  COVER_LETTER_USER_PROMPT: COVER_LETTER_USER_PROMPT_FILE,
  RESUME_PARSER_PROMPT: RESUME_PARSER_PROMPT_FILE
} as const

