import { app, shell, BrowserWindow, ipcMain, safeStorage, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { extractText } from 'unpdf'
import { LLMInitializer } from '../utils/LLMInitializer'
import { runResumeMatchAnalysis, runResumeTailor, runCoverLetterGeneration } from '../utils/LLMFuntions'
import { redis } from '../utils/redis'
import { generateText as aiGenerateText, Output } from 'ai'
import { z } from 'zod'
import { PortalNavigationManager } from './portal/PortalNavigationManager'
import Logger from '../utils/logger'
import {
  writeToFile,
  readPromptFile,
  readJsonFromFile,
  fileExists,
  listResumeFiles,
  RESUME_PARSER_PROMPT_FILE
} from '../utils/FileOperations'
import { applyEditPlanToResume } from '../utils/applyEditPlan'
import { EDIT_PLAN_FILE } from '../utils/config'

let mainWindow: BrowserWindow | null = null

const resolvingRequirementsSchema = z.object({
  questions: z.array(
    z.object({
      requirement: z.string().describe('The original requirement string from the input list'),
      question: z
        .string()
        .describe(
          'Targeted question to ask the candidate to determine if they possess this skill or experience. The first step MUST be a Yes/No question (e.g. "Do you have experience with...?")'
        ),
      step1Type: z.enum(['YES_NO']).describe('First step type is always YES_NO'),
      options: z.array(z.string()).describe('Options for the first step, e.g. ["Yes", "No"]'),
      followUp: z
        .string()
        .describe(
          'Follow-up prompt to gather more context or concrete project examples if the candidate answers Yes'
        )
    })
  )
})

export type ResolvingRequirementsOutput = z.infer<typeof resolvingRequirementsSchema>

export async function resolvingRequirements(
  requirements: string[],
  apiKey: string,
  onProgress?: (progress: any) => void,
  _userId?: string
): Promise<ResolvingRequirementsOutput & { usage?: any }> {
  if (!requirements || requirements.length === 0) {
    return { questions: [] }
  }

  if (!apiKey) {
    throw new Error('OpenAI API key is required to resolve requirements.')
  }

  onProgress?.({
    status: 'started',
    message: 'Generating clarification questions for unresolved requirements'
  })

  const { client, model } = LLMInitializer.initialize(apiKey).openAI()

  const systemPrompt = `You are an expert technical interviewer and resume strategist.
You are given a list of unresolved job requirements (skills, technologies, qualifications, or experiences not evidenced in the candidate's resume).
For each requirement:
1. Return the original requirement string.
2. Formulate a clear, direct question to ask the candidate whether they possess this skill or experience.
CRITICAL REQUIREMENT: The first step of the question MUST be a Yes/No question (e.g., "Do you have professional experience with Docker?", "Have you led a project using GraphQL in production?").
3. Include an optional follow-up question if they answer "Yes" to prompt for specific examples, metrics, or technologies used.`

  const userPrompt = `Generate questions for the following unresolved requirements:\n${JSON.stringify(requirements, null, 2)}`

  const output = Output.object({
    schema: resolvingRequirementsSchema
  })

  const result = await aiGenerateText({
    model: client(model),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.2,
    output
  })

  onProgress?.({
    status: 'completed',
    message: 'Questions generated successfully',
    data: { usage: result.usage }
  })

  return {
    ...result.output,
    usage: {
      inputTokens: result.usage?.inputTokens ?? 0,
      outputTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
      model: model || 'gpt-4o-mini'
    }
  }
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    // ...(process.platform === 'linux' ? { icon } : {}),
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  PortalNavigationManager.getInstance().setMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open dev tools in development mode
  if (is.dev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.careerflow.app')


  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC Portals Switch
  ipcMain.on('portal:switch', (_, portalId: string, resetToDefault?: boolean) => {
    PortalNavigationManager.getInstance().switchPortal(portalId, resetToDefault)
  })

  // IPC External Link Behavior Toggle
  ipcMain.on('portal:set-external-behavior', (_, behavior: 'controlled' | 'system') => {
    PortalNavigationManager.getInstance().setExternalBehavior(behavior)
  })

  ipcMain.handle('portal:get-external-behavior', () => {
    return PortalNavigationManager.getInstance().getExternalBehavior()
  })

  // IPC Navigation Control
  ipcMain.on('portal:navigate', (_, action: 'back' | 'forward' | 'reload') => {
    PortalNavigationManager.getInstance().navigate(undefined, action)
  })

  // IPC Load Specific URL
  ipcMain.on('portal:load-url', (_, url: string) => {
    PortalNavigationManager.getInstance().loadURL(undefined, url)
  })

  // IPC Update Bounds from ResizeObserver
  ipcMain.on(
    'portal:update-bounds',
    (_, rect: { x: number; y: number; width: number; height: number }) => {
      PortalNavigationManager.getInstance().updateBounds(rect)
    }
  )

  // IPC Scraping Text from Active Portal
  ipcMain.handle('portal:get-active-text', async () => {
    return await PortalNavigationManager.getInstance().getActiveText()
  })

  // IPC Resume Parser to get the initial resume data
  ipcMain.handle('resume:parse-bytes', async (_, bytes: Uint8Array) => {
    try {
      const { text } = await extractText(bytes)
      return Array.isArray(text) ? text.join('\n') : text
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:parse-bytes', 'Error invoking unpdf parser', error)
      throw error
    }
  })

  // IPC Save parsed resume structure to storage/resumes/${resumeId}.json
  ipcMain.handle('resume:save-parsed-structure', async (_, resumeId: string, data: any) => {
    try {
      const filename = `resumes/${resumeId}.json`
      const filePath = await writeToFile(filename, data)
      Logger.info('src/main/index.ts', 'resume:save-parsed-structure', `Saved parsed resume structure to ${filePath}`)
      return { success: true, filePath }
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:save-parsed-structure', 'Error saving parsed resume structure', error)
      throw error
    }
  })

  // IPC Get parsed resume structure from storage/resumes/${resumeId}.json
  ipcMain.handle('resume:get-parsed-structure', async (_, resumeId: string) => {
    try {
      const filename = `resumes/${resumeId}.json`
      const exists = await fileExists(filename)
      if (exists) {
        return await readJsonFromFile(filename)
      }
      return null
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:get-parsed-structure', 'Error reading parsed resume structure', error)
      return null
    }
  })

  // IPC List parsed resumes from storage/resumes/
  ipcMain.handle('resume:list-parsed', async () => {
    try {
      return await listResumeFiles()
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:list-parsed', 'Error listing resume files from storage', error)
      return []
    }
  })

  // IPC Read resume parser prompt from src/prompts/resume_parser_prompt.txt
  ipcMain.handle('resume:get-parser-prompt', async () => {
    try {
      return await readPromptFile(RESUME_PARSER_PROMPT_FILE)
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:get-parser-prompt', 'Error reading parser prompt from src/prompts', error)
      return null
    }
  })

  // IPC Get current edit plan from storage/edit_plan.json
  ipcMain.handle('resume:get-edit-plan', async () => {
    try {
      if (await fileExists(EDIT_PLAN_FILE)) {
        return await readJsonFromFile(EDIT_PLAN_FILE)
      }
      return null
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:get-edit-plan', 'Error reading edit plan', error)
      return null
    }
  })

  // IPC Get current tailored resume snapshot from storage/tailored_resume.json
  ipcMain.handle('resume:get-tailored', async () => {
    try {
      if (await fileExists('tailored_resume.json')) {
        return await readJsonFromFile('tailored_resume.json')
      }
      return null
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:get-tailored', 'Error reading tailored resume', error)
      return null
    }
  })

  // IPC Apply edit plan directly to a resume in storage/resumes/${resumeId}.json
  ipcMain.handle('resume:apply-edit-plan', async (_, targetResumeId: string, editPlan: any) => {
    try {
      const filename = `resumes/${targetResumeId}.json`
      const backupFile = `resumes/${targetResumeId}.original.json`

      if (!(await fileExists(filename)) && !(await fileExists(backupFile))) {
        throw new Error(`Resume not found in storage: ${filename}`)
      }

      // Base resume is the original untouched file if present
      let original: any = null
      if (await fileExists(backupFile)) {
        original = await readJsonFromFile(backupFile)
      } else {
        original = await readJsonFromFile(filename)
        await writeToFile(backupFile, original)
      }

      const updated = applyEditPlanToResume(original as any, editPlan)
      await writeToFile(filename, updated)
      await writeToFile('tailored_resume.json', updated)
      Logger.info('src/main/index.ts', 'resume:apply-edit-plan', `Successfully applied edits to storage/${filename}`)
      return { success: true, resume: updated }
    } catch (error) {
      Logger.error('src/main/index.ts', 'resume:apply-edit-plan', 'Error applying edit plan', error)
      throw error
    }
  })


  // IPC handler for llm calling
  ipcMain.handle(
    'LLM:initializeAndRun',
    async (event, provider: string, resumeData: string, apiKey: string, jobData: string, userId?: string) => {
      Logger.info('src/main/index.ts', 'LLM:initializeAndRun', `Invoking LLM with provider: ${provider}`)
      const resolvedKey = apiKey.startsWith('sk-') ? apiKey : decryptKey(apiKey)
      const { client, model } = LLMInitializer.initialize(resolvedKey).openAI()
      const result = await runResumeMatchAnalysis(
        client,
        model,
        jobData,
        resumeData,
        (progress) => {
          event.sender.send('LLM:progress', progress)
        },
        userId
      )
      Logger.info('src/main/index.ts', 'LLM:initializeAndRun', 'RESULT', result)
      return result
    }
  )

  // IPC handler for tailoring resume — strictly uses structured resume data from storage/resumes/
  ipcMain.handle(
    'LLM:TailorResume',
    async (
      event,
      provider: string,
      resumeData: string,
      apiKey: string,
      dataToTailor: string,
      resolvedRequirements?: string[] | string,
      userId?: string,
      resumeId?: string
    ) => {
      Logger.info('src/main/index.ts', 'LLM:TailorResume', `Invoking LLM for tailoring with provider: ${provider}`, {
        hasResumeId: !!resumeId,
        resumeDataLength: resumeData?.length
      })

      let finalResumeData = resumeData

      // 1. If explicit resumeId is provided, or if resumeData is a short ID/filename, load directly from storage/resumes
      const candidateId =
        resumeId ||
        (typeof resumeData === 'string' &&
        resumeData.trim().length < 100 &&
        !resumeData.trim().startsWith('{')
          ? resumeData.trim().replace(/\.json$/, '')
          : null)

      let resolvedResumeId = candidateId

      if (candidateId) {
        const candidateFile = `resumes/${candidateId}.json`
        const backupFile = `resumes/${candidateId}.original.json`
        if (await fileExists(backupFile)) {
          const fileContent = await readJsonFromFile(backupFile)
          finalResumeData = JSON.stringify(fileContent, null, 2)
          Logger.info('src/main/index.ts', 'LLM:TailorResume', `Loaded clean base resume from storage/${backupFile}`)
        } else if (await fileExists(candidateFile)) {
          const fileContent = await readJsonFromFile(candidateFile)
          finalResumeData = JSON.stringify(fileContent, null, 2)
          Logger.info('src/main/index.ts', 'LLM:TailorResume', `Loaded structured resume from storage/${candidateFile}`)
        }
      }

      // 2. Ensure data is structured JSON and NOT raw unparsed resume text
      let isJson = false
      try {
        const parsed = JSON.parse(finalResumeData)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          isJson = true
        }
      } catch {
        isJson = false
      }

      if (!isJson) {
        // Fallback: check if any structured resume exists in storage/resumes
        Logger.warn(
          'src/main/index.ts',
          'LLM:TailorResume',
          'Raw or non-JSON resume data passed. Searching storage/resumes for structured JSON resume...'
        )
        const resumeFiles = await listResumeFiles()
        if (resumeFiles.length > 0) {
          resolvedResumeId = resumeFiles[0].replace(/\.json$/, '')
          const fallbackFile = `resumes/${resumeFiles[0]}`
          const fileContent = await readJsonFromFile(fallbackFile)
          finalResumeData = JSON.stringify(fileContent, null, 2)
          Logger.info(
            'src/main/index.ts',
            'LLM:TailorResume',
            `Recovered structured resume from storage/${fallbackFile}`
          )
        } else {
          throw new Error(
            'Tailoring pipeline error: Structured resume data from storage/resumes is required. Raw resumes are not permitted in the tailoring pipeline.'
          )
        }
      }

      if (!resolvedResumeId) {
        try {
          const existingFiles = await listResumeFiles()
          if (existingFiles.length > 0) {
            resolvedResumeId = existingFiles[0].replace(/\.json$/, '')
          }
        } catch {
          // Ignore
        }
      }

      const resolvedKey = apiKey.startsWith('sk-') ? apiKey : decryptKey(apiKey)
      const { client, model } = LLMInitializer.initialize(resolvedKey).openAI()
      const result = await runResumeTailor(
        client,
        model,
        finalResumeData,
        dataToTailor,
        resolvedRequirements,
        (progress) => {
          event.sender.send('LLM:progress', progress)
        },
        userId
      )
      Logger.info('src/main/index.ts', 'LLM:TailorResume', 'TAILOR RESULT', result)

      // 3. Apply edit plan to the structured resume JSON
      let parsedOriginal: any = null
      try {
        parsedOriginal = JSON.parse(finalResumeData)
      } catch (err) {
        Logger.error('src/main/index.ts', 'LLM:TailorResume', 'Failed parsing finalResumeData for edit application', err)
      }

      let tailoredResume = parsedOriginal
      if (parsedOriginal && result?.edits && Array.isArray(result.edits)) {
        try {
          // If backup exists, use that as clean base so we strictly follow edit plan without accumulating dirty edits
          let baseForEdit = parsedOriginal
          const targetId = resolvedResumeId
          if (targetId) {
            const backupFile = `resumes/${targetId}.original.json`
            if (await fileExists(backupFile)) {
              baseForEdit = await readJsonFromFile(backupFile)
            } else {
              await writeToFile(backupFile, parsedOriginal)
            }
          }

          tailoredResume = applyEditPlanToResume(baseForEdit, result)
          ;(tailoredResume as any).edits = result.edits

          // Determine target file to persist
          if (targetId) {
            const primaryFile = `resumes/${targetId}.json`
            // Update primary resume file in storage/resumes/
            await writeToFile(primaryFile, tailoredResume)
            Logger.info('src/main/index.ts', 'LLM:TailorResume', `Saved edited resume to storage/${primaryFile}`)
          }

          // Also save general tailored resume snapshot
          await writeToFile('tailored_resume.json', tailoredResume)
        } catch (applyErr) {
          Logger.error('src/main/index.ts', 'LLM:TailorResume', 'Error applying edit plan to resume', applyErr)
        }
      }

      return {
        ...result,
        tailoredResume
      }
    }
  )

  // IPC handler for cover letter generation
  ipcMain.handle(
    'LLM:GenerateCoverLetter',
    async (
      event,
      provider: string,
      resumeData: string,
      apiKey: string,
      jobData: string,
      userId?: string
    ) => {
      Logger.info('src/main/index.ts', 'LLM:GenerateCoverLetter', `Invoking LLM for cover letter with provider: ${provider}`)
      const resolvedKey = apiKey.startsWith('sk-') ? apiKey : decryptKey(apiKey)
      const { client, model } = LLMInitializer.initialize(resolvedKey).openAI()
      const result = await runCoverLetterGeneration(
        client,
        model,
        jobData,
        resumeData,
        (progress) => {
          event.sender.send('LLM:progress', progress)
        },
        userId
      )
      Logger.info('src/main/index.ts', 'LLM:GenerateCoverLetter', 'COVER LETTER RESULT', result)
      return result
    }
  )

  // IPC handler for resolving unresolved requirements
  ipcMain.handle(
    'LLM:resolvingRequirements',
    async (event, requirements: string[], apiKey: string, userId?: string) => {
      Logger.info('src/main/index.ts', 'LLM:resolvingRequirements', 'Invoking resolvingRequirements with requirements', requirements)
      const resolvedKey = apiKey.startsWith('sk-') ? apiKey : decryptKey(apiKey)
      const result = await resolvingRequirements(
        requirements,
        resolvedKey,
        (progress) => {
          event.sender.send('LLM:progress', progress)
        },
        userId
      )
      Logger.info('src/main/index.ts', 'LLM:resolvingRequirements', 'RESOLVING REQUIREMENTS RESULT', result)
      return result
    }
  )

  // IPC handlers for Upstash Redis (to bypass frontend CSP limits)
  ipcMain.handle('redis:get', async (_, key: string) => {
    if (!redis) return null
    try {
      return await redis.get(key)
    } catch (err) {
      Logger.error('src/main/index.ts', 'redis:get', 'Failed to get key from Redis', err)
      return null
    }
  })

  ipcMain.handle('redis:set', async (_, key: string, value: any) => {
    if (!redis) return null
    try {
      return await redis.set(key, value)
    } catch (err) {
      Logger.error('src/main/index.ts', 'redis:set', 'Failed to set key in Redis', err)
      return null
    }
  })


  // ─── BYOK: Encrypt an OpenAI API key using Electron safeStorage ─────────────
  // Returns { encryptedKey: string (base64), keyLast4: string }
  ipcMain.handle('openai-key:encrypt', async (_, rawKey: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this platform.')
    }
    const encrypted = safeStorage.encryptString(rawKey)
    const encryptedKey = encrypted.toString('base64')
    const keyLast4 = rawKey.slice(-4)
    return { encryptedKey, keyLast4 }
  })

  // ─── BYOK: Decrypt a stored encrypted key (for internal AI call use only) ───
  // Used by tracked IPC handlers — NOT exposed to renderer via preload
  function decryptKey(encryptedKeyBase64: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this platform.')
    }
    const buf = Buffer.from(encryptedKeyBase64, 'base64')
    return safeStorage.decryptString(buf)
  }



  // ─── BYOK: Validate an API key by making a lightweight OpenAI request ────────
  // Returns { valid: boolean, error?: string }
  ipcMain.handle('openai-key:validate', async (_, rawKey: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${rawKey}` }
      })
      if (response.ok) {
        return { valid: true }
      }
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }))
      return { valid: false, error: err?.error?.message || 'Invalid API key.' }
    } catch (e: unknown) {
      return { valid: false, error: e instanceof Error ? e.message : 'Network error.' }
    }
  })

  // ─── BYOK: Chat completion with usage tracking ────────────────────────────────
  // Decrypts key in main process, calls OpenAI, returns { content, usage }
  ipcMain.handle(
    'openai:chat-completion-tracked',
    async (
      _,
      params: {
        encryptedKey: string
        text: string
        systemMessage: string
        model?: string
        jsonMode?: boolean
      }
    ) => {
      const { encryptedKey, text, systemMessage, model = 'gpt-4o-mini', jsonMode = false } = params
      const apiKey = decryptKey(encryptedKey)

      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: text }
        ],
        temperature: 0.1
      }
      if (jsonMode) body.response_format = { type: 'json_object' }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI API Error: ${response.statusText} - ${errText}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content ?? ''
      const usage = {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        model: data.model ?? model
      }
      return { content, usage }
    }
  )

  // ─── BYOK: Embeddings with usage tracking ─────────────────────────────────────
  // Returns { embedding, usage }
  ipcMain.handle(
    'openai:embeddings-tracked',
    async (_, params: { encryptedKey: string; text: string; model?: string }) => {
      const { encryptedKey, text, model = 'text-embedding-3-small' } = params
      const apiKey = decryptKey(encryptedKey)

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: text })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI Embedding Error: ${response.statusText} - ${errText}`)
      }

      const data = await response.json()
      const embedding = data.data?.[0]?.embedding ?? []
      const usage = {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: 0,
        totalTokens: data.usage?.total_tokens ?? 0,
        model: data.model ?? model
      }
      return { embedding, usage }
    }
  )

  // ─── Native Resume PDF Export ────────────────────────────────────────────────
  ipcMain.handle(
    'resume:export-pdf',
    async (_, params: { html: string; defaultFileName?: string }) => {
      const { html, defaultFileName = 'Tailored_Resume.pdf' } = params

      const saveResult = await dialog.showSaveDialog({
        title: 'Save Tailored Resume PDF',
        defaultPath: defaultFileName,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      })

      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, canceled: true }
      }

      const printWin = new BrowserWindow({
        show: false,
        width: 794,
        height: 1123,
        webPreferences: {
          sandbox: true
        }
      })

      try {
        await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        // Brief pause to allow fonts, SVG icons, and styles to compute layout
        await new Promise((resolve) => setTimeout(resolve, 350))

        const pdfBuffer = await printWin.webContents.printToPDF({
          pageSize: 'A4',
          printBackground: true,
          margins: {
            marginType: 'none'
          }
        })

        await fs.promises.writeFile(saveResult.filePath, pdfBuffer)
        Logger.info('index.ts', 'resume:export-pdf', 'Resume exported successfully to', saveResult.filePath)
        return { success: true, filePath: saveResult.filePath }
      } catch (err: any) {
        Logger.error('index.ts', 'resume:export-pdf', 'Failed to generate/save PDF', err)
        return { success: false, error: err?.message || 'Failed to generate PDF' }
      } finally {
        if (!printWin.isDestroyed()) {
          printWin.destroy()
        }
      }
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
