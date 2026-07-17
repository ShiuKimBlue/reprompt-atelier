import { useState, useEffect, useCallback } from 'react'
import { Home, ExternalLink } from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const GITHUB_URL = 'https://github.com/ShiuKimBlue'

const CREDITS_PHRASES = [
  '欢迎访问 GitHub 探索我的创作',
  '致敬每一个驱动创新的开源项目',
  '每一行代码都站在巨人的肩膀上',
  '开源是一种信仰，也是一种力量',
  '感谢每一位开源贡献者的无私付出',
]

const OPEN_SOURCE_CREDITS = [
  { name: 'React', url: 'https://react.dev' },
  { name: 'Vite', url: 'https://vitejs.dev' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'shadcn/ui', url: 'https://ui.shadcn.com' },
  { name: 'Zustand', url: 'https://zustand-demo.pmnd.rs' },
  { name: 'LangChain', url: 'https://js.langchain.com' },
  { name: 'react-markdown', url: 'https://github.com/remarkjs/react-markdown' },
  { name: 'Lucide', url: 'https://lucide.dev' },
  { name: 'Prompt Guide', url: 'https://github.com/dair-ai/Prompt-Engineering-Guide' },
]

export function GitHubView() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const cyclePhrase = useCallback(() => {
    setPhraseIndex((prev) => (prev + 1) % CREDITS_PHRASES.length)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return
    const timer = setInterval(cyclePhrase, 3000)
    return () => clearInterval(timer)
  }, [cyclePhrase, prefersReducedMotion])

  return (
    <div className="h-full overflow-y-auto scrollbar-gutter-stable">
      <div className="flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12 relative">
        <div
          className="pointer-events-none absolute top-[-80px] left-1/2 h-[400px] w-[400px] -translate-x-1/2"
          style={{
            background: 'radial-gradient(circle, rgba(76,136,255,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            <Home className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <div
            className="pointer-events-none absolute"
            style={{
              inset: -4,
              borderRadius: 22,
              border: '1.5px solid rgba(76,136,255,0.2)',
              animation: prefersReducedMotion ? 'none' : 'breathe 3s ease-in-out infinite',
            }}
          />
        </div>

        <h1
          className="mb-2 text-center"
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          GitHub 魔法屋
        </h1>

        <p
          className="mb-8 text-center"
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: 'var(--text-muted)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}
        >
          开源致敬 · 探索无限可能
        </p>

        <div className="relative mb-8 overflow-hidden" style={{ height: 28 }}>
          <p
            key={phraseIndex}
            className="whitespace-nowrap text-center"
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              lineHeight: '28px',
              animation: prefersReducedMotion ? 'none' : 'fadeSlideIn 3s ease-in-out forwards',
            }}
          >
            {CREDITS_PHRASES[phraseIndex]}
          </p>
        </div>

        <div className="mb-8 grid w-full max-w-md grid-cols-3 gap-3">
          {OPEN_SOURCE_CREDITS.map((lib, i) => (
            <a
              key={lib.name}
              href={lib.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`打开 ${lib.name}`}
              className="hero-reveal-card group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="text-center text-sm font-medium leading-snug text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-primary)]">
                {lib.name}
              </span>
            </a>
          ))}
        </div>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border-0 px-7 text-[15px] font-semibold text-white transition-transform transition-shadow duration-200 hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #4C88FF 0%, #3A78F0 100%)',
            letterSpacing: '-0.01em',
            boxShadow: '0 4px 20px rgba(76,136,255,0.3)',
            animation: prefersReducedMotion ? 'none' : 'ctaGlow 3s ease-in-out infinite',
          }}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          访问我的 GitHub
        </a>

        <div
          className="mt-8 flex items-center gap-6 pt-6"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          {['开源', '致敬', '探索'].map((tag) => (
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
    </div>
  )
}
