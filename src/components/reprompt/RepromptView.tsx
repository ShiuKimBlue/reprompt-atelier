import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { ArrowDown, Image, Layers, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useRepromptStore } from '@/stores/useRepromptStore'
import { useUIStore } from '@/stores/useUIStore'
import {
  buildPromptWithTextAttachments,
  runImage2PromptStream,
  runPipelineStream,
  runQuickConversationStream,
} from '@/lib/reprompt'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { OutputSection } from './OutputSection'
import { PipelineOutputSection } from './PipelineOutputSection'
import { RepromptHero } from './RepromptHero'
import { WorkspaceComposer } from './WorkspaceComposer'
import { WorkspaceMessages } from './WorkspaceMessages'
import type { AppSettings, ModelConfig, PipelineStep, PipelineStepStatus, WorkspaceImage, WorkspaceMessage, WorkspaceMode, WorkspaceSession, WorkspaceTextAttachment, WorkspaceTextAttachmentPayload } from '@/types'

const MODE_META: Record<WorkspaceMode, {
  icon: typeof Sparkles
  title: string
  description: string
  placeholder: string
  helper: string
}> = {
  quick: {
    icon: Zap,
    title: '快速优化',
    description: '单 agent 快速重铸提示词，适合即时改写与连续追问',
    placeholder: '例如：帮我设计一个生成公众号文章的提示词，用于提升读者转发率',
    helper: '支持多轮对话。后续输入会带上本次会话上下文继续优化。',
  },
  deep: {
    icon: Layers,
    title: '深度优化',
    description: '意图分析师、任务调度官、咒术合成者三步协作',
    placeholder: '描述你的任务目标、使用场景、输出格式和约束，流水线会逐步生成最终提示词',
    helper: '支持多轮对话。每一轮都会参考同一会话里的历史输入和输出。',
  },
  image2prompt: {
    icon: Image,
    title: '图转提示',
    description: '上传图片，使用多模态模型反推出可用于生图的提示词',
    placeholder: '可补充你想强调的风格、画幅、模型或用途，也可以只上传图片',
    helper: '需要在核心设定中配置支持视觉输入的 VLM / 多模态模型。',
  },
}

type RepromptTransition = 'idle' | 'entering' | 'leaving'

const WORKSPACE_TRANSITION_MS = 320

const EMPTY_STEP_STATUS: Record<PipelineStep, PipelineStepStatus> = {
  analyzer: 'idle',
  planner: 'idle',
  synthesizer: 'idle',
}

const EMPTY_STEP_STARTED: Record<PipelineStep, boolean> = {
  analyzer: false,
  planner: false,
  synthesizer: false,
}

function getStepReasoningEnabled(settings: AppSettings, step: PipelineStep) {
  if (step === 'analyzer') return hasCompleteModelConfig(settings.analyzerModel) ? settings.analyzerModel.showReasoning : settings.showReasoning
  if (step === 'planner') return hasCompleteModelConfig(settings.plannerModel) ? settings.plannerModel.showReasoning : settings.showReasoning
  return hasCompleteModelConfig(settings.synthesizerModel) ? settings.synthesizerModel.showReasoning : settings.showReasoning
}

function stripImagePayload(images: WorkspaceImage[]): WorkspaceImage[] {
  return images.map(({ id, name, mimeType }) => ({ id, name, mimeType }))
}

function stripTextAttachmentPayload(attachments: WorkspaceTextAttachmentPayload[]): WorkspaceTextAttachment[] {
  return attachments.map(({ text: _text, ...metadata }) => metadata)
}

function createMessage(
  role: WorkspaceMessage['role'],
  content: string,
  images?: WorkspaceImage[],
  artifact?: WorkspaceMessage['artifact'],
  attachments?: WorkspaceTextAttachment[]
): WorkspaceMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    images: images && images.length > 0 ? images : undefined,
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
    createdAt: Date.now(),
    artifact,
  }
}

function modeTitle(mode: WorkspaceMode, input: string, images: WorkspaceImage[] = []) {
  const trimmed = input.trim()
  if (trimmed) return trimmed.slice(0, 50)
  if (mode === 'image2prompt' && images[0]?.name) return `图转提示 · ${images[0].name}`.slice(0, 50)
  return MODE_META[mode].title
}

function hasCompleteModelConfig(config?: ModelConfig | null): config is ModelConfig {
  return Boolean(config?.baseUrl.trim() && config.apiKey.trim() && config.model.trim())
}

function hasCompleteMainConfig(settings: AppSettings) {
  return Boolean(settings.baseUrl.trim() && settings.apiKey.trim() && settings.model.trim())
}

function hasCompleteDeepConfig(settings: AppSettings) {
  return hasCompleteMainConfig(settings) || (
    hasCompleteModelConfig(settings.analyzerModel) &&
    hasCompleteModelConfig(settings.plannerModel) &&
    hasCompleteModelConfig(settings.synthesizerModel)
  )
}

