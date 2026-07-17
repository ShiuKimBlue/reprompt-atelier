import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Flame, ListTodo, Scissors, Scroll, Search } from 'lucide-react'
import { MarkdownRenderer } from '@/components/grimoire/MarkdownRenderer'
import { ReasoningPanel } from './ReasoningPanel'
import type { PipelineStep, PipelineStepStatus, WorkspacePipelineArtifact } from '@/types'

const STEP_ORDER: PipelineStep[] = ['analyzer', 'planner', 'synthesizer']

const EMPTY_STEP_STATUSES: Record<PipelineStep, PipelineStepStatus> = {
  analyzer: 'idle',
  planner: 'idle',
  synthesizer: 'idle',
}

const EMPTY_STEP_CONTENT_STARTED: Record<PipelineStep, boolean> = {
  analyzer: false,
  planner: false,
  synthesizer: false,
}

const STEP_META: Record<PipelineStep, { icon: typeof Search; label: string; contentLabel: string; contentIcon: typeof Search }> = {
  analyzer: { icon: Search, label: '意图分析师', contentLabel: '咒术草稿', contentIcon: Scroll },
  planner: { icon: ListTodo, label: '任务调度官', contentLabel: '咒术拆解', contentIcon: Scissors },
  synthesizer: { icon: Flame, label: '咒术合成者', contentLabel: '', contentIcon: Flame },
}

interface PipelineArtifactBlockProps {
  pipeline: WorkspacePipelineArtifact
  currentStep?: PipelineStep | null
  stepStatuses?: Record<PipelineStep, PipelineStepStatus>
  stepContentStarted?: Record<PipelineStep, boolean>
  analyzerThinking?: boolean
  plannerThinking?: boolean
  synthesizerThinking?: boolean
  isStreaming?: boolean
}

export function PipelineArtifactBlock({
  pipeline,
  currentStep = null,
  stepStatuses = EMPTY_STEP_STATUSES,
  stepContentStarted = EMPTY_STEP_CONTENT_STARTED,
  analyzerThinking = Boolean(pipeline.draftReasoning.trim()),
  plannerThinking = Boolean(pipeline.critiqueReasoning.trim()),
  synthesizerThinking = Boolean(pipeline.synthesizerReasoning.trim()),
  isStreaming = false,
}: PipelineArtifactBlockProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState<Record<PipelineStep, boolean>>({
    analyzer: false,
    planner: false,
    synthesizer: false,
  })
  const [contentExpanded, setContentExpanded] = useState<Record<PipelineStep, boolean>>({
    analyzer: false,
    planner: false,
    synthesizer: false,
  })
  const previousStepRef = useRef<PipelineStep | null>(null)

  const getStepContent = (step: PipelineStep) => {
    if (step === 'analyzer') return pipeline.draftPrompt
    if (step === 'planner') return pipeline.critiqueReport
    return pipeline.finalPrompt
  }

  const getStepReasoning = (step: PipelineStep) => {
    if (step === 'analyzer') return pipeline.draftReasoning
    if (step === 'planner') return pipeline.critiqueReasoning
    return pipeline.synthesizerReasoning
  }

  const getStepThinking = (step: PipelineStep) => {
    if (step === 'analyzer') return analyzerThinking
    if (step === 'planner') return plannerThinking
    return synthesizerThinking
  }

  useEffect(() => {
    if (!isStreaming || !currentStep || previousStepRef.current === currentStep) return
    previousStepRef.current = currentStep
    const contentStarted = stepContentStarted[currentStep]
    queueMicrotask(() => {
      setReasoningExpanded((prev) => ({ ...prev, [currentStep]: !contentStarted }))
      setContentExpanded((prev) => ({ ...prev, [currentStep]: false }))
    })
  }, [currentStep, isStreaming, stepContentStarted])

  useEffect(() => {
    if (!isStreaming) return
    queueMicrotask(() => {
      setReasoningExpanded((prev) => {
        const next = { ...prev }
        for (const step of STEP_ORDER) {
          if (stepContentStarted[step]) next[step] = false
        }
        return next
      })
      setContentExpanded((prev) => {
        const next = { ...prev }
        for (const step of STEP_ORDER) {
          if (stepContentStarted[step]) next[step] = false
        }
        return next
      })
    })
  }, [isStreaming, stepContentStarted])

  const visibleSteps = STEP_ORDER.filter((step) => {
    const content = getStepContent(step)
    const reasoning = getStepReasoning(step)
    return stepStatuses[step] !== 'idle' || currentStep === step || content.trim().length > 0 || reasoning.trim().length > 0
  })

  if (visibleSteps.length === 0) return null

  return (
    <div className="space-y-2">
      {visibleSteps.map((step) => {
        const meta = STEP_META[step]
        const Icon = meta.icon
        const ContentIcon = meta.contentIcon
        const status = stepStatuses[step]
        const content = getStepContent(step)
        const reasoning = getStepReasoning(step)
        const isActive = isStreaming && currentStep === step && status === 'streaming'
        const isReasoningStreaming = isActive && !stepContentStarted[step]
        const showReasoning = getStepThinking(step) && (reasoning.trim().length > 0 || isReasoningStreaming)
        const isSynthesizer = step === 'synthesizer'
        const showContent = !isSynthesizer && content.trim().length > 0

        return (
          <div key={step} className="space-y-2">
            {showReasoning && (
              <ReasoningPanel
                content={reasoning}
                expanded={reasoningExpanded[step]}
                streaming={isReasoningStreaming}
                onToggle={() => setReasoningExpanded((prev) => ({ ...prev, [step]: !prev[step] }))}
                icon={Icon}
                label={meta.label}
              />
            )}
            {showContent && (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                <button
                  type="button"
                  onClick={() => setContentExpanded((prev) => ({ ...prev, [step]: !prev[step] }))}
                  aria-expanded={contentExpanded[step]}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors ${contentExpanded[step] ? '' : 'hover:bg-[var(--bg-hover)]'}`}
                >
                  <ContentIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span>{meta.contentLabel}</span>
                  <ChevronDown className={`ml-auto h-4 w-4 text-[var(--text-muted)] transition-transform ${contentExpanded[step] ? 'rotate-180' : ''}`} />
                </button>
                {contentExpanded[step] && (
                  <div className="border-t border-[var(--border-color)] px-3 py-2 text-sm leading-relaxed text-[var(--text-primary)] [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_p]:my-0">
                    <MarkdownRenderer content={content} />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
