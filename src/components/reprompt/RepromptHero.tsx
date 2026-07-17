import { useState, useEffect, useCallback } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import type { WorkspaceMode } from '@/types'

const PHRASES = [
  '构思一个小红书爆款标题生成器',
  '写一个让 AI 帮忙润色周报的提示词',
  '把参考图反推成可复用的生图提示词',
  '创建一个剖析文章深层含义的解读专家',
]

const MODE_ENTRIES: Array<{
  mode: WorkspaceMode
  title: string
}> = [
  { mode: 'quick', title: '快速优化' },
  { mode: 'deep', title: '深度优化' },
  { mode: 'image2prompt', title: '图转提示' },
]

interface RepromptHeroProps {
  onSelectMode: (mode: WorkspaceMode) => void
}

export function RepromptHero({ onSelectMode }: RepromptHeroProps) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  const prefersReducedMotion = usePrefersReducedMotion()

  const cyclePhrase = useCallback(() => {
    setPhraseIndex((prev) => (prev + 1) % PHRASES.length)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const timer = setInterval(cyclePhrase, 3000)
    return () => clearInterval(timer)
  }, [cyclePhrase, prefersReducedMotion])

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div
        className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(76,136,255,0.08) 0%, transparent 70%)',
        }}
      />

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
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
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
        Reprompt 工作台
      </h1>

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
        一句话让 AI 咒术师帮你把想法变成精准的指令
      </p>

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
          {PHRASES[phraseIndex]}
        </p>
      </div>

      <div className="grid w-full max-w-md grid-cols-3 gap-3 mb-8">
        {MODE_ENTRIES.map((item, i) => (
          <button
            key={item.mode}
            type="button"
            onClick={() => onSelectMode(item.mode)}
            className="hero-reveal-card group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug text-center">
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSelectMode('quick')}
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 px-7 text-[15px] font-semibold text-white transition-transform transition-shadow duration-200 hover:scale-[1.03] active:scale-[0.97]"
        style={{
          background: 'linear-gradient(135deg, #4C88FF 0%, #3A78F0 100%)',
          letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(76,136,255,0.3)',
          animation: prefersReducedMotion ? 'none' : 'ctaGlow 3s ease-in-out infinite',
        }}
      >
        开始设计
        <ArrowRight className="ml-2 h-4 w-4" />
      </button>

      <div
        className="flex items-center gap-6 mt-8 pt-6"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        {['高效', '精准', '可复用'].map((tag) => (
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
