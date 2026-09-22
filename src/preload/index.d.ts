export interface PortalNavigationState {
  portalId: string
  url: string
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  error?: {
    code: number
    description: string
    url: string
  } | null
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      switchPortal: (portalId: string, resetToDefault?: boolean) => void
      setExternalBehavior: (behavior: 'controlled' | 'system') => void
      getExternalBehavior: () => Promise<'controlled' | 'system'>
      onExternalBehaviorChanged: (callback: (behavior: 'controlled' | 'system') => void) => () => void
      navigate: (action: 'back' | 'forward' | 'reload') => void
      loadURL: (url: string) => void
      onNavigationState: (callback: (state: PortalNavigationState) => void) => () => void
      onURLChanged: (callback: (data: { portalId: string; url: string }) => void) => () => void
      onDetectedApplyClick: (
        callback: (data: { portalId: string; url: string; buttonText: string; pageTitle: string; timestamp: string }) => void
      ) => () => void
      onLLMProgress: (callback: (progress: any) => void) => () => void
      updateBounds: (rect: { x: number; y: number; width: number; height: number }) => void
      parseResumeBytes: (bytes: Uint8Array, fileName: string) => Promise<string>
      saveParsedResume: (resumeId: string, data: any) => Promise<{ success: boolean; filePath: string }>
      getParsedResume: (resumeId: string) => Promise<any | null>
      listParsedResumes: () => Promise<string[]>
      getResumeParserPrompt: () => Promise<string | null>
      applyEditPlan: (resumeId: string, editPlan: any) => Promise<{ success: boolean; resume: any }>
      getEditPlan: () => Promise<any | null>
      getTailoredResume: () => Promise<any | null>
      getActiveText: () => Promise<any>
      redisGet: (key: string) => Promise<any>
      redisSet: (key: string, value: any) => Promise<any>
      encryptOpenAIKey: (rawKey: string) => Promise<{ encryptedKey: string; keyLast4: string }>
      validateOpenAIKey: (rawKey: string) => Promise<{ valid: boolean; error?: string }>
      openaiChatCompletionTracked: (params: {
        encryptedKey: string
        text: string
        systemMessage: string
        model?: string
        jsonMode?: boolean
      }) => Promise<{
        content: string
        usage: { inputTokens: number; outputTokens: number; totalTokens: number; model: string }
      }>
      openaiEmbeddingsTracked: (params: {
        encryptedKey: string
        text: string
        model?: string
      }) => Promise<{
        embedding: number[]
        usage: { inputTokens: number; outputTokens: number; totalTokens: number; model: string }
      }>
      LLMResponse: (
        provider: string,
        resumeData: string,
        apiKey: string,
        jobData: string,
        userId?: string
      ) => Promise<any>
      LLMResumeTailoring: (
        provider: string,
        resumeData: string,
        apiKey: string,
        dataToTailor: string,
        resolvedRequirements?: string[] | string,
        userId?: string,
        resumeId?: string
      ) => Promise<any>
      LLMGenerateCoverLetter: (
        provider: string,
        resumeData: string,
        apiKey: string,
        jobData: string,
        userId?: string
      ) => Promise<any>
      resolvingRequirements: (
        requirements: string[],
        apiKey: string,
        userId?: string
      ) => Promise<any>
      exportResumeToPdf: (params: {
        html: string
        defaultFileName?: string
      }) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
    }
  }
}
