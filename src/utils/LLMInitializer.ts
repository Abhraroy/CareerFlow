import { createOpenAI } from '@ai-sdk/openai'

export type LLMProgressStatus =
  'initializing' | 'provider-selected' | 'preparing' | 'started' | 'completed' | 'error'

export type LLMProgress = {
  status: LLMProgressStatus
  message?: string
  data?: unknown
}

export type LLMProgressCallback = (progress: LLMProgress) => void

class LLMInitializer {
  constructor(private apiKey: string) {}

  static initialize(apiKey: string) {
    return new LLMInitializer(apiKey)
  }

  openAI() {
    const model = 'gpt-4o-mini'

    const client = createOpenAI({
      apiKey: this.apiKey
    })

    return { client, model }
  }
}

export { LLMInitializer }
