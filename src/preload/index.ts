import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import Logger from '../utils/logger'

// Custom APIs for renderer
const api = {
  switchPortal: (portalId: string, resetToDefault?: boolean) =>
    ipcRenderer.send('portal:switch', portalId, resetToDefault),
  setExternalBehavior: (behavior: 'controlled' | 'system') =>
    ipcRenderer.send('portal:set-external-behavior', behavior),
  getExternalBehavior: (): Promise<'controlled' | 'system'> =>
    ipcRenderer.invoke('portal:get-external-behavior'),
  onExternalBehaviorChanged: (callback: (behavior: 'controlled' | 'system') => void) => {
    const subscription = (_event: unknown, behavior: 'controlled' | 'system'): void =>
      callback(behavior)
    ipcRenderer.on('portal:external-behavior-changed', subscription)
    return () => {
      ipcRenderer.removeListener('portal:external-behavior-changed', subscription)
    }
  },
  navigate: (action: 'back' | 'forward' | 'reload') => ipcRenderer.send('portal:navigate', action),
  loadURL: (url: string) => ipcRenderer.send('portal:load-url', url),
  onNavigationState: (
    callback: (state: {
      portalId: string
      url: string
      isLoading: boolean
      canGoBack: boolean
      canGoForward: boolean
      error?: { code: number; description: string; url: string } | null
    }) => void
  ) => {
    const subscription = (
      _event: unknown,
      state: {
        portalId: string
        url: string
        isLoading: boolean
        canGoBack: boolean
        canGoForward: boolean
        error?: { code: number; description: string; url: string } | null
      }
    ): void => callback(state)
    ipcRenderer.on('portal:navigation-state', subscription)
    return () => {
      ipcRenderer.removeListener('portal:navigation-state', subscription)
    }
  },
  onURLChanged: (callback: (data: { portalId: string; url: string }) => void) => {
    const subscription = (_event: unknown, data: { portalId: string; url: string }): void =>
      callback(data)
    ipcRenderer.on('portal:url-changed', subscription)
    return () => {
      ipcRenderer.removeListener('portal:url-changed', subscription)
    }
  },
  onDetectedApplyClick: (
    callback: (data: { portalId: string; url: string; buttonText: string; pageTitle: string; timestamp: string }) => void
  ) => {
    const subscription = (
      _event: unknown,
      data: { portalId: string; url: string; buttonText: string; pageTitle: string; timestamp: string }
    ): void => callback(data)
    ipcRenderer.on('portal:detected-apply-click', subscription)
    return () => {
      ipcRenderer.removeListener('portal:detected-apply-click', subscription)
    }
  },
  onLLMProgress: (callback: (progress: any) => void) => {
    const subscription = (_event: unknown, progress: any): void => callback(progress)
    ipcRenderer.on('LLM:progress', subscription)
    return () => {
      ipcRenderer.removeListener('LLM:progress', subscription)
    }
  },
  updateBounds: (rect: { x: number; y: number; width: number; height: number }) => {
    ipcRenderer.send('portal:update-bounds', rect)
  },
  parseResumeBytes: (bytes: Uint8Array, fileName: string) =>
    ipcRenderer.invoke('resume:parse-bytes', bytes, fileName),
  saveParsedResume: (resumeId: string, data: any): Promise<{ success: boolean; filePath: string }> =>
    ipcRenderer.invoke('resume:save-parsed-structure', resumeId, data),
  getParsedResume: (resumeId: string): Promise<any | null> =>
    ipcRenderer.invoke('resume:get-parsed-structure', resumeId),
  listParsedResumes: (): Promise<string[]> =>
    ipcRenderer.invoke('resume:list-parsed'),
  getResumeParserPrompt: (): Promise<string | null> =>
    ipcRenderer.invoke('resume:get-parser-prompt'),
  applyEditPlan: (resumeId: string, editPlan: any): Promise<{ success: boolean; resume: any }> =>
    ipcRenderer.invoke('resume:apply-edit-plan', resumeId, editPlan),
  getEditPlan: (): Promise<any | null> =>
    ipcRenderer.invoke('resume:get-edit-plan'),
  getTailoredResume: (): Promise<any | null> =>
    ipcRenderer.invoke('resume:get-tailored'),
  // Legacy OpenAI calls (kept for backward compat)
  LLMResponse: (provider: string, resumeData: string, apiKey: string, jobData: string, userId?: string) =>
    ipcRenderer.invoke('LLM:initializeAndRun', provider, resumeData, apiKey, jobData, userId),
  
  // Tailoring resume LLM calls
  LLMResumeTailoring: (
    provider: string,
    resumeData: string,
    apiKey: string,
    dataToTailor: string,
    resolvedRequirements?: string[] | string,
    userId?: string,
    resumeId?: string
  ) =>
    ipcRenderer.invoke('LLM:TailorResume', provider, resumeData, apiKey, dataToTailor, resolvedRequirements, userId, resumeId),

  // Cover letter generation LLM call
  LLMGenerateCoverLetter: (
    provider: string,
    resumeData: string,
    apiKey: string,
    jobData: string,
    userId?: string
  ) =>
    ipcRenderer.invoke('LLM:GenerateCoverLetter', provider, resumeData, apiKey, jobData, userId),

  // Resolving requirements LLM call
  resolvingRequirements: (requirements: string[], apiKey: string, userId?: string) =>
    ipcRenderer.invoke('LLM:resolvingRequirements', requirements, apiKey, userId),

  getActiveText: () => ipcRenderer.invoke('portal:get-active-text'),

  redisGet: (key: string) => ipcRenderer.invoke('redis:get', key),
  redisSet: (key: string, value: any) => ipcRenderer.invoke('redis:set', key, value),

  // ─── BYOK: Key management ─────────────────────────────────────────────────
  /** Encrypt a raw OpenAI key using Electron safeStorage (OS keychain). Returns base64 cipher + last4. */
  encryptOpenAIKey: (rawKey: string): Promise<{ encryptedKey: string; keyLast4: string }> =>
    ipcRenderer.invoke('openai-key:encrypt', rawKey),

  /** Validate a raw OpenAI key by calling /v1/models. Returns { valid, error? }. */
  validateOpenAIKey: (rawKey: string): Promise<{ valid: boolean; error?: string }> =>
    ipcRenderer.invoke('openai-key:validate', rawKey),

  // ─── BYOK: Tracked AI calls (return content/embedding + usage metadata) ───
  /** Chat completion using encrypted key — decryption happens in main process. */
  openaiChatCompletionTracked: (params: {
    encryptedKey: string
    text: string
    systemMessage: string
    model?: string
    jsonMode?: boolean
  }): Promise<{
    content: string
    usage: { inputTokens: number; outputTokens: number; totalTokens: number; model: string }
  }> => ipcRenderer.invoke('openai:chat-completion-tracked', params),

  /** Embeddings using encrypted key — decryption happens in main process. */
  openaiEmbeddingsTracked: (params: {
    encryptedKey: string
    text: string
    model?: string
  }): Promise<{
    embedding: number[]
    usage: { inputTokens: number; outputTokens: number; totalTokens: number; model: string }
  }> => ipcRenderer.invoke('openai:embeddings-tracked', params),

  /** Native Electron PDF export using webContents.printToPDF */
  exportResumeToPdf: (params: {
    html: string
    defaultFileName?: string
  }): Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }> =>
    ipcRenderer.invoke('resume:export-pdf', params)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    Logger.error('src/preload/index.ts', 'exposeInMainWorld', 'Failed to expose context bridge', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
