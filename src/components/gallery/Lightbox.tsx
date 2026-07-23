import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Check, AlertCircle } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { PromptItem } from '@/types'

const PANEL_WIDTH = 360
const OPEN_MS = 420
const CLOSE_MS = 260
const CLOSE_UNMOUNT_MS = 280

interface RectBox {
  left: number
  top: number
  width: number
  height: number
}

interface LightboxProps {
  item: PromptItem
  originRect: DOMRect
  onClose: () => void
}

function toBox(rect: DOMRect | RectBox): RectBox {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function centerOf(box: RectBox) {
  return {
    x: box.left + box.width / 2,
    y: box.top + box.height / 2,
  }
}

/** Viewport First/Last invert: map Last-sized element to First appearance. */
function invertFromFirstToLast(first: RectBox, last: RectBox) {
  if (last.width <= 0 || last.height <= 0) {
    return { dx: 0, dy: 0, sx: 1, sy: 1 }
  }
  const f = centerOf(first)
  const l = centerOf(last)
  return {
    dx: f.x - l.x,
    dy: f.y - l.y,
    sx: first.width / last.width,
    sy: first.height / last.height,
  }
}

function remeasureOriginCard(itemId: string, fallback: RectBox): RectBox {
  const el = document.querySelector<HTMLElement>(`[data-gallery-id="${CSS.escape(itemId)}"]`)
  if (!el) return fallback
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return fallback
  return toBox(rect)
}

/** Provisional layout dims from metadata so FLIP can start before natural size loads. */
function dimsFromAspectRatio(aspectRatio: string): { w: number; h: number } {
  const parts = aspectRatio.split(':')
  if (parts.length === 2) {
    const w = Number.parseFloat(parts[0])
    const h = Number.parseFloat(parts[1])
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      return { w: w * 100, h: h * 100 }
    }
  }
  return { w: 1200, h: 800 }
}

