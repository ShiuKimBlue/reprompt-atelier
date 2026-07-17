import { useState, useEffect, useCallback } from 'react'
import { Images, ArrowRight } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const GALLERY_PHRASES = [
  '用文字编织魔法，将想象变为现实',
  '从赛博朋克到水墨丹青',
  '探索N种风格的提示词创作',
  '感受多元的 Prompt DNA',
  '创意无限，灵感不断',
]

interface GalleryHeroProps {
  onStart: () => void
}

export function GalleryHero({ onStart }: GalleryHeroProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  const prefersReducedMotion = usePrefersReducedMotion()

  const cyclePhrase = useCallback(() => {
    setPhraseIndex((prev) => (prev + 1) % GALLERY_PHRASES.length)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const timer = setInterval(cyclePhrase, 3000)
    return () => clearInterval(timer)
  }, [cyclePhrase, prefersReducedMotion])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-full px-6 py-12 relative overflow-hidden">
      {/* Background radial glow — blue */}
      <div
        className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(76,136,255,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="hero-particle"
            style={{
              left: `${12 + i * 11}%`,
              animationDelay: prefersReducedMotion ? '0ms' : `${i * 0.8}s`,
              animationDuration: prefersReducedMotion ? '0.01ms' : `${6 + (i % 3) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Hero icon — Images with blue breathing halo */}
      <div className="relative mb-7">
        <div
          className="flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #4C88FF 0%, #7BA4FF 100%)',
            boxShadow: '0 8px 40px rgba(76,136,255,0.2)',
          }}
        >
          <Images className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        {/* Breathing halo */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -4,
            borderRadius: 22,
            border: '1.5px solid rgba(76,136,255,0.2)',
            animation: prefersReducedMotion ? 'none' : 'breathe 3s ease-in-out infinite',
          }}
        />
      </div>

      {/* Title */}
      <h1
        className="text-center mb-2"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Gallery 咒术画廊
      </h1>

      {/* Subtitle */}
      <p
        className="text-center mb-8"
        style={{
          fontSize: 15,
          fontWeight: 400,
          color: 'var(--text-muted)',
          letterSpacing: '0.01em',
          lineHeight: 1.5,
        }}
      >
        提示词创意集 · 用文字描绘世界
      </p>

      {/* Carousel */}
      <div className="overflow-hidden relative mb-8" style={{ height: 28 }}>
        <p
          key={phraseIndex}
          className="text-center whitespace-nowrap"
          style={{
            fontSize: 17,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            lineHeight: '28px',
            animation: prefersReducedMotion ? 'none' : 'fadeSlideIn 3s ease-in-out forwards',
          }}
        >
          {GALLERY_PHRASES[phraseIndex]}
        </p>
      </div>

      {/* CTA button — blue */}
      <button
        type="button"
        onClick={onStart}
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 px-7 text-[15px] font-semibold text-white transition-transform transition-shadow duration-200 hover:scale-[1.03] active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #4C88FF 0%, #3A78F0 100%)',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(76,136,255,0.3)',
          animation: prefersReducedMotion ? 'none' : 'ctaGlow 3s ease-in-out infinite',
        }}
      >
        立即进入
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      {/* Bottom tags */}
      <div
        className="flex items-center gap-6 mt-8 pt-6"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        {['创意', '灵感', '实用'].map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
