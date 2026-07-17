import { ChatOpenAI } from '@langchain/openai'
import type { ModelConfig } from '@/types'

export type ConnectionStatus = 'idle' | 'checking' | 'success' | 'failed' | 'cancelled'
export type ConnectionTestMode = 'text' | 'vision'

export interface ConnectionResult {
  status: ConnectionStatus
  latencyMs?: number
  errorMessage?: string
  errorKind?: 'auth' | 'not_found_model' | 'invalid_config' | 'rate_limit' | 'timeout' | 'network' | 'server' | 'unknown'
}

interface ConnectionTestOptions {
  mode?: ConnectionTestMode
  signal?: AbortSignal
}

type ConnectionMessageContent = string | Array<
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
>

const TEST_TIMEOUT_MS = 12_000
const SUCCESS_AUTO_RESET_MS = 2_400
const VISION_PROBE_IMAGE_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9pQAAAABJRU5ErkJggg=='

export function fingerprintModelConfig(config: ModelConfig): string {
  return JSON.stringify({
    baseUrl: config.baseUrl.trim(),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
  })
}

export function validateConnectionConfig(config: ModelConfig): ConnectionResult | null {
  if (!config.baseUrl.trim() || !config.apiKey.trim() || !config.model.trim()) {
    return { status: 'failed', errorMessage: 'Base URL、API Key、Model 需填完整后才能测试', errorKind: 'invalid_config' }
  }
  return null
}

export function buildConnectionTestMessage(mode: ConnectionTestMode): ConnectionMessageContent {
  if (mode === 'vision') {
    return [
      { type: 'text', text: 'Reply with only: ok' },
      { type: 'image_url', image_url: { url: VISION_PROBE_IMAGE_DATA_URL } },
    ]
  }
  return 'Reply with only: ok'
}

function extractResponseText(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''
  return content
    .map((block) => {
      if (typeof block === 'string') return block
      if (block && typeof block === 'object' && 'text' in block && typeof block.text === 'string') return block.text
      return ''
    })
    .join('')
    .trim()
}

function isAbortError(error: unknown): boolean {
  return (error as { name?: string })?.name === 'AbortError'
}

function createTimeoutSignal(parentSignal?: AbortSignal) {
  const controller = new AbortController()
  let timedOut = false
  const timeoutError = new DOMException('请求超时', 'TimeoutError')
  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort(timeoutError)
  }, TEST_TIMEOUT_MS)
  const abortFromParent = () => controller.abort(parentSignal?.reason)

  if (parentSignal?.aborted) abortFromParent()
  else parentSignal?.addEventListener('abort', abortFromParent, { once: true })

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut
    },
    cleanup() {
      clearTimeout(timeoutId)
      parentSignal?.removeEventListener('abort', abortFromParent)
    },
  }
}

export function classifyConnectionError(error: unknown): ConnectionResult {
  const elapsed = (error as { elapsedMs?: number })?.elapsedMs
  const status = (error as { status?: number })?.status
  const name = (error as { name?: string })?.name
  const message = (error as { message?: string })?.message ?? ''

  if (name === 'TimeoutError') return { status: 'failed', latencyMs: elapsed, errorMessage: '请求超时，请检查 Base URL、网络或服务响应', errorKind: 'timeout' }
  if (status === 401) return { status: 'failed', latencyMs: elapsed, errorMessage: 'API Key 鉴权失败（401）', errorKind: 'auth' }
  if (status === 403) return { status: 'failed', latencyMs: elapsed, errorMessage: '账号无权限或区域受限（403）', errorKind: 'auth' }
  if (status === 404) return { status: 'failed', latencyMs: elapsed, errorMessage: '模型或 Base URL 不存在（404）', errorKind: 'not_found_model' }
  if (status === 429) return { status: 'failed', latencyMs: elapsed, errorMessage: '请求过频或配额已满（429）', errorKind: 'rate_limit' }
  if (status && status >= 500) return { status: 'failed', latencyMs: elapsed, errorMessage: `服务端错误（${status}）`, errorKind: 'server' }
  if (name === 'NetworkError' || /fetch|network|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return { status: 'failed', latencyMs: elapsed, errorMessage: '浏览器无法建立请求，请检查 Base URL、网络或服务端 CORS 设置', errorKind: 'network' }
  }
  return { status: 'failed', latencyMs: elapsed, errorMessage: '请求失败，请检查模型配置与服务响应', errorKind: 'unknown' }
}

export async function testApiConnection(config: ModelConfig, { mode = 'text', signal: parentSignal }: ConnectionTestOptions = {}): Promise<ConnectionResult> {
  const invalidConfig = validateConnectionConfig(config)
  if (invalidConfig) return invalidConfig

  const startedAt = performance.now()
  const timeout = createTimeoutSignal(parentSignal)
  try {
    const model = new ChatOpenAI({
      model: config.model,
      temperature: config.temperature,
      apiKey: config.apiKey,
      configuration: { baseURL: config.baseUrl },
      maxRetries: 0,
      timeout: TEST_TIMEOUT_MS,
    })
    const result = await model.invoke(buildConnectionTestMessage(mode), { signal: timeout.signal })
    const elapsedMs = Math.round(performance.now() - startedAt)
    if (timeout.timedOut) {
      return { status: 'failed', latencyMs: elapsedMs, errorMessage: '请求超时，请检查 Base URL、网络或服务响应', errorKind: 'timeout' }
    }
    if (parentSignal?.aborted || timeout.signal.aborted) return { status: 'cancelled' }
    if (!extractResponseText(result?.content)) {
      return {
        status: 'failed',
        latencyMs: elapsedMs,
        errorMessage: mode === 'vision' ? '模型未返回图片分析结果，请确认支持图片输入' : '响应为空，请检查模型 ID',
        errorKind: 'not_found_model',
      }
    }
    return { status: 'success', latencyMs: elapsedMs }
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt)
    if (!timeout.timedOut && (parentSignal?.aborted || isAbortError(error))) return { status: 'cancelled' }
    if (timeout.timedOut) return { status: 'failed', latencyMs: elapsedMs, errorMessage: '请求超时，请检查 Base URL、网络或服务响应', errorKind: 'timeout' }
    const classified = classifyConnectionError(error)
    return { ...classified, latencyMs: classified.latencyMs ?? elapsedMs }
  } finally {
    timeout.cleanup()
  }
}

export { SUCCESS_AUTO_RESET_MS }
