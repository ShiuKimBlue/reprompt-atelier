export type TabId = 'reprompt' | 'gallery' | 'grimoire' | 'settings' | 'github'

export type OptimizeMode = 'quick' | 'deep'
export type WorkspaceMode = 'quick' | 'deep' | 'image2prompt'
export type SettingsMode = WorkspaceMode
export type PipelineStep = 'analyzer' | 'planner' | 'synthesizer'
export type PipelineStepStatus = 'idle' | 'streaming' | 'done' | 'error'

export interface WorkspaceImage {
  id: string
  name: string
  dataUrl?: string
  mimeType: string
}

export interface WorkspaceTextAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  extension?: string
  lineCount?: number
  truncated?: boolean
  originalCharCount?: number
  includedCharCount?: number
}

export interface WorkspaceTextAttachmentPayload extends WorkspaceTextAttachment {
  text: string
}

export interface WorkspacePipelineArtifact {
  draftPrompt: string
  critiqueReport: string
  finalPrompt: string
  draftReasoning: string
  critiqueReasoning: string
  synthesizerReasoning: string
}

export interface WorkspaceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: WorkspaceImage[]
  attachments?: WorkspaceTextAttachment[]
  createdAt: number
  artifact?: {
    pipeline?: WorkspacePipelineArtifact
    reasoning?: string
  }
}

export interface WorkspaceSession {
  id: string
  mode: WorkspaceMode
  title: string
  messages: WorkspaceMessage[]
  model: string
  createdAt: number
  updatedAt: number
}

export interface PromptItem {
  id: string
  imageUrl: string
  title: string
  prompt: string
  model: string
  resolution: string
  format: 'png' | 'webp' | 'jpeg' | 'jpg'
  aspectRatio: string
}

export interface RepromptRecord {
  id: string
  title: string
  originalPrompt: string
  optimizedPrompt: string
  thinking: string
  model: string
  createdAt: number

  // 优化模式
  mode?: OptimizeMode

  // 三智能体流水线 (v2)
  pipelineVersion?: 'v2'
  draftPrompt?: string
  critiqueReport?: string
  finalPrompt?: string
  draftReasoning?: string
  critiqueReasoning?: string
  rewriterReasoning?: string
}

export interface GrimoireChapter {
  id: string
  title: string
  icon: string
  order: number
  sections: GrimoireSection[]
}

export interface GrimoireSection {
  id: string
  title: string
  order: number
  content?: string
  children?: GrimoireSection[]
}

export interface OpenSourceCredit {
  name: string
  url: string
  description: string
}

export interface ModelConfig {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  showReasoning: boolean
}

export interface AppSettings {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  darkMode: boolean
  githubUrl: string
  showReasoning: boolean
  analyzerPrompt: string
  plannerPrompt: string
  synthesizerPrompt: string
  analyzerModel: ModelConfig | null
  plannerModel: ModelConfig | null
  synthesizerModel: ModelConfig | null
  quickOptimizePrompt: string
  image2PromptPrompt: string
  image2PromptModel: ModelConfig | null
}
