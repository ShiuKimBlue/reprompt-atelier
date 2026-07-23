import { useState, useCallback, useRef, useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useUIStore } from '@/stores/useUIStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { Separator } from '@/components/ui/separator'
import {
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Settings,
  Brain,
  UserCog,
  Search,
  ListTodo,
  Flame,
  Zap,
  Layers,
  Image,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react'
import { ANALYZER_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT, SYNTHESIZER_SYSTEM_PROMPT, QUICK_OPTIMIZE_SYSTEM_PROMPT, IMAGE2PROMPT_SYSTEM_PROMPT } from '@/lib/prompts'
import { testApiConnection, fingerprintModelConfig, SUCCESS_AUTO_RESET_MS, type ConnectionStatus, type ConnectionTestMode } from '@/lib/testApiConnection'
import type { ModelConfig, SettingsMode } from '@/types'

const EMPTY_MODEL_CONFIG: ModelConfig = { baseUrl: '', apiKey: '', model: '', temperature: 0.4, showReasoning: false }
const MODE_ORDER: SettingsMode[] = ['quick', 'deep', 'image2prompt']

const MODE_META: Record<SettingsMode, { icon: typeof Zap; title: string; description: string; personalityDescription: string }> = {
  quick: {
    icon: Zap,
    title: '快速优化',
    description: '一个大脑，一次出稿，适合把粗糙想法快速炼成可用提示词。',
    personalityDescription: '单步直接优化，快速出结果',
  },
  deep: {
    icon: Layers,
    title: '深度优化',
    description: '固定 MMM 多模型流水线，三个智能体分别承担分析、调度与合成。',
    personalityDescription: '三智能体流水线的人格与系统提示词',
  },
  image2prompt: {
    icon: Image,
    title: '图转提示',
    description: '用支持图片输入的多模态模型，从图像反推出可复用的生图提示词。',
    personalityDescription: '根据图片和文字补充反推出生图提示词',
  },
}

function getModelConfigStatus(config: ModelConfig): 'empty' | 'partial' | 'complete' {
  const fields = [config.baseUrl.trim(), config.apiKey.trim(), config.model.trim()]
  const filledCount = fields.filter(Boolean).length
  if (filledCount === 0) return 'empty'
  if (filledCount === fields.length) return 'complete'
  return 'partial'
}

function normalizeModelConfig(config: ModelConfig): ModelConfig | null {
  return config.baseUrl.trim() || config.apiKey.trim() || config.model.trim()
    ? config
    : null
}

function modelEquals(formValue: ModelConfig, savedValue: ModelConfig | null): boolean {
  return JSON.stringify(normalizeModelConfig(formValue)) === JSON.stringify(savedValue)
}

/** Raw wheel/touch accumulation needed to commit a mode change */
const OVERSCROLL_COMMIT = 150
/** Soft wall visual scale (px resistance domain for rubberband) */
const OVERSCROLL_DIMENSION = 140
/** Max visual pull after rubberband (px) */
const OVERSCROLL_MAX_PULL = 52
/** Idle after last boundary gesture → snap back if not committed */
const OVERSCROLL_IDLE_MS = 140
/** Lock input during directed page transition */
const OVERSCROLL_LOCK_MS = 520
const MODE_EXIT_MS = 200
const MODE_ENTER_MS = 220

type PromptPanelId = 'analyzer' | 'planner' | 'synthesizer' | 'quickOptimize' | 'image2Prompt'
type ModelPanelId = 'analyzer' | 'planner' | 'synthesizer' | 'image2Prompt'
type OverscrollDirection = 'prev' | 'next'
type ModeTransitionDir = 'next' | 'prev' | 'fade'

interface OverscrollState {
  direction: OverscrollDirection | null
  /** Unsigned raw effort before rubberband */
  amount: number
  lastAt: number
}

function defaultPromptPanelForMode(mode: SettingsMode): PromptPanelId {
  if (mode === 'deep') return 'analyzer'
  if (mode === 'image2prompt') return 'image2Prompt'
  return 'quickOptimize'
}

function defaultModelPanelForMode(mode: SettingsMode): ModelPanelId | null {
  if (mode === 'deep') return 'analyzer'
  return null
}

function resetOverscrollState(state: OverscrollState) {
  state.direction = null
  state.amount = 0
  state.lastAt = 0
}

/** Apple-style progressive resistance past an edge */
function rubberband(overshoot: number, dimension = OVERSCROLL_DIMENSION, constant = 0.55) {
  if (overshoot <= 0) return 0
  return (overshoot * dimension * constant) / (dimension + constant * overshoot)
}

function pullVisualPx(amount: number, direction: OverscrollDirection | null) {
  if (!direction || amount <= 0) return 0
  const visual = Math.min(OVERSCROLL_MAX_PULL, rubberband(amount))
  // next: content lifts up; prev: content dips down
  return direction === 'next' ? -visual : visual
}

function createEmptyModelConfig(): ModelConfig {
  return { ...EMPTY_MODEL_CONFIG }
}

export function SettingsView() {
  const settings = useSettingsStore()
  const { activeSettingsMode, setSettingsMode, setSettingsLeaveGuard } = useUIStore()
  const prefersReducedMotion = usePrefersReducedMotion()
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [apiSaved, setApiSaved] = useState(false)
  const [promptsSaved, setPromptsSaved] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [transitionDir, setTransitionDir] = useState<ModeTransitionDir>('fade')
  /** Signed visual offset while rubberbanding at page edge (px) */
  const [edgePull, setEdgePull] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pageRef = useRef<HTMLDivElement | null>(null)
  const wheelLockRef = useRef(false)
  const overscrollRef = useRef<OverscrollState>({ direction: null, amount: 0, lastAt: 0 })
  const idleSnapRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchAtBoundaryRef = useRef<OverscrollDirection | null>(null)
  const modeIndexRef = useRef(0)
  const activeModeRef = useRef(activeSettingsMode)
  const prefersReducedMotionRef = useRef(prefersReducedMotion)

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(clearTimeout)
      if (idleSnapRef.current) clearTimeout(idleSnapRef.current)
    }
  }, [])

  const [expandedPanel, setExpandedPanel] = useState<PromptPanelId | null>(defaultPromptPanelForMode(activeSettingsMode))
  const [expandedModelPanel, setExpandedModelPanel] = useState<ModelPanelId | null>(defaultModelPanelForMode(activeSettingsMode))

  useEffect(() => {
    activeModeRef.current = activeSettingsMode
    modeIndexRef.current = MODE_ORDER.indexOf(activeSettingsMode)
    prefersReducedMotionRef.current = prefersReducedMotion
  }, [activeSettingsMode, prefersReducedMotion])

  useEffect(() => {
    queueMicrotask(() => {
      setExpandedPanel(defaultPromptPanelForMode(activeSettingsMode))
      setExpandedModelPanel(defaultModelPanelForMode(activeSettingsMode))
      resetOverscrollState(overscrollRef.current)
      setEdgePull(0)
    })
  }, [activeSettingsMode])

  const [form, setForm] = useState({
    baseUrl: settings.baseUrl,
    apiKey: settings.apiKey,
    model: settings.model,
    temperature: settings.temperature,
    showReasoning: settings.showReasoning,
    analyzerPrompt: settings.analyzerPrompt,
    plannerPrompt: settings.plannerPrompt,
    synthesizerPrompt: settings.synthesizerPrompt,
    quickOptimizePrompt: settings.quickOptimizePrompt,
    image2PromptPrompt: settings.image2PromptPrompt,
    analyzerModel: settings.analyzerModel ?? createEmptyModelConfig(),
    plannerModel: settings.plannerModel ?? createEmptyModelConfig(),
    synthesizerModel: settings.synthesizerModel ?? createEmptyModelConfig(),
    image2PromptModel: settings.image2PromptModel ?? createEmptyModelConfig(),
  })

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const modeIndex = MODE_ORDER.indexOf(activeSettingsMode)
  const meta = MODE_META[activeSettingsMode]
  const ModeIcon = meta.icon
  const pullProgress = Math.min(1, Math.abs(edgePull) / OVERSCROLL_MAX_PULL)

  const pageMotionStyle = (() => {
    if (prefersReducedMotion) {
      const dim = transitionPhase !== 'idle'
      return {
        transform: 'none' as const,
        opacity: dim ? 0.35 : 1,
        transition: `opacity ${dim ? MODE_EXIT_MS : MODE_ENTER_MS}ms ease-out`,
      }
    }

    if (transitionPhase === 'exiting') {
      const outbound =
        transitionDir === 'next' ? -32
          : transitionDir === 'prev' ? 32
            : 14
      return {
        transform: `translate3d(0, ${outbound}px, 0)`,
        opacity: 0.18,
        transition: `transform ${MODE_EXIT_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${MODE_EXIT_MS}ms ease-out`,
      }
    }

    if (transitionPhase === 'entering') {
      // Opposite side of exit — one frame at start pose, then idle animates home
      const inbound =
        transitionDir === 'next' ? 28
          : transitionDir === 'prev' ? -28
            : 10
      return {
        transform: `translate3d(0, ${inbound}px, 0)`,
        opacity: 0.28,
        transition: 'none',
      }
    }

    // Settled page, possibly mid rubber-band
    const settling = edgePull === 0
    return {
      transform: `translate3d(0, ${edgePull}px, 0)`,
      opacity: 1 - pullProgress * 0.08,
      transition: settling
        ? `transform ${MODE_ENTER_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease-out`
        : 'none',
    }
  })()

  const flashSaved = useCallback((setter: (saved: boolean) => void) => {
    setter(true)
    timersRef.current.push(setTimeout(() => setter(false), 2000))
  }, [])

  const toggleApiKeyVisibility = useCallback((id: string) => {
    setShowApiKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleApiSave = useCallback(() => {
    if (activeSettingsMode === 'quick') {
      settings.updateSettings({
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
        model: form.model,
        temperature: form.temperature,
        showReasoning: form.showReasoning,
      })
    } else if (activeSettingsMode === 'deep') {
      settings.updateSettings({
        analyzerModel: normalizeModelConfig(form.analyzerModel),
        plannerModel: normalizeModelConfig(form.plannerModel),
        synthesizerModel: normalizeModelConfig(form.synthesizerModel),
      })
    } else {
      settings.updateSettings({
        image2PromptModel: normalizeModelConfig(form.image2PromptModel),
      })
    }
    flashSaved(setApiSaved)
  }, [activeSettingsMode, flashSaved, form, settings])

  const handleApiReset = useCallback(() => {
    if (activeSettingsMode === 'quick') {
      setForm((prev) => ({
        ...prev,
        baseUrl: '',
        apiKey: '',
        model: '',
        temperature: 0.4,
        showReasoning: false,
      }))
    } else if (activeSettingsMode === 'deep') {
      setForm((prev) => ({
        ...prev,
        analyzerModel: createEmptyModelConfig(),
        plannerModel: createEmptyModelConfig(),
        synthesizerModel: createEmptyModelConfig(),
      }))
    } else {
      setForm((prev) => ({ ...prev, image2PromptModel: createEmptyModelConfig() }))
    }
  }, [activeSettingsMode])

  const handlePromptsSave = useCallback(() => {
    if (activeSettingsMode === 'quick') {
      settings.updateSettings({ quickOptimizePrompt: form.quickOptimizePrompt })
    } else if (activeSettingsMode === 'deep') {
      settings.updateSettings({
        analyzerPrompt: form.analyzerPrompt,
        plannerPrompt: form.plannerPrompt,
        synthesizerPrompt: form.synthesizerPrompt,
      })
    } else {
      settings.updateSettings({ image2PromptPrompt: form.image2PromptPrompt })
    }
    flashSaved(setPromptsSaved)
  }, [activeSettingsMode, flashSaved, form, settings])

  const handlePromptsReset = useCallback(() => {
    if (activeSettingsMode === 'quick') {
      setForm((prev) => ({ ...prev, quickOptimizePrompt: QUICK_OPTIMIZE_SYSTEM_PROMPT }))
    } else if (activeSettingsMode === 'deep') {
      setForm((prev) => ({
        ...prev,
        analyzerPrompt: ANALYZER_SYSTEM_PROMPT,
        plannerPrompt: PLANNER_SYSTEM_PROMPT,
        synthesizerPrompt: SYNTHESIZER_SYSTEM_PROMPT,
      }))
    } else {
      setForm((prev) => ({ ...prev, image2PromptPrompt: IMAGE2PROMPT_SYSTEM_PROMPT }))
    }
  }, [activeSettingsMode])

  const clearIdleSnap = useCallback(() => {
    if (idleSnapRef.current) {
      clearTimeout(idleSnapRef.current)
      idleSnapRef.current = null
    }
  }, [])

  const snapEdgeBack = useCallback(() => {
    clearIdleSnap()
    resetOverscrollState(overscrollRef.current)
    setEdgePull(0)
  }, [clearIdleSnap])

  const scheduleIdleSnap = useCallback(() => {
    clearIdleSnap()
    idleSnapRef.current = setTimeout(() => {
      idleSnapRef.current = null
      if (wheelLockRef.current) return
      // Release without enough effort → rubber-band home
      resetOverscrollState(overscrollRef.current)
      setEdgePull(0)
    }, OVERSCROLL_IDLE_MS)
  }, [clearIdleSnap])

  const switchMode = useCallback((nextMode: SettingsMode, dir: ModeTransitionDir = 'fade') => {
    if (nextMode === activeModeRef.current) return
    clearIdleSnap()
    resetOverscrollState(overscrollRef.current)
    setEdgePull(0)
    setTransitionDir(dir)
    setTransitionPhase('exiting')
    wheelLockRef.current = true

    const exitMs = prefersReducedMotionRef.current ? 1 : MODE_EXIT_MS
    const enterMs = prefersReducedMotionRef.current ? 1 : MODE_ENTER_MS

    timersRef.current.push(setTimeout(() => {
      setSettingsMode(nextMode)
      pageRef.current?.scrollTo({ top: 0 })
      setExpandedPanel(defaultPromptPanelForMode(nextMode))
      setExpandedModelPanel(defaultModelPanelForMode(nextMode))
      // Enter from the opposite side of the exit
      setTransitionPhase('entering')
      // Paint start pose, then release to idle so CSS can settle into place
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionPhase('idle')
          setTransitionDir('fade')
        })
      })
      timersRef.current.push(setTimeout(() => {
        wheelLockRef.current = false
      }, Math.max(OVERSCROLL_LOCK_MS, exitMs + enterMs + 80)))
    }, exitMs))
  }, [clearIdleSnap, setExpandedModelPanel, setExpandedPanel, setSettingsMode])

  const tryCommitOverscroll = useCallback((direction: OverscrollDirection) => {
    const idx = modeIndexRef.current
    const nextIndex = direction === 'next' ? idx + 1 : idx - 1
    const nextMode = MODE_ORDER[nextIndex]
    if (!nextMode || nextMode === activeModeRef.current) return false
    switchMode(nextMode, direction)
    return true
  }, [switchMode])

  const applyBoundaryDelta = useCallback((deltaY: number, source: 'wheel' | 'touch') => {
    const target = pageRef.current
    if (!target || wheelLockRef.current) return false
    if (Math.abs(deltaY) < (source === 'wheel' ? 4 : 2)) return false

    const atTop = target.scrollTop <= 0
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 2
    const direction: OverscrollDirection | null =
      deltaY > 0 && atBottom ? 'next' : deltaY < 0 && atTop ? 'prev' : null

    if (!direction) {
      if (overscrollRef.current.amount > 0) snapEdgeBack()
      return false
    }

    const idx = modeIndexRef.current
    const nextIndex = direction === 'next' ? idx + 1 : idx - 1
    const canNavigate = nextIndex >= 0 && nextIndex < MODE_ORDER.length

    // End of list: soft wall only (no commit), still show resistance
    const overscroll = overscrollRef.current
    if (overscroll.direction !== direction) {
      overscroll.direction = direction
      overscroll.amount = 0
    }

    // When pulling back toward center, reduce amount
    const pushingOut =
      (direction === 'next' && deltaY > 0) || (direction === 'prev' && deltaY < 0)
    if (pushingOut) {
      overscroll.amount += Math.abs(deltaY) * (source === 'touch' ? 1.05 : 1)
    } else {
      overscroll.amount = Math.max(0, overscroll.amount - Math.abs(deltaY) * 1.2)
    }
    overscroll.lastAt = Date.now()

    if (prefersReducedMotionRef.current) {
      // No live pull; commit only after enough effort
      if (canNavigate && overscroll.amount >= OVERSCROLL_COMMIT) {
        resetOverscrollState(overscroll)
        setEdgePull(0)
        tryCommitOverscroll(direction)
        return true
      }
      scheduleIdleSnap()
      return canNavigate
    }

    // Live rubber-band visual (cap harder at terminal edge)
    const amountForVisual = canNavigate ? overscroll.amount : overscroll.amount * 0.55
    setEdgePull(pullVisualPx(amountForVisual, direction))

    if (canNavigate && overscroll.amount >= OVERSCROLL_COMMIT) {
      resetOverscrollState(overscroll)
      // Keep a short outbound flick so exit feels continuous with the pull
      setEdgePull(direction === 'next' ? -OVERSCROLL_MAX_PULL : OVERSCROLL_MAX_PULL)
      tryCommitOverscroll(direction)
      return true
    }

    scheduleIdleSnap()
    return true
  }, [scheduleIdleSnap, snapEdgeBack, tryCommitOverscroll])

  // Wheel + touch: non-passive so we can preventDefault at page edges
  useEffect(() => {
    const el = pageRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      if (wheelLockRef.current) return

      const atTop = el.scrollTop <= 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
      const atBoundary =
        (event.deltaY > 0 && atBottom) || (event.deltaY < 0 && atTop)

      if (!atBoundary) {
        if (overscrollRef.current.amount > 0) snapEdgeBack()
        return
      }

      const idx = modeIndexRef.current
      const direction: OverscrollDirection = event.deltaY > 0 ? 'next' : 'prev'
      const nextIndex = direction === 'next' ? idx + 1 : idx - 1
      const canNavigate = nextIndex >= 0 && nextIndex < MODE_ORDER.length
      if (canNavigate || overscrollRef.current.amount > 0) {
        event.preventDefault()
      }

      applyBoundaryDelta(event.deltaY, 'wheel')
    }

    const onTouchStart = (e: TouchEvent) => {
      if (wheelLockRef.current || e.touches.length !== 1) return
      touchStartYRef.current = e.touches[0].clientY
      touchAtBoundaryRef.current = null
    }

    const onTouchMove = (e: TouchEvent) => {
      if (wheelLockRef.current || touchStartYRef.current == null || e.touches.length !== 1) return
      const y = e.touches[0].clientY
      const deltaY = touchStartYRef.current - y // match wheel: positive = scroll down / next
      touchStartYRef.current = y

      const atTop = el.scrollTop <= 0
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2

      if (deltaY > 0 && atBottom) touchAtBoundaryRef.current = 'next'
      else if (deltaY < 0 && atTop) touchAtBoundaryRef.current = 'prev'
      else if (
        touchAtBoundaryRef.current === 'next' && !(atBottom && deltaY > 0) &&
        overscrollRef.current.amount <= 0
      ) {
        touchAtBoundaryRef.current = null
      } else if (
        touchAtBoundaryRef.current === 'prev' && !(atTop && deltaY < 0) &&
        overscrollRef.current.amount <= 0
      ) {
        touchAtBoundaryRef.current = null
      }

      if (!touchAtBoundaryRef.current && overscrollRef.current.amount <= 0) return

      const owned = applyBoundaryDelta(deltaY, 'touch')
      if (owned && e.cancelable) e.preventDefault()
    }

    const onTouchEnd = () => {
      touchStartYRef.current = null
      touchAtBoundaryRef.current = null
      if (wheelLockRef.current) return
      const overscroll = overscrollRef.current
      if (overscroll.direction && overscroll.amount >= OVERSCROLL_COMMIT * 0.72) {
        const dir = overscroll.direction
        resetOverscrollState(overscroll)
        setEdgePull(dir === 'next' ? -OVERSCROLL_MAX_PULL : OVERSCROLL_MAX_PULL)
        tryCommitOverscroll(dir)
        return
      }
      scheduleIdleSnap()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [applyBoundaryDelta, scheduleIdleSnap, snapEdgeBack, tryCommitOverscroll])

  const isApiDirty = activeSettingsMode === 'quick'
    ? form.baseUrl !== settings.baseUrl ||
      form.apiKey !== settings.apiKey ||
      form.model !== settings.model ||
      form.temperature !== settings.temperature ||
      form.showReasoning !== settings.showReasoning
    : activeSettingsMode === 'deep'
      ? !modelEquals(form.analyzerModel, settings.analyzerModel) ||
        !modelEquals(form.plannerModel, settings.plannerModel) ||
        !modelEquals(form.synthesizerModel, settings.synthesizerModel)
      : !modelEquals(form.image2PromptModel, settings.image2PromptModel)

  const isPromptsDirty = activeSettingsMode === 'quick'
    ? form.quickOptimizePrompt !== settings.quickOptimizePrompt
    : activeSettingsMode === 'deep'
      ? form.analyzerPrompt !== settings.analyzerPrompt ||
        form.plannerPrompt !== settings.plannerPrompt ||
        form.synthesizerPrompt !== settings.synthesizerPrompt
      : form.image2PromptPrompt !== settings.image2PromptPrompt

  const hasUnsavedChanges =
    form.baseUrl !== settings.baseUrl ||
    form.apiKey !== settings.apiKey ||
    form.model !== settings.model ||
    form.temperature !== settings.temperature ||
    form.showReasoning !== settings.showReasoning ||
    !modelEquals(form.analyzerModel, settings.analyzerModel) ||
    !modelEquals(form.plannerModel, settings.plannerModel) ||
    !modelEquals(form.synthesizerModel, settings.synthesizerModel) ||
    !modelEquals(form.image2PromptModel, settings.image2PromptModel) ||
    form.quickOptimizePrompt !== settings.quickOptimizePrompt ||
    form.analyzerPrompt !== settings.analyzerPrompt ||
    form.plannerPrompt !== settings.plannerPrompt ||
    form.synthesizerPrompt !== settings.synthesizerPrompt ||
    form.image2PromptPrompt !== settings.image2PromptPrompt

  useEffect(() => {
    const guard = () => !hasUnsavedChanges || window.confirm('核心设定还有未保存更改，离开后这些改动会丢失。确定离开吗？')
    setSettingsLeaveGuard(guard)
    return () => setSettingsLeaveGuard(null)
  }, [hasUnsavedChanges, setSettingsLeaveGuard])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <div className="h-full overflow-hidden">
      <div className="sticky top-0 z-10 border-b border-[var(--border-color)] bg-[var(--bg-main)]/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-main)]/85">
        <div className="mx-auto flex h-10 w-full max-w-3xl items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-light)]">
            <ModeIcon className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">核心设定 · {meta.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">{meta.description}</p>
          </div>
          <div className="hidden items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 sm:flex">
            {MODE_ORDER.map((mode, index) => {
              const isActive = activeSettingsMode === mode
              const isNextHint =
                edgePull < 0 && index === modeIndex + 1 && pullProgress > 0.15
              const isPrevHint =
                edgePull > 0 && index === modeIndex - 1 && pullProgress > 0.15
              const hint = isNextHint || isPrevHint
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    if (mode === activeSettingsMode) return
                    const dir: ModeTransitionDir =
                      index > modeIndex ? 'next' : index < modeIndex ? 'prev' : 'fade'
                    switchMode(mode, dir)
                  }}
                  aria-label={`切换到${MODE_META[mode].title}`}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                    isActive
                      ? 'w-6 bg-[var(--accent-primary)]'
                      : hint
                        ? `bg-[var(--accent-primary)]/55 ${pullProgress > 0.65 ? 'w-3.5' : 'w-2.5'}`
                        : 'w-1.5 bg-[var(--border-color)] hover:bg-[var(--text-muted)]'
                  }`}
                  title={`${index + 1}. ${MODE_META[mode].title}`}
                />
              )
            })}
          </div>
        </div>
      </div>

      <div
        ref={pageRef}
        className="h-[calc(100%-57px)] overflow-y-auto overflow-x-hidden scrollbar-gutter-stable overscroll-y-contain"
      >
        <div
          className="mx-auto w-full max-w-3xl px-6 py-8 space-y-8 will-change-transform"
          style={pageMotionStyle}
        >
          <section className="space-y-4">
            <SectionHeader icon={Brain} title="缸中之脑" description="配置当前模式使用的模型 API" />
            {activeSettingsMode === 'quick' && renderQuickBrain({
              form,
              updateField,
              showApiKey: Boolean(showApiKeys.quick),
              onToggleApiKey: () => toggleApiKeyVisibility('quick'),
            })}
            {activeSettingsMode === 'deep' && renderDeepBrains({
              form,
              updateField,
              expandedModelPanel,
              setExpandedModelPanel,
              showApiKeys,
              toggleApiKeyVisibility,
            })}
            {activeSettingsMode === 'image2prompt' && renderImageBrain({
              form,
              updateField,
              showApiKey: Boolean(showApiKeys.image2Prompt),
              onToggleApiKey: () => toggleApiKeyVisibility('image2Prompt'),
            })}
            <SettingsActions
              saved={apiSaved}
              dirty={isApiDirty}
              onSave={handleApiSave}
              onReset={handleApiReset}
              saveLabel="保存大脑"
              resetLabel="清空配置"
              testConfig={activeSettingsMode === 'quick'
                ? {
                    config: { baseUrl: form.baseUrl, apiKey: form.apiKey, model: form.model, temperature: form.temperature, showReasoning: form.showReasoning },
                    mode: 'text',
                  }
                : activeSettingsMode === 'image2prompt'
                  ? { config: form.image2PromptModel, mode: 'vision' }
                  : undefined}
            />
          </section>

          <Separator className="bg-[var(--border-color)]" />

          <section className="space-y-4">
            <SectionHeader icon={UserCog} title="人格设定" description={meta.personalityDescription} />
            {activeSettingsMode === 'quick' && (
              <PromptPanel
                icon={Zap}
                label="速成咒术师"
                description="单步直接优化，快速出结果"
                savedValue={settings.quickOptimizePrompt}
                value={form.quickOptimizePrompt}
                defaultValue={QUICK_OPTIMIZE_SYSTEM_PROMPT}
                expanded={expandedPanel === 'quickOptimize'}
                onToggle={() => setExpandedPanel(expandedPanel === 'quickOptimize' ? null : 'quickOptimize')}
                onChange={(value) => updateField('quickOptimizePrompt', value)}
                onReset={() => updateField('quickOptimizePrompt', QUICK_OPTIMIZE_SYSTEM_PROMPT)}
              />
            )}
            {activeSettingsMode === 'deep' && renderDeepPrompts({
              form,
              updateField,
              expandedPanel,
              setExpandedPanel,
              savedPrompts: {
                analyzer: settings.analyzerPrompt,
                planner: settings.plannerPrompt,
                synthesizer: settings.synthesizerPrompt,
              },
            })}
            {activeSettingsMode === 'image2prompt' && (
              <PromptPanel
                icon={Image}
                label="图转提示师"
                description="根据图片和文字补充反推出生图提示词"
                savedValue={settings.image2PromptPrompt}
                value={form.image2PromptPrompt}
                defaultValue={IMAGE2PROMPT_SYSTEM_PROMPT}
                expanded={expandedPanel === 'image2Prompt'}
                onToggle={() => setExpandedPanel(expandedPanel === 'image2Prompt' ? null : 'image2Prompt')}
                onChange={(value) => updateField('image2PromptPrompt', value)}
                onReset={() => updateField('image2PromptPrompt', IMAGE2PROMPT_SYSTEM_PROMPT)}
              />
            )}
            <SettingsActions
              saved={promptsSaved}
              dirty={isPromptsDirty}
              onSave={handlePromptsSave}
              onReset={handlePromptsReset}
              saveLabel="保存人格"
            />
          </section>

          <div className="flex items-center justify-center gap-2 pb-4 pt-2 text-xs text-[var(--text-muted)]">
            <span>
              {modeIndex > 0
                ? pullProgress > 0.2 && edgePull > 0
                  ? '松手回弹 · 再拉一点切到上一页'
                  : '到顶后继续上拉切到上一页'
                : '已经是第一页'}
            </span>
            <span>·</span>
            <span>
              {modeIndex < MODE_ORDER.length - 1
                ? pullProgress > 0.2 && edgePull < 0
                  ? '松手回弹 · 再拉一点切到下一页'
                  : '到底后继续下拉切到下一页'
                : '已经是最后一页'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Render helpers ---------- */

interface SettingsForm {
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  showReasoning: boolean
  analyzerPrompt: string
  plannerPrompt: string
  synthesizerPrompt: string
  quickOptimizePrompt: string
  image2PromptPrompt: string
  analyzerModel: ModelConfig
  plannerModel: ModelConfig
  synthesizerModel: ModelConfig
  image2PromptModel: ModelConfig
}

type UpdateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void

function renderQuickBrain({
  form,
  updateField,
  showApiKey,
  onToggleApiKey,
}: {
  form: SettingsForm
  updateField: UpdateField
  showApiKey: boolean
  onToggleApiKey: () => void
}) {
  return (
    <div className="space-y-3">
      <FieldRow label="Base URL">
        <Input
          value={form.baseUrl}
          onChange={(e) => updateField('baseUrl', e.target.value)}
          placeholder="填写 API 地址"
          className="bg-[var(--bg-input)] border-[var(--border-color)]"
        />
      </FieldRow>
      <FieldRow label="API Key">
        <ApiKeyInput
          value={form.apiKey}
          visible={showApiKey}
          onChange={(apiKey) => updateField('apiKey', apiKey)}
          onToggleVisible={onToggleApiKey}
        />
      </FieldRow>
      <FieldRow label="Model">
        <Input
          value={form.model}
          onChange={(e) => updateField('model', e.target.value)}
          placeholder="填写模型名称"
          className="bg-[var(--bg-input)] border-[var(--border-color)]"
        />
      </FieldRow>
      <TemperatureField value={form.temperature} onChange={(value) => updateField('temperature', value)} />
      <ReasoningSwitch checked={form.showReasoning} onChange={(checked) => updateField('showReasoning', checked)} />
    </div>
  )
}

function renderDeepBrains({
  form,
  updateField,
  expandedModelPanel,
  setExpandedModelPanel,
  showApiKeys,
  toggleApiKeyVisibility,
}: {
  form: SettingsForm
  updateField: UpdateField
  expandedModelPanel: 'analyzer' | 'planner' | 'synthesizer' | 'image2Prompt' | null
  setExpandedModelPanel: (panel: 'analyzer' | 'planner' | 'synthesizer' | 'image2Prompt' | null) => void
  showApiKeys: Record<string, boolean>
  toggleApiKeyVisibility: (id: string) => void
}) {
  return (
    <div className="space-y-3">
      <ModelConfigPanel
        icon={Search}
        label="意图分析师"
        description="意图分析与扩展"
        value={form.analyzerModel}
        expanded={expandedModelPanel === 'analyzer'}
        showApiKey={Boolean(showApiKeys.analyzer)}
        onToggle={() => setExpandedModelPanel(expandedModelPanel === 'analyzer' ? null : 'analyzer')}
        onChange={(value) => updateField('analyzerModel', value)}
        onClear={() => updateField('analyzerModel', createEmptyModelConfig())}
        onToggleApiKey={() => toggleApiKeyVisibility('analyzer')}
      />
      <ModelConfigPanel
        icon={ListTodo}
        label="任务调度官"
        description="任务拆解"
        value={form.plannerModel}
        expanded={expandedModelPanel === 'planner'}
        showApiKey={Boolean(showApiKeys.planner)}
        onToggle={() => setExpandedModelPanel(expandedModelPanel === 'planner' ? null : 'planner')}
        onChange={(value) => updateField('plannerModel', value)}
        onClear={() => updateField('plannerModel', createEmptyModelConfig())}
        onToggleApiKey={() => toggleApiKeyVisibility('planner')}
      />
      <ModelConfigPanel
        icon={Flame}
        label="咒术合成者"
        description="三源合成"
        value={form.synthesizerModel}
        expanded={expandedModelPanel === 'synthesizer'}
        showApiKey={Boolean(showApiKeys.synthesizer)}
        onToggle={() => setExpandedModelPanel(expandedModelPanel === 'synthesizer' ? null : 'synthesizer')}
        onChange={(value) => updateField('synthesizerModel', value)}
        onClear={() => updateField('synthesizerModel', createEmptyModelConfig())}
        onToggleApiKey={() => toggleApiKeyVisibility('synthesizer')}
      />
    </div>
  )
}

function renderImageBrain({
  form,
  updateField,
  showApiKey,
  onToggleApiKey,
}: {
  form: SettingsForm
  updateField: UpdateField
  showApiKey: boolean
  onToggleApiKey: () => void
}) {
  return (
    <div className="space-y-3">
      <ModelConfigFields
        value={form.image2PromptModel}
        onChange={(value) => updateField('image2PromptModel', value)}
        showApiKey={showApiKey}
        onToggleApiKey={onToggleApiKey}
        modelPlaceholder="请填写 VLM / 多模态模型，普通文本模型无法读取图片"
      />
    </div>
  )
}

function renderDeepPrompts({
  form,
  updateField,
  expandedPanel,
  setExpandedPanel,
  savedPrompts,
}: {
  form: SettingsForm
  updateField: UpdateField
  expandedPanel: 'analyzer' | 'planner' | 'synthesizer' | 'quickOptimize' | 'image2Prompt' | null
  setExpandedPanel: (panel: 'analyzer' | 'planner' | 'synthesizer' | 'quickOptimize' | 'image2Prompt' | null) => void
  savedPrompts: {
    analyzer: string
    planner: string
    synthesizer: string
  }
}) {
  return (
    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-light)] to-transparent">
        <Layers className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">多智能体协作</span>
        <span className="text-xs text-[var(--text-muted)] ml-auto">3 步</span>
      </div>
      <PipelinePromptStep index={1} hasLine>
        <PromptPanel
          icon={Search}
          label="意图分析师"
          description="分析用户意图，扩展并结构化提示词"
          savedValue={savedPrompts.analyzer}
          value={form.analyzerPrompt}
          defaultValue={ANALYZER_SYSTEM_PROMPT}
          expanded={expandedPanel === 'analyzer'}
          onToggle={() => setExpandedPanel(expandedPanel === 'analyzer' ? null : 'analyzer')}
          onChange={(value) => updateField('analyzerPrompt', value)}
          onReset={() => updateField('analyzerPrompt', ANALYZER_SYSTEM_PROMPT)}
          borderless
        />
      </PipelinePromptStep>
      <PipelinePromptStep index={2} hasLine>
        <PromptPanel
          icon={ListTodo}
          label="任务调度官"
          description="拆解子任务，生成执行蓝图"
          savedValue={savedPrompts.planner}
          value={form.plannerPrompt}
          defaultValue={PLANNER_SYSTEM_PROMPT}
          expanded={expandedPanel === 'planner'}
          onToggle={() => setExpandedPanel(expandedPanel === 'planner' ? null : 'planner')}
          onChange={(value) => updateField('plannerPrompt', value)}
          onReset={() => updateField('plannerPrompt', PLANNER_SYSTEM_PROMPT)}
          borderless
        />
      </PipelinePromptStep>
      <PipelinePromptStep index={3}>
        <PromptPanel
          icon={Flame}
          label="咒术合成者"
          description="综合三源输入，合成最终可执行提示词"
          savedValue={savedPrompts.synthesizer}
          value={form.synthesizerPrompt}
          defaultValue={SYNTHESIZER_SYSTEM_PROMPT}
          expanded={expandedPanel === 'synthesizer'}
          onToggle={() => setExpandedPanel(expandedPanel === 'synthesizer' ? null : 'synthesizer')}
          onChange={(value) => updateField('synthesizerPrompt', value)}
          onReset={() => updateField('synthesizerPrompt', SYNTHESIZER_SYSTEM_PROMPT)}
          borderless
        />
      </PipelinePromptStep>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Settings
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--accent-primary)]" />
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-[var(--text-secondary)]">{label}</Label>
      {children}
    </div>
  )
}

function TemperatureField({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <FieldRow label="Temperature">
      <div className="flex items-center gap-3">
        <SliderPrimitive.Root
          className="flex-1"
          value={value}
          onValueChange={(nextValue) => {
            const temperature = Array.isArray(nextValue) ? nextValue[0] : nextValue
            onChange(temperature ?? value)
          }}
          min={0}
          max={2}
          step={0.1}
        >
          <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none h-5">
            <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-[var(--border-color)] h-1.5 w-full">
              <SliderPrimitive.Indicator className="bg-[var(--accent-primary)] h-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="relative block size-4 shrink-0 rounded-full border-2 border-[var(--accent-primary)] bg-white shadow-sm cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/50" />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
        <span className="text-sm font-mono text-[var(--text-secondary)] w-10 text-right">
          {value.toFixed(1)}
        </span>
      </div>
    </FieldRow>
  )
}

function ReasoningSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <Label className="text-sm text-[var(--text-secondary)]">Reasoning Content</Label>
        <p className="text-xs text-[var(--text-muted)]">展示模型的推理/思考内容（仅部分模型支持）</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label="展示模型推理内容" />
    </div>
  )
}

function ConnectionTestButton({ config, mode = 'text', size = 'md' }: { config: ModelConfig; mode?: ConnectionTestMode; size?: 'sm' | 'md' }) {
  const [testStatus, setTestStatus] = useState<ConnectionStatus>('idle')
  const [testLatency, setTestLatency] = useState<number | undefined>()
  const [testError, setTestError] = useState<string | undefined>()
  const [testedFingerprint, setTestedFingerprint] = useState<string | null>(null)
  const runRevisionRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)
  const autoResetTimerRef = useRef<number | undefined>(undefined)
  const fingerprint = `${mode}:${fingerprintModelConfig(config)}`

  const clearAutoReset = useCallback(() => {
    if (autoResetTimerRef.current !== undefined) {
      clearTimeout(autoResetTimerRef.current)
      autoResetTimerRef.current = undefined
    }
  }, [])

  useEffect(() => {
    runRevisionRef.current += 1
    controllerRef.current?.abort()
    controllerRef.current = null
    clearAutoReset()
  }, [clearAutoReset, fingerprint, mode])

  useEffect(() => () => {
    runRevisionRef.current += 1
    controllerRef.current?.abort()
    clearAutoReset()
  }, [clearAutoReset])

  const handleTest = async () => {
    if (controllerRef.current) return
    clearAutoReset()

    const controller = new AbortController()
    controllerRef.current = controller
    const myRevision = ++runRevisionRef.current
    const testedFingerprint = fingerprint
    setTestedFingerprint(testedFingerprint)
    setTestStatus('checking')
    setTestLatency(undefined)
    setTestError(undefined)

    const result = await testApiConnection(config, { mode, signal: controller.signal })
    if (myRevision !== runRevisionRef.current || testedFingerprint !== `${mode}:${fingerprintModelConfig(config)}`) return
    controllerRef.current = null
    if (result.status === 'cancelled') return

    setTestStatus(result.status)
    setTestLatency(result.latencyMs)
    setTestError(result.errorMessage)
    if (result.status === 'success') {
      autoResetTimerRef.current = window.setTimeout(() => {
        if (myRevision !== runRevisionRef.current) return
        setTestStatus('idle')
        setTestLatency(undefined)
        setTestError(undefined)
        autoResetTimerRef.current = undefined
      }, SUCCESS_AUTO_RESET_MS)
    }
  }

  const isCurrentResult = testedFingerprint === fingerprint
  const visibleStatus = isCurrentResult ? testStatus : 'idle'
  const visibleLatency = isCurrentResult ? testLatency : undefined
  const visibleError = isCurrentResult ? testError : undefined
  const variant = size === 'sm' ? 'ghost' : 'outline'
  const buttonClass = visibleStatus === 'success'
    ? 'text-emerald-600 [data-theme=dark]:text-emerald-300 hover:!text-emerald-600 [data-theme=dark]:hover:!text-emerald-300 hover:!bg-transparent'
    : visibleStatus === 'failed'
      ? 'text-red-500 hover:!text-red-500 hover:!bg-transparent'
      : 'text-[var(--text-secondary)] hover:!bg-transparent'
  const iconClass = size === 'sm' ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'
  const labelClass = size === 'sm' ? 'text-xs' : ''

  return (
    <div className="flex flex-row items-center gap-2 flex-wrap">
      <Button
        variant={variant}
        onClick={handleTest}
        disabled={visibleStatus === 'checking'}
        className={buttonClass}
      >
        {visibleStatus === 'checking' ? <Loader2 className={`${iconClass} animate-spin`} /> : visibleStatus === 'success' ? <Check className={iconClass} /> : visibleStatus === 'failed' ? <X className={iconClass} /> : <Zap className={iconClass} />}
        <span className={labelClass}>{visibleStatus === 'checking' ? '检测中' : visibleStatus === 'success' ? `已连通${visibleLatency ? ` · ${visibleLatency}ms` : ''}` : visibleStatus === 'failed' ? '未连通' : '测试连通'}</span>
      </Button>
      {visibleError && <span role="status" aria-live="polite" className="max-w-xs text-xs text-red-500">{visibleError}</span>}
    </div>
  )
}

function SettingsActions({
  saved,
  dirty,
  onSave,
  onReset,
  saveLabel,
  resetLabel = '恢复默认',
  testConfig,
}: {
  saved: boolean
  dirty: boolean
  onSave: () => void
  onReset: () => void
  saveLabel: string
  resetLabel?: string
  testConfig?: { config: ModelConfig; mode: ConnectionTestMode }
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        onClick={onSave}
        disabled={!dirty && !saved}
        className={saved
          ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-light)]'
          : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white'
        }
      >
        {saved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        {saved ? '已保存' : saveLabel}
      </Button>
      <Button variant="outline" onClick={onReset} className="border-[var(--border-color)] text-[var(--text-secondary)]">
        <RotateCcw className="h-4 w-4 mr-2" />
        {resetLabel}
      </Button>
      {testConfig && <ConnectionTestButton config={testConfig.config} mode={testConfig.mode} />}
    </div>
  )
}

function ApiKeyInput({
  value,
  visible,
  onChange,
  onToggleVisible,
}: {
  value: string
  visible: boolean
  onChange: (value: string) => void
  onToggleVisible: () => void
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="sk-..."
        className="bg-[var(--bg-input)] border-[var(--border-color)] pr-10"
      />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? '隐藏 API Key' : '显示 API Key'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ModelConfigFields({
  value,
  onChange,
  showApiKey,
  onToggleApiKey,
  modelHint,
  modelPlaceholder = '填写模型名称',
}: {
  value: ModelConfig
  onChange: (value: ModelConfig) => void
  showApiKey: boolean
  onToggleApiKey: () => void
  modelHint?: string
  modelPlaceholder?: string
}) {
  return (
    <div className="space-y-3">
      <FieldRow label="Base URL">
        <Input
          value={value.baseUrl}
          onChange={(e) => onChange({ ...value, baseUrl: e.target.value })}
          placeholder="填写 API 地址"
          className="bg-[var(--bg-input)] border-[var(--border-color)]"
        />
      </FieldRow>
      <FieldRow label="API Key">
        <ApiKeyInput
          value={value.apiKey}
          visible={showApiKey}
          onChange={(apiKey) => onChange({ ...value, apiKey })}
          onToggleVisible={onToggleApiKey}
        />
      </FieldRow>
      <FieldRow label="Model">
        <Input
          value={value.model}
          onChange={(e) => onChange({ ...value, model: e.target.value })}
          placeholder={modelPlaceholder}
          className="bg-[var(--bg-input)] border-[var(--border-color)]"
        />
        {modelHint && <p className="text-xs text-[var(--text-muted)]">{modelHint}</p>}
      </FieldRow>
      <TemperatureField value={value.temperature} onChange={(temperature) => onChange({ ...value, temperature })} />
      <ReasoningSwitch checked={value.showReasoning} onChange={(showReasoning) => onChange({ ...value, showReasoning })} />
    </div>
  )
}

function ModelConfigPanel({
  icon: Icon,
  label,
  description,
  value,
  expanded,
  showApiKey,
  onToggle,
  onChange,
  onClear,
  onToggleApiKey,
  modelHint,
  modelPlaceholder = '填写模型名称',
}: {
  icon: typeof Search
  label: string
  description: string
  value: ModelConfig
  expanded: boolean
  showApiKey: boolean
  onToggle: () => void
  onChange: (value: ModelConfig) => void
  onClear: () => void
  onToggleApiKey: () => void
  modelHint?: string
  modelPlaceholder?: string
}) {
  const status = getModelConfigStatus(value)
  const statusLabel = status === 'complete' ? value.model : status === 'partial' ? '未完整，运行时回退' : '未配置'
  const statusClassName = status === 'complete'
    ? 'text-[var(--accent-primary)]'
    : status === 'partial'
      ? 'text-amber-500'
      : 'text-[var(--text-muted)]'

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${expanded ? '' : 'hover:bg-[var(--bg-hover)]'}`}
      >
        <Icon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
          <span className="text-xs text-[var(--text-muted)] ml-2">{description}</span>
        </div>
        <span className={`text-xs shrink-0 ${statusClassName}`}>{statusLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ml-1 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <ModelConfigFields
            value={value}
            onChange={onChange}
            showApiKey={showApiKey}
            onToggleApiKey={onToggleApiKey}
            modelHint={modelHint}
            modelPlaceholder={modelPlaceholder}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs text-[var(--text-secondary)] hover:!bg-transparent"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              清空配置
            </Button>
            <ConnectionTestButton config={value} size="sm" />
          </div>
        </div>
      )}
    </div>
  )
}