export function Lightbox({ item, originRect, onClose }: LightboxProps) {
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering')
  /** Only clip shell after open FLIP settles — clipping mid-travel eats edge cards. */
  const [clipShell, setClipShell] = useState(false)
  const [firstRect, setFirstRect] = useState<RectBox>(() => toBox(originRect))
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [imgDims, setImgDims] = useState<{ w: number; h: number }>(() =>
    dimsFromAspectRatio(item.aspectRatio),
  )
  const [imgError, setImgError] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const flipPlayStartedRef = useRef(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const clearClipTimer = useCallback(() => {
    if (clipTimerRef.current) {
      clearTimeout(clipTimerRef.current)
      clipTimerRef.current = null
    }
  }, [])

  useEffect(
    () => () => {
      clearExitTimer()
      clearClipTimer()
    },
    [clearExitTimer, clearClipTimer],
  )

  // Refine natural dimensions when available (aspectRatio already seeded layout)
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
      }
    }
    img.onerror = () => {
      if (!cancelled) setImgError(true)
    }
    img.src = item.imageUrl
    return () => {
      cancelled = true
    }
  }, [item.imageUrl])

  // Open: reduced-motion → open immediately; else First paint (entering) → open play
  useEffect(() => {
    if (closingRef.current || flipPlayStartedRef.current) return

    if (prefersReducedMotion) {
      flipPlayStartedRef.current = true
      queueMicrotask(() => {
        if (!closingRef.current) {
          setPhase('open')
          setClipShell(true)
        }
      })
      return
    }

    flipPlayStartedRef.current = true
    // First frame paints invert (entering); second commits open so CSS transition runs
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (closingRef.current) return
        setPhase('open')
        clearClipTimer()
        // Keep overflow visible until open FLIP finishes
        clipTimerRef.current = setTimeout(() => {
          clipTimerRef.current = null
          if (!closingRef.current) setClipShell(true)
        }, OPEN_MS)
      })
    })
  }, [prefersReducedMotion, clearClipTimer])

  const handleCloseRef = useRef<() => void>(() => {})
  const handleClose = useCallback(() => handleCloseRef.current(), [])

  useEffect(() => {
    handleCloseRef.current = () => {
      if (closingRef.current) return
      closingRef.current = true
      clearExitTimer()
      clearClipTimer()
      setClipShell(false)

      if (prefersReducedMotion) {
        onClose()
        return
      }

      setFirstRect((prev) => remeasureOriginCard(item.id, prev))
      setPhase('exiting')
      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null
        onClose()
      }, CLOSE_UNMOUNT_MS)
    }
  }, [onClose, prefersReducedMotion, item.id, clearExitTimer, clearClipTimer])

  // Scroll lock + focus trap + restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !overlayRef.current) return
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    overlayRef.current?.querySelector('button')?.focus()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus()
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      setCopyFailed(false)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      setCopyFailed(true)
    }
  }

  const handleVisibleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget
    if (el.naturalWidth > 0 && el.naturalHeight > 0) {
      setImgDims({ w: el.naturalWidth, h: el.naturalHeight })
    }
  }

  // Layout dims from aspect / natural size (no fixed crop)
  const getLightboxDims = useCallback(() => {
    const maxW = Math.min(window.innerWidth * 0.96, 1800)
    const maxH = Math.min(window.innerHeight * 0.94, 1080)
    const compact = window.innerWidth < 768
    const panelW = compact ? Math.min(maxW, 420) : PANEL_WIDTH
    const panelH = compact ? Math.min(window.innerHeight * 0.36, 320) : maxH

    const aspect = imgDims.w / imgDims.h
    const imgAreaW = compact ? panelW : maxW - panelW
    const imgAreaH = compact ? maxH - panelH : maxH

    let imgW: number
    let imgH: number
    if (imgAreaW / imgAreaH > aspect) {
      imgH = imgAreaH
      imgW = Math.round(imgH * aspect)
    } else {
      imgW = imgAreaW
      imgH = Math.round(imgW / aspect)
    }

    if (compact) {
      imgW = Math.max(Math.min(imgW, panelW), 240)
      imgH = Math.max(Math.min(imgH, imgAreaH), 180)
      return {
        totalW: panelW,
        totalH: imgH + panelH,
        imgW,
        imgH,
        panelW,
        panelH,
        compact,
      }
    }

    imgW = Math.max(imgW, 300)
    imgH = Math.max(imgH, 200)

    return {
      totalW: imgW + panelW,
      totalH: imgH,
      imgW,
      imgH,
      panelW,
      panelH: imgH,
      compact,
    }
  }, [imgDims])

  const dims = getLightboxDims()

  /** Resting image box in viewport (shell is flex-centered; image is first flex child). */
  const lastRect = useMemo<RectBox>(() => {
    const shellLeft = (window.innerWidth - dims.totalW) / 2
    const shellTop = (window.innerHeight - dims.totalH) / 2
    return {
      left: shellLeft,
      top: shellTop,
      width: dims.imgW,
      height: dims.imgH,
    }
  }, [dims.totalW, dims.totalH, dims.imgW, dims.imgH])

  const invert = useMemo(
    () => invertFromFirstToLast(firstRect, lastRect),
    [firstRect, lastRect],
  )

  const getImageTransform = (): React.CSSProperties => {
    if (prefersReducedMotion) {
      return { transform: 'translate(0, 0) scale(1)', opacity: 1 }
    }

    if (phase === 'entering' || phase === 'exiting') {
      const { dx, dy, sx, sy } = invert
      return {
        transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        opacity: 1,
      }
    }

    return { transform: 'translate(0, 0) scale(1)', opacity: 1 }
  }

  // Transition must be active on DESTINATION phase (open / exiting), not entering
  const imageTransition = prefersReducedMotion
    ? 'none'
    : phase === 'entering'
      ? 'none'
      : phase === 'exiting'
        ? `transform ${CLOSE_MS}ms cubic-bezier(0.4, 0, 1, 1), opacity ${CLOSE_MS}ms ease-in`
        : `transform ${OPEN_MS}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${OPEN_MS}ms ease-out`

  const chromeOpen = phase === 'open'
  const overlayOpen = phase === 'open'

  const content = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: overlayOpen ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: overlayOpen && !prefersReducedMotion ? 'blur(16px)' : 'blur(0px)',
        WebkitBackdropFilter: overlayOpen && !prefersReducedMotion ? 'blur(16px)' : 'blur(0px)',
        transition: prefersReducedMotion
          ? 'none'
          : 'background-color 300ms ease-out, backdrop-filter 300ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose()
      }}
    >
      <button
        onClick={handleClose}
        aria-label="关闭画廊预览"
        title="关闭画廊预览"
        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)',
          opacity: chromeOpen ? 1 : 0,
          transition: prefersReducedMotion
            ? 'none'
            : 'opacity 200ms ease-out 200ms, background 150ms, color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
          e.currentTarget.style.color = 'rgba(255,255,255,1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Shell: layout only — no opacity gate; overflow visible so FLIP travel isn't clipped */}
      <div
        className={`flex pointer-events-none ${dims.compact ? 'flex-col' : ''}`}
        style={{
          width: dims.totalW,
          height: dims.totalH,
          borderRadius: 0,
          overflow: clipShell ? 'hidden' : 'visible',
        }}
      >
        <div
          className="relative flex items-center justify-center overflow-visible pointer-events-auto"
          style={{
            width: dims.imgW,
            height: dims.imgH,
            background: phase === 'open' ? 'rgba(0,0,0,0.25)' : 'transparent',
            transition: prefersReducedMotion ? 'none' : 'background-color 300ms ease-out',
          }}
        >
          <img
            src={imgError ? '/favicon.svg' : item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain select-none"
            style={{
              transformOrigin: 'center center',
              willChange: prefersReducedMotion ? undefined : 'transform',
              ...getImageTransform(),
              transition: imageTransition,
            }}
            draggable={false}
            onLoad={handleVisibleImgLoad}
            onError={() => setImgError(true)}
          />
        </div>

        <div
          className="shrink-0 flex flex-col pointer-events-auto"
          style={{
            width: dims.panelW,
            height: dims.panelH,
            background: 'var(--bg-card)',
            borderLeft: dims.compact ? '0' : '1px solid var(--border-color)',
            borderTop: dims.compact ? '1px solid var(--border-color)' : '0',
            transform: chromeOpen ? 'translate(0, 0)' : dims.compact ? 'translateY(24px)' : 'translateX(30px)',
            opacity: chromeOpen ? 1 : 0,
            transition: prefersReducedMotion
              ? 'none'
              : phase === 'exiting'
                ? 'transform 200ms ease-in, opacity 200ms ease-in'
                : `transform 320ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, opacity 320ms ease-out 80ms`,
          }}
        >
          <div className="px-6 pt-5 pb-3 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
              {item.title}
            </h2>
          </div>

          <div className="px-6 py-2.5 flex flex-wrap gap-2 border-b border-[var(--border-color)]">
            <MetaBadge label="模型" value={item.model} accent />
            <MetaBadge label="比例" value={item.aspectRatio} />
            <MetaBadge label="画质" value={item.resolution} />
          </div>

          <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              提示词
            </span>
            <div
              tabIndex={0}
              aria-label="提示词全文，可滚动阅读并手动选择复制"
              className="flex-1 min-h-0 rounded-lg overflow-y-auto p-4 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap break-words outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
              style={{ background: 'var(--bg-input)' }}
            >
              {item.prompt}
            </div>
            {copyFailed && (
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-red-500" role="status">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                剪贴板不可用，请聚焦上方提示词全文后手动选中文本复制。
              </p>
            )}
          </div>

          <div className="px-6 py-3 border-t border-[var(--border-color)] space-y-2">
            <button
              onClick={handleCopy}
              aria-label={copied ? '提示词已复制' : copyFailed ? '复制提示词失败' : '复制提示词'}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer outline-none transition-[background,color,transform] duration-150 hover:scale-[1.01] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
              style={{
                background: copied ? 'var(--accent-light)' : copyFailed ? 'rgba(239,68,68,0.08)' : 'var(--accent-primary)',
                color: copied ? 'var(--accent-primary)' : copyFailed ? '#EF4444' : 'white',
                border: copyFailed ? '1px solid rgba(239,68,68,0.22)' : '1px solid transparent',
              }}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> 已复制</>
              ) : copyFailed ? (
                <><X className="w-4 h-4" /> 手动复制</>
              ) : (
                <><Copy className="w-4 h-4" /> 复制提示词</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

function MetaBadge({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
      style={{
        background: accent ? 'var(--accent-light)' : 'var(--bg-input)',
        color: accent ? 'var(--accent-primary)' : 'var(--text-muted)',
      }}
    >
      <span className="font-semibold">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  )
}
