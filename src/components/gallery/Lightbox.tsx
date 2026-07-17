import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Copy, Check, AlertCircle } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { PromptItem } from '@/types'

const PANEL_WIDTH = 360

interface LightboxProps {
  item: PromptItem
  originRect: DOMRect
  onClose: () => void
}

export function Lightbox({ item, originRect, onClose }: LightboxProps) {
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering')
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null)
  const [imgError, setImgError] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = item.imageUrl
  }, [item.imageUrl])

  // Animate in after paint
  useEffect(() => {
    if (prefersReducedMotion) {
      queueMicrotask(() => setPhase('open'))
      return
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('open'))
    })
  }, [prefersReducedMotion])

  // Stable close handler via ref
  const handleCloseRef = useRef<() => void>(() => {})
  const handleClose = useCallback(() => handleCloseRef.current(), [])

  useEffect(() => {
    handleCloseRef.current = () => {
      if (closingRef.current) return
      closingRef.current = true
      if (prefersReducedMotion) {
        onClose()
        return
      }
      setPhase('exiting')
      const timer = setTimeout(onClose, 300)
      return () => clearTimeout(timer)
    }
  }, [onClose, prefersReducedMotion])

  // Scroll lock + focus trap + restore focus on close
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus trap
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
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    // Focus the close button on open
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

  // Calculate lightbox dimensions based on image natural aspect ratio
  const getLightboxDims = () => {
    const maxW = Math.min(window.innerWidth * 0.96, 1800)
    const maxH = Math.min(window.innerHeight * 0.94, 1080)
    const compact = window.innerWidth < 768
    const panelW = compact ? Math.min(maxW, 420) : PANEL_WIDTH
    const panelH = compact ? Math.min(window.innerHeight * 0.36, 320) : maxH

    if (!imgDims) {
      return compact
        ? { totalW: panelW, totalH: maxH, imgW: panelW, imgH: maxH - panelH, panelW, panelH, compact }
        : { totalW: maxW, totalH: maxH, imgW: maxW - panelW, imgH: maxH, panelW, panelH: maxH, compact }
    }

    const aspect = imgDims.w / imgDims.h
    const imgAreaW = compact ? panelW : maxW - panelW
    const imgAreaH = compact ? maxH - panelH : maxH

    let imgW: number, imgH: number
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
  }

  const dims = getLightboxDims()

  // FLIP: compute transform from origin card to lightbox image position
  const getImageTransform = (): React.CSSProperties => {
    if (!imgDims) {
      // Before image loads, just fade in
      return phase === 'open'
        ? { transform: 'scale(1)', opacity: 1 }
        : { transform: 'scale(0.9)', opacity: 0 }
    }

    if (phase === 'entering') {
      // Start at card position relative to lightbox center
      const lbCenterX = dims.totalW / 2
      const lbCenterY = dims.totalH / 2
      const vpCenterX = window.innerWidth / 2
      const vpCenterY = window.innerHeight / 2

      // Card position relative to viewport center
      const dx = originRect.left + originRect.width / 2 - vpCenterX + (lbCenterX - dims.imgW / 2)
      const dy = originRect.top + originRect.height / 2 - vpCenterY + (lbCenterY - dims.imgH / 2)
      const sx = originRect.width / dims.imgW
      const sy = originRect.height / dims.imgH

      return {
        transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        opacity: 0.7,
      }
    }

    if (phase === 'exiting') {
      const lbCenterX = dims.totalW / 2
      const lbCenterY = dims.totalH / 2
      const vpCenterX = window.innerWidth / 2
      const vpCenterY = window.innerHeight / 2

      const dx = originRect.left + originRect.width / 2 - vpCenterX + (lbCenterX - dims.imgW / 2)
      const dy = originRect.top + originRect.height / 2 - vpCenterY + (lbCenterY - dims.imgH / 2)
      const sx = originRect.width / dims.imgW
      const sy = originRect.height / dims.imgH

      return {
        transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
        opacity: 0,
      }
    }

    return { transform: 'translate(0, 0) scale(1)', opacity: 1 }
  }

  const imageTransition = prefersReducedMotion
    ? 'none'
    : phase === 'entering'
      ? 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1), opacity 420ms ease-out'
      : phase === 'exiting'
        ? 'transform 260ms cubic-bezier(0.4, 0, 1, 1), opacity 260ms ease-in'
        : 'none'

  const content = (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: phase === 'open' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: phase === 'open' && !prefersReducedMotion ? 'blur(16px)' : 'blur(0px)',
        WebkitBackdropFilter: phase === 'open' && !prefersReducedMotion ? 'blur(16px)' : 'blur(0px)',
        transition: prefersReducedMotion ? 'none' : 'background-color 300ms ease-out, backdrop-filter 300ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose()
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="关闭画廊预览"
        title="关闭画廊预览"
        className="absolute top-5 right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.6)',
          opacity: phase === 'open' ? 1 : 0,
          transition: prefersReducedMotion ? 'none' : 'opacity 200ms ease-out 200ms, background 150ms, color 150ms',
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

      {/* Main container — sized to image + panel */}
      <div
        className={`flex overflow-hidden pointer-events-none ${dims.compact ? 'flex-col' : ''}`}
        style={{
          width: dims.totalW,
          height: dims.totalH,
          borderRadius: 0,
          opacity: phase === 'open' ? 1 : 0,
          transition: prefersReducedMotion ? 'none' : 'opacity 250ms ease-out 40ms',
        }}
      >
        {/* Image area — exact image dimensions */}
        <div
          className="relative flex items-center justify-center overflow-hidden pointer-events-auto"
          style={{
            width: dims.imgW,
            height: dims.imgH,
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <img
            src={imgError ? '/favicon.svg' : item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain select-none"
            style={{
              ...getImageTransform(),
              transition: imageTransition,
            }}
            draggable={false}
            onError={() => setImgError(true)}
          />
        </div>

        {/* Info panel — matches image height exactly */}
        <div
          className="shrink-0 flex flex-col pointer-events-auto"
          style={{
            width: dims.panelW,
            height: dims.panelH,
            background: 'var(--bg-card)',
            borderLeft: dims.compact ? '0' : '1px solid var(--border-color)',
            borderTop: dims.compact ? '1px solid var(--border-color)' : '0',
            transform: phase === 'open' ? 'translate(0, 0)' : dims.compact ? 'translateY(24px)' : 'translateX(30px)',
            opacity: phase === 'open' ? 1 : 0,
            transition: prefersReducedMotion
              ? 'none'
              : phase === 'entering'
                ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1) 80ms, opacity 320ms ease-out 80ms'
                : 'transform 200ms ease-in, opacity 200ms ease-in',
          }}
        >
          {/* Title */}
          <div className="px-6 pt-5 pb-3 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
              {item.title}
            </h2>
          </div>

          {/* Meta */}
          <div className="px-6 py-2.5 flex flex-wrap gap-2 border-b border-[var(--border-color)]">
            <MetaBadge label="模型" value={item.model} accent />
            <MetaBadge label="比例" value={item.aspectRatio} />
            <MetaBadge label="画质" value={item.resolution} />
          </div>

          {/* Prompt */}
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

          {/* Actions */}
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