function PipelinePromptStep({ index, hasLine = false, children }: { index: number; hasLine?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex items-stretch ${hasLine ? 'border-b border-[var(--border-color)]' : ''}`}>
      <div className="flex flex-col items-center w-10 shrink-0 pt-3.5">
        <div className="w-6 h-6 rounded-full bg-[var(--accent-light)] text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center z-10">{index}</div>
        {hasLine && <div className="w-0.5 flex-1 bg-[var(--border-color)] mt-1" />}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function PromptPanel({
  icon: Icon,
  label,
  description,
  value,
  savedValue,
  defaultValue,
  expanded,
  onToggle,
  onChange,
  onReset,
  borderless,
}: {
  icon: typeof Search
  label: string
  description: string
  value: string
  savedValue: string
  defaultValue: string
  expanded: boolean
  onToggle: () => void
  onChange: (value: string) => void
  onReset: () => void
  borderless?: boolean
}) {
  const isCustom = value !== defaultValue
  const isUnsaved = value !== savedValue

  return (
    <div className={borderless ? '' : 'border border-[var(--border-color)] rounded-lg overflow-hidden'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${expanded ? '' : 'hover:bg-[var(--bg-hover)]'}`}
      >
        <Icon className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
          <span className="text-xs text-[var(--text-muted)] ml-2">{description}</span>
        </div>
        {isCustom && (
          <span className="text-xs text-[var(--accent-primary)] shrink-0">自定义</span>
        )}
        {isUnsaved && (
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 [data-theme=dark]:text-amber-300 shrink-0">未保存</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            className="bg-[var(--bg-input)] border-[var(--border-color)] text-sm leading-relaxed resize-y"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            填入默认文本
          </Button>
        </div>
      )}
    </div>
  )
}
