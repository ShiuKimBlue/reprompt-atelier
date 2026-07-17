import { FileText, Image as ImageIcon, User } from 'lucide-react'
import { MarkdownRenderer } from '@/components/grimoire/MarkdownRenderer'
import { PromptResultActions } from './PromptResultActions'
import { AssistantOutputFrame } from './AssistantOutputFrame'
import { ExternalReasoningBlock } from './ExternalReasoningBlock'
import { PipelineArtifactBlock } from './PipelineArtifactBlock'
import type { WorkspaceMessage } from '@/types'

interface WorkspaceMessagesProps {
  messages: WorkspaceMessage[]
  latestAssistantId?: string
  onRetryLatest?: () => void
  retrying?: boolean
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function MessageImages({ message }: { message: WorkspaceMessage }) {
  if (!message.images?.length) return null
  return (
    <div className="mb-2.5 flex flex-wrap gap-2">
      {message.images.map((image) => (
        <div key={image.id} className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-muted)]">
          {image.dataUrl ? (
            <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 px-2 text-center text-[11px] leading-tight">
              <ImageIcon className="h-4 w-4" />
              <span className="line-clamp-2">{image.name}</span>
              <span className="text-[10px] text-[var(--text-muted)]">需重新上传后重试</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MessageTextAttachments({ message }: { message: WorkspaceMessage }) {
  if (!message.attachments?.length) return null
  return (
    <div className="mb-2.5 flex flex-wrap gap-2">
      {message.attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex min-w-0 max-w-[260px] items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]/50 px-3 py-2 text-xs"
          title={`${attachment.name}${attachment.truncated ? ` · 本次使用 ${attachment.includedCharCount} / ${attachment.originalCharCount} 字符` : ''}`}
        >
          <FileText className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-[var(--text-primary)]">{attachment.name}</span>
            <span className="block truncate text-[var(--text-muted)]">
              {formatFileSize(attachment.size)} · {attachment.extension || attachment.mimeType}{attachment.truncated ? ' · 已截断' : ''}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

function MessageCard({
  message,
  latestAssistantId,
  onRetryLatest,
  retrying,
}: {
  message: WorkspaceMessage
  latestAssistantId?: string
  onRetryLatest?: () => void
  retrying?: boolean
}) {
  const isAssistant = message.role === 'assistant'
  const showRetry = isAssistant && message.id === latestAssistantId && !retrying ? onRetryLatest : undefined
  const reasoning = message.artifact && 'reasoning' in message.artifact ? message.artifact.reasoning : undefined
  const hasReasoning = isAssistant && Boolean(reasoning?.trim())

  if (isAssistant) {
    return (
      <AssistantOutputFrame>
        {hasReasoning && (
          <ExternalReasoningBlock
            content={reasoning ?? ''}
            enabled
            isStreaming={false}
            contentStarted
          />
        )}
        {message.artifact?.pipeline && (
          <PipelineArtifactBlock pipeline={message.artifact.pipeline} />
        )}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 leading-relaxed">
          <MessageImages message={message} />
          <MessageTextAttachments message={message} />
          <div className="text-sm leading-relaxed text-[var(--text-primary)] [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_p]:my-0">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
        {message.content && (
          <PromptResultActions content={message.content} onRetry={showRetry} />
        )}
      </AssistantOutputFrame>
    )
  }

  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[86%] min-w-0">
        <div className="rounded-2xl border border-[var(--accent-primary)]/15 bg-[var(--accent-light)] px-4 py-3 leading-relaxed">
          <MessageImages message={message} />
          <MessageTextAttachments message={message} />
          <div className="text-sm leading-relaxed text-[var(--text-primary)] [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_p]:my-0">
            <MarkdownRenderer content={message.content} />
          </div>
        </div>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-input)] text-[var(--text-secondary)]">
        <User className="h-4 w-4" />
      </div>
    </div>
  )
}


export function WorkspaceMessages({ messages, latestAssistantId, onRetryLatest, retrying }: WorkspaceMessagesProps) {
  if (messages.length === 0) return null

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageCard
          key={message.id}
          message={message}
          latestAssistantId={latestAssistantId}
          onRetryLatest={onRetryLatest}
          retrying={retrying}
        />
      ))}
      {messages.some((message) => message.images?.length) && (
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <ImageIcon className="h-3 w-3" />
          图片仅用于本次生成，历史只保存图片名称和文字结果；要重试图转提示，请重新上传对应图片
        </div>
      )}
      {messages.some((message) => message.attachments?.length) && (
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <FileText className="h-3 w-3" />
          文本附件正文只用于本次生成，历史只保存文件名和文字结果；如需重新生成，请重新上传对应文件
        </div>
      )}
    </div>
  )
}
