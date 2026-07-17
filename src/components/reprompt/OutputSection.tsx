import { MarkdownRenderer } from '@/components/grimoire/MarkdownRenderer'
import { PromptResultActions } from './PromptResultActions'
import { AssistantOutputFrame } from './AssistantOutputFrame'
import { ExternalReasoningBlock } from './ExternalReasoningBlock'

interface OutputSectionProps {
  analysis: string
  optimizedPrompt: string
  isStreaming?: boolean
  isStopped?: boolean
  isThinkingModel?: boolean
  isPromptStreaming?: boolean
  onStopStreaming?: () => void
  onRetry?: () => void
}

export function OutputSection({
  analysis,
  optimizedPrompt,
  isStreaming = false,
  isThinkingModel = false,
  isPromptStreaming = isStreaming,
  onRetry,
}: OutputSectionProps) {
  const showPrompt = optimizedPrompt.length > 0 || isPromptStreaming

  return (
    <AssistantOutputFrame>
      <ExternalReasoningBlock
        content={analysis}
        enabled={isThinkingModel}
        isStreaming={isStreaming}
        contentStarted={isPromptStreaming || optimizedPrompt.length > 0}
      />

      {showPrompt && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 leading-relaxed">
          {isStreaming ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
              <span className={optimizedPrompt.length > 0 ? 'streaming-cursor' : ''}>
                {optimizedPrompt}
              </span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-[var(--text-primary)] [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_p]:my-0">
              <MarkdownRenderer content={optimizedPrompt} />
            </div>
          )}
        </div>
      )}

      {!isStreaming && optimizedPrompt.length > 0 && (
        <PromptResultActions content={optimizedPrompt} onRetry={onRetry} />
      )}
    </AssistantOutputFrame>
  )
}
