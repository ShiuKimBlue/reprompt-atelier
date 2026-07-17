export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  choices: {
    index: number
    message: ChatMessage
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function chatCompletion(
  baseUrl: string,
  apiKey: string,
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      stream: request.stream ?? false,
    }),
  })

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error?.message ?? errorMessage
    } catch {
      // ignore parse failure
    }
    throw new ApiError(errorMessage, response.status)
  }

  return response.json()
}
