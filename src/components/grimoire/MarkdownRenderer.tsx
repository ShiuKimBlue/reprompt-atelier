import React, { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, X } from 'lucide-react'

interface MarkdownRendererProps {
  content: string
  onNavigate?: (fileId: string) => boolean
}

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('failed')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }, [text])

  const Icon = status === 'copied' ? Check : status === 'failed' ? X : Copy

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-[var(--bg-hover)] transition-all opacity-0 group-hover/code:opacity-100 ${
        status === 'copied'
          ? 'text-green-500'
          : status === 'failed'
            ? 'text-red-500'
            : 'text-[var(--text-muted)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)]'
      }`}
      aria-label={status === 'copied' ? '已复制代码' : status === 'failed' ? '复制代码失败' : '复制代码'}
      title={status === 'copied' ? '已复制' : status === 'failed' ? '复制失败' : '复制'}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
}

function PreWithCopy({ children, className, ...props }: React.HTMLAttributes<HTMLPreElement> & { className?: string }) {
  // Extract raw text from ALL descendants — no type-checking assumptions
  const rawText = extractText(children)
  return (
    <div className="relative group/code mb-4">
      <pre className={className ?? ''} {...props}>{children}</pre>
      {rawText && <CopyButton text={rawText} />}
    </div>
  )
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement<Record<string, unknown>>).props.children as React.ReactNode)
  }
  return ''
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

function normalizeGrimoireFileId(href: string): string {
  return href
    .replace('/grimoire/', '')
    .split('#')[0]
    .split('?')[0]
    .replace(/\/+$/, '')
}

function createComponents(onNavigate: ((fileId: string) => boolean) | undefined): Components {
  let counter = 0
  const seenIds = new Set<string>()

  function nextFallbackId(): string {
    let id: string
    do {
      counter++
      id = `heading-${counter}`
    } while (seenIds.has(id))
    seenIds.add(id)
    return id
  }

  function createHeadingId(children: React.ReactNode): string {
    const text = extractText(children)
    const base = text ? slugify(text) : ''
    if (!base) return nextFallbackId()

    if (!seenIds.has(base)) {
      seenIds.add(base)
      return base
    }
    let id = `${base}-2`
    let n = 3
    while (seenIds.has(id)) { id = `${base}-${n++}` }
    seenIds.add(id)
    return id
  }
  return {
    h1: ({ children, ...props }) => (
      <h1 id={createHeadingId(children)} className="text-2xl font-bold mb-4 text-[var(--text-primary)]" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 id={createHeadingId(children)} className="text-xl font-semibold mt-6 mb-3 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 id={createHeadingId(children)} className="text-lg font-semibold mt-4 mb-2 text-[var(--text-primary)]" {...props}>{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-sm leading-relaxed text-[var(--text-secondary)] mb-3">{children}</p>
    ),
    code: ({ children, className }) => {
      const isBlock = className?.includes('language-')
      if (isBlock) {
        return (
          <code className={`${className} block text-[13px] leading-[1.6] font-mono`}>
            {children}
          </code>
        )
      }
      return (
        <code className="bg-[var(--bg-input)] px-1.5 py-0.5 rounded text-[13px] font-mono text-[var(--accent-primary)]">
          {children}
        </code>
      )
    },
    pre: ({ children, ...props }) => (
      <PreWithCopy className="bg-[var(--bg-code)] rounded-lg p-4 pr-12 overflow-x-auto" {...props}>
        {children}
      </PreWithCopy>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-[var(--accent-primary)] pl-4 italic text-[var(--text-muted)] mb-4">
        {children}
      </blockquote>
    ),
    ul: ({ children }) => <ul className="pl-6 mb-3 text-[var(--text-secondary)] list-disc">{children}</ul>,
    ol: ({ children }) => <ol className="pl-6 mb-3 text-[var(--text-secondary)] list-decimal">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ href, children }) => {
      if (href?.startsWith('#')) {
        return (
          <a
            href={href}
            className="text-[var(--accent-primary)] hover:underline"
            onClick={(event) => {
              const target = document.getElementById(href.slice(1))
              if (!target) return
              event.preventDefault()
              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {children}
          </a>
        )
      }
      if (href?.startsWith('/grimoire/') && onNavigate) {
        const fileId = normalizeGrimoireFileId(href)
        return (
          <a
            href={href}
            className="text-[var(--accent-primary)] hover:underline cursor-pointer"
            onClick={(event) => {
              if (onNavigate(fileId)) {
                event.preventDefault()
                return
              }
              event.preventDefault()
              window.open(href, '_blank', 'noopener,noreferrer')
            }}
          >
            {children}
          </a>
        )
      }
      return (
        <a href={href} className="text-[var(--accent-primary)] hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
    table: ({ children }) => (
      <table className="w-full border-collapse mb-4 text-sm">{children}</table>
    ),
    th: ({ children }) => (
      <th className="bg-[var(--bg-input)] p-3 text-left font-semibold text-[var(--text-primary)] border border-[var(--border-color)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="p-3 text-[var(--text-secondary)] border border-[var(--border-color)]">{children}</td>
    ),
    img: ({ src, alt }) => (
      <img src={src} alt={alt} className="block mx-auto rounded-lg max-w-2xl w-full my-6 shadow-md object-contain" loading="lazy" />
    ),
    hr: () => <hr className="border-[var(--border-color)] my-6" />,
    div: ({ className, children, ...props }) => {
      if (className?.includes('callout') || className?.includes('Callout')) {
        const isWarning = className?.includes('warning') || className?.includes('⚠️')
        const isInfo = className?.includes('info')
        return (
          <div className={`border-l-4 rounded-r-lg p-4 my-4 text-sm ${
            isWarning ? 'border-yellow-500 bg-yellow-500/10 text-yellow-700' :
            isInfo ? 'border-blue-500 bg-blue-500/10 text-blue-700' :
            'border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--text-secondary)]'
          }`} {...props}>
            {children}
          </div>
        )
      }
      return <div {...props}>{children}</div>
    },
  }
}

export function MarkdownRenderer({ content, onNavigate }: MarkdownRendererProps) {
  const components = createComponents(onNavigate)

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
