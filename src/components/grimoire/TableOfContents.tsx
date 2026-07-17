import { useState, useEffect, useCallback } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement | null>
  content: string
}

export function TableOfContents({ contentRef, content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const container = contentRef.current
    if (!container) return

    const elements = container.querySelectorAll('h1, h2, h3')
    const items: TocItem[] = Array.from(elements).map((el) => ({
      id: el.id,
      text: el.textContent ?? '',
      level: parseInt(el.tagName.charAt(1)),
    }))
    setHeadings(items)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { root: container, rootMargin: '0px 0px -80% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [contentRef, content])

  const handleClick = useCallback(
    (headingId: string) => {
      const container = contentRef.current
      if (!container) return
      const target = container.querySelector(`#${CSS.escape(headingId)}`)
      if (!target) return
      // Scroll within the container, not the whole page
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      container.scrollTo({
        top: container.scrollTop + targetRect.top - containerRect.top - 20,
        behavior: 'smooth',
      })
    },
    [contentRef]
  )

  if (headings.length === 0) return null

  return (
    <div className="w-64 shrink-0 hidden xl:block">
      <div className="sticky top-24 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">目录</h3>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => handleClick(heading.id)}
              className={`block w-full text-left text-sm py-1 truncate transition-colors ${
                heading.level === 2 ? 'pl-0' : heading.level === 3 ? 'pl-4' : 'pl-0'
              } ${
                activeId === heading.id
                  ? 'text-[var(--accent-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
              }`}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