function getModelConfig(settings: AppSettings, mode: WorkspaceMode): ModelConfig {
  if (mode === 'image2prompt' && hasCompleteModelConfig(settings.image2PromptModel)) return settings.image2PromptModel
  return {
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    temperature: settings.temperature,
    showReasoning: settings.showReasoning,
  }
}

function buildContextPrompt(messages: WorkspaceMessage[], input: string) {
  if (messages.length === 0) return input
  const history = messages
    .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
    .join('\n\n')
  return `Conversation history:\n${history}\n\nCurrent user request:\n${input}`
}

function withoutMessage(messages: WorkspaceMessage[], messageId: string) {
  return messages.filter((message) => message.id !== messageId)
}

function hasRetryableImagePayload(images: WorkspaceImage[]) {
  return images.some((image) => Boolean(image.dataUrl))
}

export function RepromptView() {
  const settings = useSettingsStore()
  const { activeWorkspaceMode, setWorkspaceMode } = useUIStore()
  const {
    sessions,
    currentSessionId,
    createSession,
    appendMessage,
    updateSession,
  } = useRepromptStore()

  const [input, setInput] = useState('')
  const [images, setImages] = useState<WorkspaceImage[]>([])
  const [textAttachments, setTextAttachments] = useState<WorkspaceTextAttachmentPayload[]>([])
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isStopped, setIsStopped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failedRetryState, setFailedRetryState] = useState<{ canRetry: boolean; hint: string | null }>({ canRetry: false, hint: null })
  const [streamingContent, setStreamingContent] = useState('')
  const [singleAgentReasoning, setSingleAgentReasoning] = useState('')
  const [singleAgentContentStarted, setSingleAgentContentStarted] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [displayMode, setDisplayMode] = useState<WorkspaceMode | null>(activeWorkspaceMode)
  const [workspaceTransition, setWorkspaceTransition] = useState<RepromptTransition>('idle')

  const [currentStep, setCurrentStep] = useState<PipelineStep | null>(null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [critiqueReport, setCritiqueReport] = useState('')
  const [finalPrompt, setFinalPrompt] = useState('')
  const [draftReasoning, setDraftReasoning] = useState('')
  const [critiqueReasoning, setCritiqueReasoning] = useState('')
  const [synthesizerReasoning, setSynthesizerReasoning] = useState('')
  const [stepStatuses, setStepStatuses] = useState<Record<PipelineStep, PipelineStepStatus>>(EMPTY_STEP_STATUS)
  const [stepContentStarted, setStepContentStarted] = useState<Record<PipelineStep, boolean>>(EMPTY_STEP_STARTED)

  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRunRef = useRef<{ sessionId: string; mode: WorkspaceMode } | null>(null)
  const lastFailedRunRef = useRef<{
    mode: WorkspaceMode
    input: string
    images: WorkspaceImage[]
    textAttachments: WorkspaceTextAttachmentPayload[]
    sessionId: string
    userMessageId: string
  } | null>(null)
  const contentScrollRef = useRef<HTMLDivElement | null>(null)
  const navigationStateRef = useRef<{ mode: WorkspaceMode | null; sessionId: string | null }>({ mode: null, sessionId: null })
  const contentRafIdRef = useRef<number>(0)
  const reasoningRafIdRef = useRef<number>(0)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const singleAgentContentRef = useRef('')
  const singleAgentReasoningRef = useRef('')
  const stepContentRefs = useRef<Record<PipelineStep, string>>({ analyzer: '', planner: '', synthesizer: '' })
  const stepReasoningRefs = useRef<Record<PipelineStep, string>>({ analyzer: '', planner: '', synthesizer: '' })
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === currentSessionId),
    [currentSessionId, sessions]
  )
  const mode = displayMode
  const visibleMessages = mode && currentSession?.mode === mode ? currentSession.messages : []
  const modelConfig = mode ? getModelConfig(settings, mode) : null
  const settingsReady = mode === 'deep'
    ? hasCompleteDeepConfig(settings)
    : mode === 'image2prompt'
    ? hasCompleteModelConfig(settings.image2PromptModel)
    : Boolean(modelConfig?.baseUrl.trim() && modelConfig.apiKey.trim() && modelConfig.model.trim())

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      if (activeWorkspaceMode && !displayMode && workspaceTransition === 'idle') {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
        setDisplayMode(activeWorkspaceMode)
        setWorkspaceTransition('entering')
        transitionTimerRef.current = setTimeout(() => {
          setWorkspaceTransition('idle')
          transitionTimerRef.current = null
        }, prefersReducedMotion ? 1 : WORKSPACE_TRANSITION_MS)
        return
      }

      if (!activeWorkspaceMode && displayMode && workspaceTransition === 'idle') {
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
        setWorkspaceTransition('leaving')
        transitionTimerRef.current = setTimeout(() => {
          setDisplayMode(null)
          setWorkspaceTransition('idle')
          transitionTimerRef.current = null
        }, prefersReducedMotion ? 1 : WORKSPACE_TRANSITION_MS)
        return
      }

      if (activeWorkspaceMode && displayMode && activeWorkspaceMode !== displayMode && workspaceTransition === 'idle') {
        setDisplayMode(activeWorkspaceMode)
      }
    }, 0)

    return () => clearTimeout(syncTimer)
  }, [activeWorkspaceMode, displayMode, prefersReducedMotion, workspaceTransition])

  const handleSelectMode = useCallback((targetMode: WorkspaceMode) => {
    setWorkspaceMode(targetMode)
  }, [setWorkspaceMode])

  const updateScrollToBottomVisibility = useCallback(() => {
    const container = contentScrollRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollToBottom(distanceFromBottom > 180)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = contentScrollRef.current
    if (!container) return
    const targetTop = container.scrollHeight - container.clientHeight
    if (behavior === 'auto') {
      container.scrollTop = targetTop
      setShowScrollToBottom(false)
      return
    }
    container.scrollTo({ top: targetTop, behavior })
  }, [])

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      if (contentRafIdRef.current) cancelAnimationFrame(contentRafIdRef.current)
      if (reasoningRafIdRef.current) cancelAnimationFrame(reasoningRafIdRef.current)
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const resetTimer = setTimeout(() => {
      scrollToBottom('auto')
      setInput('')
      setImages([])
      setTextAttachments([])
      setStreamingContent('')
      setSingleAgentReasoning('')
      setSingleAgentContentStarted(false)
      setDraftPrompt('')
      setCritiqueReport('')
      setFinalPrompt('')
      setDraftReasoning('')
      setCritiqueReasoning('')
      setSynthesizerReasoning('')
      setCurrentStep(null)
      setStepStatuses(EMPTY_STEP_STATUS)
      setStepContentStarted(EMPTY_STEP_STARTED)
      setError(null)
      setFailedRetryState({ canRetry: false, hint: null })
      setIsStopped(false)
    }, 0)

    return () => clearTimeout(resetTimer)
  }, [activeWorkspaceMode, currentSessionId, scrollToBottom])


  useEffect(() => {
    if (visibleMessages.length === 0) return
    const container = contentScrollRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight - container.clientHeight, behavior: 'smooth' })
  }, [visibleMessages.length])

  const clearStoppedState = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    setIsStopped(false)
  }, [])

  const ensureSession = useCallback((targetMode: WorkspaceMode, userInput: string, attachedImages: WorkspaceImage[] = []): WorkspaceSession => {
    if (currentSession && currentSession.mode === targetMode) return currentSession
    const config = getModelConfig(settings, targetMode)
    return createSession(targetMode, modeTitle(targetMode, userInput, attachedImages), config.model)
  }, [createSession, currentSession, settings])

  const resetRunState = useCallback((targetMode: WorkspaceMode) => {
    setLoading(true)
    setIsStreaming(true)
    clearStoppedState()
    setError(null)
    setFailedRetryState({ canRetry: false, hint: null })
    setStreamingContent('')
    setSingleAgentReasoning('')
    setSingleAgentContentStarted(false)
    singleAgentContentRef.current = ''
    singleAgentReasoningRef.current = ''
    stepContentRefs.current = { analyzer: '', planner: '', synthesizer: '' }
    stepReasoningRefs.current = { analyzer: '', planner: '', synthesizer: '' }
    setDraftPrompt('')
    setCritiqueReport('')
    setFinalPrompt('')
    setDraftReasoning('')
    setCritiqueReasoning('')
    setSynthesizerReasoning('')
    setStepStatuses(targetMode === 'deep' ? { analyzer: 'streaming', planner: 'idle', synthesizer: 'idle' } : EMPTY_STEP_STATUS)
    setStepContentStarted(EMPTY_STEP_STARTED)
    setCurrentStep(targetMode === 'deep' ? 'analyzer' : null)
    const controller = new AbortController()
    abortControllerRef.current = controller
    return controller
  }, [clearStoppedState])

  const prepareRun = useCallback((targetMode: WorkspaceMode, userInput: string, attachedImages: WorkspaceImage[], attachedTextAttachments: WorkspaceTextAttachmentPayload[]) => {
    const session = ensureSession(targetMode, userInput, attachedImages)
    const messageContent = userInput || (attachedImages.length > 0 ? '请根据图片继续。' : '请根据我上传的文本附件优化提示词。')
    const userMessage = createMessage(
      'user',
      messageContent,
      stripImagePayload(attachedImages),
      undefined,
      stripTextAttachmentPayload(attachedTextAttachments)
    )
    appendMessage(session.id, userMessage)
    scrollToBottom('smooth')
    setInput('')
    setImages([])
    setTextAttachments([])
    const controller = resetRunState(targetMode)
    activeRunRef.current = { sessionId: session.id, mode: targetMode }
    lastFailedRunRef.current = {
      mode: targetMode,
      input: userInput,
      images: attachedImages,
      textAttachments: attachedTextAttachments,
      sessionId: session.id,
      userMessageId: userMessage.id,
    }
    return { session, userMessage, controller, history: session.messages, runImages: attachedImages, runTextAttachments: attachedTextAttachments }
  }, [appendMessage, ensureSession, resetRunState, scrollToBottom])

  const prepareFailedRetryRun = useCallback((payload: NonNullable<typeof lastFailedRunRef.current>) => {
    const session = sessions.find((item) => item.id === payload.sessionId)
    const userMessage = session?.messages.find((message) => message.id === payload.userMessageId)
    if (!session || session.mode !== payload.mode || !userMessage) return null
    const controller = resetRunState(session.mode)
    activeRunRef.current = { sessionId: session.id, mode: session.mode }
    return {
      session,
      userMessage,
      controller,
      history: session.messages.filter((message) => message.id !== userMessage.id),
      runImages: payload.mode === 'image2prompt' ? payload.images : [],
      runTextAttachments: payload.mode === 'image2prompt' ? [] : payload.textAttachments,
    }
  }, [resetRunState, sessions])

  const prepareLatestRetryRun = useCallback((session: WorkspaceSession, assistantMessage: WorkspaceMessage, userMessage: WorkspaceMessage) => {
    const nextMessages = withoutMessage(session.messages, assistantMessage.id)
    updateSession(session.id, { messages: nextMessages })
    scrollToBottom('smooth')
    const controller = resetRunState(session.mode)
    activeRunRef.current = { sessionId: session.id, mode: session.mode }
    lastFailedRunRef.current = {
      mode: session.mode,
      input: userMessage.content,
      images: userMessage.images ?? [],
      textAttachments: [],
      sessionId: session.id,
      userMessageId: userMessage.id,
    }
    return { controller, history: nextMessages.filter((message) => message.id !== userMessage.id), runTextAttachments: [] }
  }, [resetRunState, scrollToBottom, updateSession])

  const finishRun = useCallback((options: { clearDraft?: boolean } = {}) => {
    setIsStreaming(false)
    setLoading(false)
    abortControllerRef.current = null
    activeRunRef.current = null
    if (options.clearDraft !== false) {
      setInput('')
      setImages([])
      setTextAttachments([])
    }
    scrollToBottom('smooth')
  }, [scrollToBottom])

  const failRun = useCallback((err: Error) => {
    const payload = lastFailedRunRef.current
    const imageRetryable = payload?.mode !== 'image2prompt' || hasRetryableImagePayload(payload.images)
    setFailedRetryState({
      canRetry: Boolean(payload && imageRetryable),
      hint: payload?.mode === 'image2prompt' && !imageRetryable
        ? '图片内容不会写入历史；如需重试图转提示，请重新上传对应图片。'
        : null,
    })
    setError(err.message || '生成失败，请重试')
    finishRun({ clearDraft: false })
  }, [finishRun])

  const appendStoppedDraft = useCallback(() => {
    const activeRun = activeRunRef.current
    if (!activeRun) return false

    if (activeRun.mode === 'quick') {
      const content = singleAgentContentRef.current.trim()
      const reasoning = settings.showReasoning ? singleAgentReasoningRef.current.trim() : ''
      if (!content && !reasoning) return false
      appendMessage(activeRun.sessionId, createMessage('assistant', content || '生成已停止，尚未产生正文。', undefined, reasoning ? { reasoning } : undefined))
      return true
    }

    if (activeRun.mode === 'deep') {
      const artifact = {
        pipeline: {
          draftPrompt: stepContentRefs.current.analyzer,
          critiqueReport: stepContentRefs.current.planner,
          finalPrompt: stepContentRefs.current.synthesizer,
          draftReasoning: getStepReasoningEnabled(settings, 'analyzer') ? stepReasoningRefs.current.analyzer : '',
          critiqueReasoning: getStepReasoningEnabled(settings, 'planner') ? stepReasoningRefs.current.planner : '',
          synthesizerReasoning: getStepReasoningEnabled(settings, 'synthesizer') ? stepReasoningRefs.current.synthesizer : '',
        },
      }
      const content = stepContentRefs.current.synthesizer.trim()
      const hasPipelineContent = Object.values(stepContentRefs.current).some((value) => value.trim().length > 0)
      const hasReasoning = Object.values(stepReasoningRefs.current).some((value) => value.trim().length > 0)
      if (!content && !hasPipelineContent && !hasReasoning) return false
      appendMessage(activeRun.sessionId, createMessage('assistant', content || '生成已停止，尚未产生正文。', undefined, artifact))
      return true
    }

    const content = singleAgentContentRef.current.trim()
    const config = getModelConfig(settings, 'image2prompt')
    const reasoning = config.showReasoning ? singleAgentReasoningRef.current.trim() : ''
    if (!content && !reasoning) return false
    appendMessage(activeRun.sessionId, createMessage('assistant', content || '生成已停止，尚未产生正文。', undefined, reasoning ? { reasoning } : undefined))
    return true
  }, [appendMessage, settings])

  const stopActiveRun = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (contentRafIdRef.current) {
      cancelAnimationFrame(contentRafIdRef.current)
      contentRafIdRef.current = 0
    }
    if (reasoningRafIdRef.current) {
      cancelAnimationFrame(reasoningRafIdRef.current)
      reasoningRafIdRef.current = 0
    }
    setStreamingContent(singleAgentContentRef.current)
    setSingleAgentReasoning(singleAgentReasoningRef.current)
    setDraftPrompt(stepContentRefs.current.analyzer)
    setCritiqueReport(stepContentRefs.current.planner)
    setFinalPrompt(stepContentRefs.current.synthesizer)
    setDraftReasoning(stepReasoningRefs.current.analyzer)
    setCritiqueReasoning(stepReasoningRefs.current.planner)
    setSynthesizerReasoning(stepReasoningRefs.current.synthesizer)
    appendStoppedDraft()
    setIsStreaming(false)
    setLoading(false)
    activeRunRef.current = null
    setCurrentStep(null)
    setStepContentStarted(EMPTY_STEP_STARTED)
    setSingleAgentContentStarted(false)
    setStepStatuses(EMPTY_STEP_STATUS)
    setIsStopped(true)
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    stopTimerRef.current = setTimeout(() => {
      setIsStopped(false)
      stopTimerRef.current = null
    }, 2000)
  }, [appendStoppedDraft])

  const handleStopStreaming = useCallback(() => {
    stopActiveRun()
  }, [stopActiveRun])

  useEffect(() => {
    const previous = navigationStateRef.current
    const changed = previous.mode !== activeWorkspaceMode || previous.sessionId !== currentSessionId
    const activeRun = activeRunRef.current
    if (changed && activeRun && (activeRun.mode !== activeWorkspaceMode || activeRun.sessionId !== currentSessionId)) {
      stopActiveRun()
    }
    navigationStateRef.current = { mode: activeWorkspaceMode, sessionId: currentSessionId }
  }, [activeWorkspaceMode, currentSessionId, stopActiveRun])

  const isRunActive = useCallback((sessionId: string, runMode: WorkspaceMode) => {
    return activeRunRef.current?.sessionId === sessionId && activeRunRef.current.mode === runMode
  }, [])

  const runQuick = useCallback(async (session: WorkspaceSession, userMessage: WorkspaceMessage, history: WorkspaceMessage[], controller: AbortController, runTextAttachments: WorkspaceTextAttachmentPayload[] = []) => {
    const userPrompt = buildPromptWithTextAttachments(userMessage.content, runTextAttachments)
    await runQuickConversationStream(
      settings.baseUrl,
      settings.apiKey,
      settings.model,
      settings.temperature,
      settings.showReasoning,
      userPrompt,
      history,
      {
        onContent: (text) => {
          if (!isRunActive(session.id, session.mode)) return
          singleAgentContentRef.current += text
          setSingleAgentContentStarted(true)
          if (!contentRafIdRef.current) {
            contentRafIdRef.current = requestAnimationFrame(() => {
              setStreamingContent(singleAgentContentRef.current)
              scrollToBottom('smooth')
              contentRafIdRef.current = 0
            })
          }
        },
        ...(settings.showReasoning ? {
          onReasoning: (text: string) => {
            if (!isRunActive(session.id, session.mode)) return
            singleAgentReasoningRef.current += text
            if (!reasoningRafIdRef.current) {
              reasoningRafIdRef.current = requestAnimationFrame(() => {
                setSingleAgentReasoning(singleAgentReasoningRef.current)
                scrollToBottom('smooth')
                reasoningRafIdRef.current = 0
              })
            }
          },
        } : {}),
        onDone: (result) => {
          if (!isRunActive(session.id, session.mode)) return
          const reasoning = settings.showReasoning ? singleAgentReasoningRef.current : ''
          appendMessage(session.id, createMessage('assistant', result.optimizedPrompt, undefined, reasoning ? { reasoning } : undefined))
          finishRun()
        },
        onError: (err) => {
          if (!isRunActive(session.id, session.mode)) return
          failRun(err)
        },
      },
      controller.signal,
      settings.quickOptimizePrompt
    )
  }, [appendMessage, failRun, finishRun, isRunActive, scrollToBottom, settings])

  const runDeep = useCallback(async (session: WorkspaceSession, userMessage: WorkspaceMessage, history: WorkspaceMessage[], controller: AbortController, runTextAttachments: WorkspaceTextAttachmentPayload[] = []) => {
    const promptWithAttachments = buildPromptWithTextAttachments(userMessage.content, runTextAttachments)
    const userInput = buildContextPrompt(history, promptWithAttachments)
    await runPipelineStream(
      settings.baseUrl,
      settings.apiKey,
      settings.model,
      settings.temperature,
      userInput,
      {
        onStepStart: (step) => {
          if (!isRunActive(session.id, session.mode)) return
          setCurrentStep(step)
          setStepStatuses((prev) => ({ ...prev, [step]: 'streaming' }))
        },
        onStepContent: (step, text) => {
          if (!isRunActive(session.id, session.mode)) return
          stepContentRefs.current[step] += text
          setStepContentStarted((prev) => prev[step] ? prev : { ...prev, [step]: true })
          if (!contentRafIdRef.current) {
            contentRafIdRef.current = requestAnimationFrame(() => {
              setDraftPrompt(stepContentRefs.current.analyzer)
              setCritiqueReport(stepContentRefs.current.planner)
              setFinalPrompt(stepContentRefs.current.synthesizer)
              scrollToBottom('smooth')
              contentRafIdRef.current = 0
            })
          }
        },
        onStepReasoning: (step, text) => {
          if (!isRunActive(session.id, session.mode)) return
          stepReasoningRefs.current[step] += text
          if (!reasoningRafIdRef.current) {
            reasoningRafIdRef.current = requestAnimationFrame(() => {
              setDraftReasoning(stepReasoningRefs.current.analyzer)
              setCritiqueReasoning(stepReasoningRefs.current.planner)
              setSynthesizerReasoning(stepReasoningRefs.current.synthesizer)
              scrollToBottom('smooth')
              reasoningRafIdRef.current = 0
            })
          }
        },
        onStepDone: (step) => {
          if (!isRunActive(session.id, session.mode)) return
          setStepStatuses((prev) => ({ ...prev, [step]: 'done' }))
        },
        onPipelineDone: (result) => {
          if (!isRunActive(session.id, session.mode)) return
          const analyzerReasoningEnabled = getStepReasoningEnabled(settings, 'analyzer')
          const plannerReasoningEnabled = getStepReasoningEnabled(settings, 'planner')
          const synthesizerReasoningEnabled = getStepReasoningEnabled(settings, 'synthesizer')
          const artifact = {
            pipeline: {
              draftPrompt: result.draftPrompt,
              critiqueReport: result.critiqueReport,
              finalPrompt: result.finalPrompt,
              draftReasoning: analyzerReasoningEnabled ? stepReasoningRefs.current.analyzer : '',
              critiqueReasoning: plannerReasoningEnabled ? stepReasoningRefs.current.planner : '',
              synthesizerReasoning: synthesizerReasoningEnabled ? stepReasoningRefs.current.synthesizer : '',
            },
          }
          appendMessage(session.id, createMessage('assistant', result.finalPrompt, undefined, artifact))
          setCurrentStep(null)
          finishRun()
        },
        onError: (step, err) => {
          if (!isRunActive(session.id, session.mode)) return
          setCurrentStep(step)
          setStepStatuses((prev) => ({ ...prev, [step]: 'error' }))
          failRun(err)
        },
      },
      controller.signal,
      {
        analyzer: settings.analyzerPrompt,
        planner: settings.plannerPrompt,
        synthesizer: settings.synthesizerPrompt,
      },
      { analyzer: settings.analyzerModel, planner: settings.plannerModel, synthesizer: settings.synthesizerModel, showReasoning: settings.showReasoning }
    )
  }, [appendMessage, failRun, finishRun, isRunActive, scrollToBottom, settings])

  const runImage2Prompt = useCallback(async (session: WorkspaceSession, userMessage: WorkspaceMessage, history: WorkspaceMessage[], controller: AbortController, runImages: WorkspaceImage[]) => {
    const config = getModelConfig(settings, 'image2prompt')
    const onContent = (text: string) => {
      if (!isRunActive(session.id, session.mode)) return
      singleAgentContentRef.current += text
      setSingleAgentContentStarted(true)
      if (!contentRafIdRef.current) {
        contentRafIdRef.current = requestAnimationFrame(() => {
          setStreamingContent(singleAgentContentRef.current)
          scrollToBottom('smooth')
          contentRafIdRef.current = 0
        })
      }
    }
    const onDone = (content: string) => {
      if (!isRunActive(session.id, session.mode)) return
      const reasoning = config.showReasoning ? singleAgentReasoningRef.current.trim() : ''
      appendMessage(session.id, createMessage('assistant', content, undefined, reasoning ? { reasoning } : undefined))
      finishRun()
    }
    const onReasoning = (text: string) => {
      if (!isRunActive(session.id, session.mode)) return
      singleAgentReasoningRef.current += text
      if (!reasoningRafIdRef.current) {
        reasoningRafIdRef.current = requestAnimationFrame(() => {
          setSingleAgentReasoning(singleAgentReasoningRef.current)
          scrollToBottom('smooth')
          reasoningRafIdRef.current = 0
        })
      }
    }

    await runImage2PromptStream(
      config,
      userMessage.content,
      runImages,
      history,
      {
        onContent,
        ...(config.showReasoning ? { onReasoning } : {}),
        onDone,
        onError: (err) => {
          if (!isRunActive(session.id, session.mode)) return
          failRun(err)
        },
      },
      controller.signal,
      settings.image2PromptPrompt
    )
  }, [appendMessage, failRun, finishRun, isRunActive, scrollToBottom, settings])

  const runMode = useCallback(async (session: WorkspaceSession, userMessage: WorkspaceMessage, history: WorkspaceMessage[], controller: AbortController, runImages: WorkspaceImage[] = [], runTextAttachments: WorkspaceTextAttachmentPayload[] = []) => {
    if (session.mode === 'quick') await runQuick(session, userMessage, history, controller, runTextAttachments)
    else if (session.mode === 'deep') await runDeep(session, userMessage, history, controller, runTextAttachments)
    else await runImage2Prompt(session, userMessage, history, controller, runImages)
  }, [runDeep, runImage2Prompt, runQuick])

  const handleSubmit = useCallback(() => {
    if (!mode || isStreaming || !settingsReady) return
    if (mode !== 'image2prompt' && !input.trim() && textAttachments.length === 0) return
    if (mode === 'image2prompt' && input.trim().length === 0 && images.length === 0) return
    const { session, userMessage, controller, history, runImages, runTextAttachments } = prepareRun(
      mode,
      input.trim(),
      mode === 'image2prompt' ? images : [],
      mode === 'image2prompt' ? [] : textAttachments
    )
    void runMode(session, userMessage, history, controller, runImages, runTextAttachments)
  }, [images, input, isStreaming, mode, prepareRun, runMode, settingsReady, textAttachments])

  const latestMessage = visibleMessages.at(-1)
  const latestAssistant = latestMessage?.role === 'assistant' ? latestMessage : undefined
  const latestAssistantIndex = latestAssistant ? visibleMessages.length - 1 : -1
  const retryUserMessage = latestAssistantIndex > 0
    ? [...visibleMessages.slice(0, latestAssistantIndex)].reverse().find((message) => message.role === 'user')
    : undefined
  const canRetryLatest = Boolean(currentSession && latestAssistant && retryUserMessage && currentSession.mode !== 'image2prompt' && !retryUserMessage.attachments?.length && !isStreaming)
  const isSingleAgentPromptStreaming = isStreaming && singleAgentContentStarted
  const image2PromptReasoningEnabled = hasCompleteModelConfig(settings.image2PromptModel)
    ? settings.image2PromptModel.showReasoning
    : settings.showReasoning
  const shouldShowSingleAgentOutput = (mode === 'quick' || mode === 'image2prompt') && isStreaming
  const shouldShowDeepOutput = mode === 'deep' && (
    isStreaming ||
    Boolean(error && (currentStep || draftPrompt || critiqueReport || finalPrompt || draftReasoning || critiqueReasoning || synthesizerReasoning))
  )
  const analyzerThinking = hasCompleteModelConfig(settings.analyzerModel) ? settings.analyzerModel.showReasoning : settings.showReasoning
  const plannerThinking = hasCompleteModelConfig(settings.plannerModel) ? settings.plannerModel.showReasoning : settings.showReasoning
  const synthesizerThinking = hasCompleteModelConfig(settings.synthesizerModel) ? settings.synthesizerModel.showReasoning : settings.showReasoning

  const handleRetryFailedRun = useCallback(() => {
    const payload = lastFailedRunRef.current
    if (!payload || isStreaming) return
    const retryRun = prepareFailedRetryRun(payload)
    if (!retryRun) return
    void runMode(retryRun.session, retryRun.userMessage, retryRun.history, retryRun.controller, retryRun.runImages, retryRun.runTextAttachments)
  }, [isStreaming, prepareFailedRetryRun, runMode])

  const handleRetryLatest = useCallback(() => {
    if (!currentSession || !latestAssistant || !retryUserMessage || isStreaming || currentSession.mode === 'image2prompt') return
    const { controller, history, runTextAttachments } = prepareLatestRetryRun(currentSession, latestAssistant, retryUserMessage)
    void runMode(currentSession, retryUserMessage, history, controller, [], runTextAttachments)
  }, [currentSession, isStreaming, latestAssistant, prepareLatestRetryRun, retryUserMessage, runMode])

  const showHero = !displayMode || workspaceTransition === 'entering' || workspaceTransition === 'leaving'

  if (!mode) {
    return (
      <div className="relative h-full overflow-hidden">
        {showHero && (
          <div className={`h-full overflow-y-auto scrollbar-gutter-stable ${workspaceTransition === 'entering' ? 'reprompt-hero-exit pointer-events-none' : ''} ${workspaceTransition === 'leaving' ? 'reprompt-hero-enter' : ''}`}>
            <RepromptHero onSelectMode={handleSelectMode} />
          </div>
        )}
      </div>
    )
  }

  const Icon = MODE_META[mode].icon
  const settingsHelperText = settingsReady
    ? MODE_META[mode].helper
    : mode === 'deep'
    ? '建议先到核心设定配置主大脑，或完整配置深度优化三位智能体的大脑。'
    : mode === 'image2prompt'
    ? '建议先到核心设定配置图转提示专属 VLM / 多模态模型。'
    : '建议先到核心设定配置 API Key、Base URL 和模型。'

  return (
    <div className="relative h-full overflow-hidden">
      {showHero && (
        <div className={`h-full overflow-y-auto scrollbar-gutter-stable ${workspaceTransition === 'entering' ? 'reprompt-hero-exit pointer-events-none' : ''} ${workspaceTransition === 'leaving' ? 'reprompt-hero-enter' : ''}`}>
          <RepromptHero onSelectMode={handleSelectMode} />
        </div>
      )}

      <div className={`border-b border-[var(--border-color)] bg-[var(--bg-main)]/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-main)]/85 ${workspaceTransition === 'entering' ? 'reprompt-workspace-header-enter' : ''} ${workspaceTransition === 'leaving' ? 'reprompt-workspace-header-exit pointer-events-none' : ''}`}>
        <div className="mx-auto flex h-10 w-full max-w-3xl items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-light)]">
            <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{MODE_META[mode].title}</h2>
            <p className="text-sm text-[var(--text-muted)]">{MODE_META[mode].description}</p>
          </div>
        </div>
      </div>

      <div ref={contentScrollRef} onScroll={updateScrollToBottomVisibility} className={`h-[calc(100%-57px)] overflow-y-auto overflow-x-hidden scrollbar-gutter-stable ${workspaceTransition === 'entering' ? 'reprompt-workspace-enter' : ''} ${workspaceTransition === 'leaving' ? 'reprompt-workspace-exit pointer-events-none' : ''}`}>
        <div className={`mx-auto w-full max-w-3xl px-6 pb-64 pt-6 ${workspaceTransition === 'entering' ? 'reprompt-workspace-content-enter' : ''}`}>
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              <div className="flex items-center justify-between gap-3">
                <span>{error}</span>
                {failedRetryState.canRetry && !isStreaming && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetryFailedRun}
                    className="shrink-0 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    重试
                  </Button>
                )}
              </div>
              {failedRetryState.hint && <p className="mt-2 text-xs text-red-500/80">{failedRetryState.hint}</p>}
            </div>
          )}

          <div className="space-y-6">
            <WorkspaceMessages
              messages={visibleMessages}
              latestAssistantId={latestAssistant?.id}
              onRetryLatest={canRetryLatest ? handleRetryLatest : undefined}
              retrying={isStreaming}
            />

            {shouldShowSingleAgentOutput && (
              <OutputSection
                analysis={singleAgentReasoning}
                optimizedPrompt={streamingContent}
                isStreaming={isStreaming}
                isStopped={isStopped}
                isThinkingModel={mode === 'quick' ? settings.showReasoning : image2PromptReasoningEnabled}
                isPromptStreaming={isSingleAgentPromptStreaming}
                onRetry={undefined}
              />
            )}

            {shouldShowDeepOutput && (
              <PipelineOutputSection
                draftPrompt={draftPrompt}
                critiqueReport={critiqueReport}
                finalPrompt={finalPrompt}
                draftReasoning={draftReasoning}
                critiqueReasoning={critiqueReasoning}
                synthesizerReasoning={synthesizerReasoning}
                currentStep={currentStep}
                stepStatuses={isStreaming || error ? stepStatuses : EMPTY_STEP_STATUS}
                stepContentStarted={isStreaming ? stepContentStarted : EMPTY_STEP_STARTED}
                analyzerThinking={analyzerThinking}
                plannerThinking={plannerThinking}
                synthesizerThinking={synthesizerThinking}
                isStreaming={isStreaming}
              />
            )}

          </div>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-10 border-t border-[var(--border-color)] bg-[var(--bg-main)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-main)]/85 ${workspaceTransition === 'entering' ? 'reprompt-composer-enter' : ''} ${workspaceTransition === 'leaving' ? 'reprompt-composer-exit pointer-events-none' : ''}`}>
        {showScrollToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute left-1/2 top-0 z-20 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-lg shadow-black/10 transition-colors transition-transform duration-150 hover:-translate-y-[55%] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:-translate-y-[45%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/45"
            aria-label="滚动到底部"
            title="滚动到底部"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
        <div className="pointer-events-none absolute left-0 right-0 -top-10 h-10 bg-gradient-to-t from-[var(--bg-main)]/95 to-transparent" />
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <WorkspaceComposer
            value={input}
            placeholder={MODE_META[mode].placeholder}
            disabled={!settingsReady}
            loading={loading}
            stopped={isStopped}
            allowImages={mode === 'image2prompt'}
            allowTextAttachments={mode !== 'image2prompt'}
            images={images}
            textAttachments={textAttachments}
            helperText={settingsHelperText}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStopStreaming}
            onImagesChange={setImages}
            onTextAttachmentsChange={setTextAttachments}
          />
          {!settingsReady && (
            <p
              className="mt-2 cursor-pointer text-xs text-[var(--accent-primary)] underline underline-offset-2 transition-colors hover:text-[var(--accent-hover)]"
              onClick={() => {
                const { activeTab, settingsLeaveGuard, setSettingsMode, setActiveTab } = useUIStore.getState()
                if (activeTab === 'settings' && settingsLeaveGuard && !settingsLeaveGuard()) return
                if (mode) setSettingsMode(mode)
                setActiveTab('settings')
              }}
            >
              建议配置您自己的 API Key
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
