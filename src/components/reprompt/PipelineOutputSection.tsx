import { MarkdownRenderer } from '@/components/grimoire/MarkdownRenderer'
import { AssistantOutputFrame } from './AssistantOutputFrame'
import { PipelineArtifactBlock } from './PipelineArtifactBlock'
import type { PipelineStep, PipelineStepStatus, WorkspacePipelineArtifact } from '@/types'

interface PipelineOutputSectionProps {
  draftPrompt: string
  critiqueReport: string
  finalPrompt: string
  draftReasoning: string
  critiqueReasoning: string
  synthesizerReasoning: string
  currentStep: PipelineStep | null
  stepStatuses: Record<PipelineStep, PipelineStepStatus>
  stepContentStarted?: Record<PipelineStep, boolean>
  analyzerThinking: boolean
  plannerThinking: boolean
  synthesizerThinking: boolean
  isStreaming?: boolean
}

const EMPTY_STEP_CONTENT_STARTED: Record<PipelineStep, boolean> = {
  analyzer: false,
  planner: false,
  synthesizer: false,
}

export function PipelineOutputSection({
  draftPrompt,
  critiqueReport,
  finalPrompt,
  draftReasoning,
  critiqueReasoning,
  synthesizerReasoning,
  currentStep,
  stepStatuses,
  stepContentStarted = EMPTY_STEP_CONTENT_STARTED,
  analyzerThinking,
  plannerThinking,
  synthesizerThinking,
  isStreaming = false,
}: PipelineOutputSectionProps) {
  const pipeline: WorkspacePipelineArtifact = {
    draftPrompt,
    critiqueReport,
    finalPrompt,
    draftReasoning,
    critiqueReasoning,
    synthesizerReasoning,
  }
  const showFinalReply = finalPrompt.trim().length > 0 || (
    isStreaming &&
    currentStep === 'synthesizer' &&
    stepContentStarted.synthesizer
  )

  return (
    <AssistantOutputFrame>
      <PipelineArtifactBlock
        pipeline={pipeline}
        currentStep={currentStep}
        stepStatuses={stepStatuses}
        stepContentStarted={stepContentStarted}
        analyzerThinking={analyzerThinking}
        plannerThinking={plannerThinking}
        synthesizerThinking={synthesizerThinking}
        isStreaming={isStreaming}
      />

      {showFinalReply && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 leading-relaxed">
          {isStreaming ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--text-primary)]">
              <span className={finalPrompt.length > 0 ? 'streaming-cursor' : ''}>
                {finalPrompt}
              </span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-[var(--text-primary)] [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_p]:my-0">
              <MarkdownRenderer content={finalPrompt} />
            </div>
          )}
        </div>
      )}
    </AssistantOutputFrame>
  )
}
