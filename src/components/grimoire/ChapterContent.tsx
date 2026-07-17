import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, BookOpen, ChevronRight, ChevronLeft, Footprints, Clock } from 'lucide-react'
import { useGrimoireStore } from '@/stores/useGrimoireStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { MarkdownRenderer } from './MarkdownRenderer'
import { TableOfContents } from './TableOfContents'
import type { GrimoireChapter } from '@/types'

interface ChapterContentProps {
  chapters: GrimoireChapter[]
  chapterId: string | null
  sectionId: string | null
  subSectionId: string | null
  onNavigate: (chapterId: string, sectionId: string | null, subSectionId?: string | null) => void
}

export function ChapterContent({ chapters, chapterId, sectionId, subSectionId, onNavigate }: ChapterContentProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentPhase, setContentPhase] = useState<'idle' | 'entering' | 'exiting'>('idle')
  const prefersReducedMotion = usePrefersReducedMotion()
  const addRecentItem = useGrimoireStore((state) => state.addRecentItem)
  const recentItems = useGrimoireStore((state) => state.recentItems)
  const visitedItemKeys = useGrimoireStore((state) => state.visitedItemKeys)
  const contentRef = useRef<HTMLElement>(null)
  const retryControllerRef = useRef<AbortController | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasContentRef = useRef(false)

  useEffect(() => () => {
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    if (enterResetTimerRef.current) clearTimeout(enterResetTimerRef.current)
  }, [])

  const currentChapter = chapters.find((c) => c.id === chapterId)
  const currentSection = currentChapter?.sections.find((s) => s.id === sectionId)
  const currentSubSection = currentSection?.children?.find((s) => s.id === subSectionId)

  // Flatten all navigable items: chapter overviews + sections + sub-sections (leaf nodes)
  const flatItems = useMemo(() => {
    const items: { chapterId: string; sectionId: string | null; subSectionId: string | null; title: string }[] = []
    for (const ch of chapters) {
      items.push({ chapterId: ch.id, sectionId: null, subSectionId: null, title: ch.title })
      for (const sec of ch.sections) {
        if (sec.children && sec.children.length > 0) {
          // Section with children: add parent overview, then each child
          items.push({ chapterId: ch.id, sectionId: sec.id, subSectionId: null, title: sec.title })
          for (const child of sec.children) {
            items.push({ chapterId: ch.id, sectionId: sec.id, subSectionId: child.id, title: child.title })
          }
        } else {
          // Leaf section: add directly
          items.push({ chapterId: ch.id, sectionId: sec.id, subSectionId: null, title: sec.title })
        }
      }
    }
    return items
  }, [chapters])

  const progressPercent = flatItems.length > 0
    ? Math.min(100, Math.round((visitedItemKeys.length / flatItems.length) * 100))
    : 0
  const latestRecentItem = recentItems[0]

  const currentIndex = flatItems.findIndex(
    (item) => item.chapterId === chapterId && item.sectionId === sectionId && item.subSectionId === subSectionId
  )
  const prevItem = currentIndex > 0 ? flatItems[currentIndex - 1] : null
  const nextItem = currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null

  const handleInternalLink = useCallback((fileId: string) => {
    for (const ch of chapters) {
      for (const sec of ch.sections) {
        if (sec.id === fileId) { onNavigate(ch.id, sec.id, null); return true }
        for (const child of (sec.children ?? [])) {
          if (child.id === fileId) { onNavigate(ch.id, sec.id, child.id); return true }
        }
      }
      if (ch.id === fileId) { onNavigate(ch.id, null, null); return true }
    }
    return false
  }, [chapters, onNavigate])

  useEffect(() => {
    const fileId = subSectionId ?? sectionId ?? chapterId
    if (!fileId) {
      queueMicrotask(() => {
        setContent(null)
        hasContentRef.current = false
        setError(null)
        setLoading(false)
        setContentPhase('idle')
      })
      return
    }

    const controller = new AbortController()
    // Trigger exit transition for previous content, then swap to loading/entering
    if (!prefersReducedMotion && hasContentRef.current) {
      setContentPhase('exiting')
      exitTimerRef.current = setTimeout(() => {
        setContent(null)
        hasContentRef.current = false
        setContentPhase('idle')
        setLoading(true)
        setError(null)
      }, 180)
    } else {
      queueMicrotask(() => {
        setLoading(true)
        setError(null)
        setContent(null)
        setContentPhase('idle')
      })
    }

    fetch(`/data/grimoire/chapters/${fileId}.md`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`加载失败 (${res.status})`)
        return res.text()
      })
      .then((text) => {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
        setContent(text)
        hasContentRef.current = true
        setLoading(false)
        setContentPhase(prefersReducedMotion ? 'idle' : 'entering')
        if (!prefersReducedMotion) {
          enterResetTimerRef.current = setTimeout(() => {
            setContentPhase('idle')
            enterResetTimerRef.current = null
          }, 280)
        }
        const title = currentSubSection?.title ?? currentSection?.title ?? currentChapter?.title ?? fileId
        const path = [currentChapter?.title, currentSection?.title, currentSubSection?.title].filter(Boolean).join(' / ')
        addRecentItem({ chapterId: chapterId!, sectionId, subSectionId, title, path })
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current)
          exitTimerRef.current = null
        }
        setError(err instanceof Error ? err.message : '加载失败')
        setLoading(false)
        setContentPhase('idle')
      })

    return () => {
      controller.abort()
      retryControllerRef.current?.abort()
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [addRecentItem, chapterId, currentChapter?.title, currentSection?.title, currentSubSection?.title, sectionId, subSectionId, prefersReducedMotion])

  if (!chapterId) {
    return (
      <div className="flex-1 flex items-center justify-center px-8 text-[var(--text-muted)]">
        <div className="w-full max-w-lg text-center">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-light)] mx-auto mb-3">
            <BookOpen className="h-5 w-5 text-[var(--accent-primary)]" />
          </div>
          <p className="text-lg mb-2">选择一个章节开始阅读</p>
          <p className="text-sm">从左侧目录选择章节或搜索关键词快速定位</p>

          {visitedItemKeys.length > 0 && (
            <div className="mt-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/80 p-4 text-left">
              <div className="mb-3 flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[var(--text-secondary)]">
                  <Footprints className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  学习足迹
                </div>
                {latestRecentItem && (
                  <button
                    type="button"
                    onClick={() => onNavigate(latestRecentItem.chapterId, latestRecentItem.sectionId, latestRecentItem.subSectionId)}
                    className="ml-auto max-w-[220px] truncate text-right text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)] cursor-pointer"
                    title={`${latestRecentItem.path || latestRecentItem.title}`}
                  >
                    <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px]" />
                    最近阅读：{latestRecentItem.title}
                  </button>
                )}
                <span className="shrink-0 text-[var(--text-muted)]">已探索 {visitedItemKeys.length} / {flatItems.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-input)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const fileId = subSectionId ?? sectionId ?? chapterId

  return (
    <div className="flex-1 flex overflow-hidden">
      <div ref={contentRef as React.RefObject<HTMLDivElement>} className="flex-1 overflow-y-auto scrollbar-gutter-stable px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-6">
            {currentChapter && (
              <>
                <button
                  onClick={() => onNavigate(chapterId!, null)}
                  className={(sectionId || subSectionId) ? 'hover:text-[var(--accent-primary)] transition-colors cursor-pointer' : 'text-[var(--text-primary)] font-medium cursor-default'}
                >
                  {currentChapter.title}
                </button>
                {currentSection && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <button
                      onClick={() => onNavigate(chapterId!, sectionId!)}
                      className={subSectionId ? 'hover:text-[var(--accent-primary)] transition-colors cursor-pointer' : 'text-[var(--text-primary)] font-medium cursor-default'}
                    >
                      {currentSection.title}
                    </button>
                  </>
                )}
                {currentSubSection && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-[var(--text-primary)] font-medium">{currentSubSection.title}</span>
                  </>
                )}
              </>
            )}
          </nav>

          {loading && (
            <div className="space-y-4">
              <div className="h-8 w-1/3 shimmer rounded" />
              <div className="h-4 w-full shimmer rounded" />
              <div className="h-4 w-3/4 shimmer rounded" />
              <div className="h-4 w-full shimmer rounded" />
              <div className="h-4 w-1/2 shimmer rounded" />
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  retryControllerRef.current?.abort()
                  const controller = new AbortController()
                  retryControllerRef.current = controller
                  setError(null)
                  setLoading(true)
                  fetch(`/data/grimoire/chapters/${fileId}.md`, { signal: controller.signal })
                    .then((res) => {
                      if (!res.ok) throw new Error(`加载失败 (${res.status})`)
                      return res.text()
                    })
                    .then((text) => { setContent(text); setLoading(false) })
                    .catch((err) => {
                      if (err.name === 'AbortError') return
                      setError('重试失败')
                      setLoading(false)
                    })
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                重试
              </Button>
            </div>
          )}

          {content && (
            <div
              key={fileId}
              className={contentPhase === 'exiting' ? 'grimoire-content-exit' : contentPhase === 'entering' ? 'grimoire-content-enter' : ''}
            >
              <MarkdownRenderer content={content} onNavigate={handleInternalLink} />
            </div>
          )}

          {/* Previous / Next navigation */}
          {content && (prevItem || nextItem) && (
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border-color)]">
              {prevItem ? (
                <button
                  onClick={() => onNavigate(prevItem.chapterId, prevItem.sectionId, prevItem.subSectionId)}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="max-w-[200px] truncate">{prevItem.title}</span>
                </button>
              ) : <div />}
              {nextItem ? (
                <button
                  onClick={() => onNavigate(nextItem.chapterId, nextItem.sectionId, nextItem.subSectionId)}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors group cursor-pointer"
                >
                  <span className="max-w-[200px] truncate">{nextItem.title}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : <div />}
            </div>
          )}
        </div>
      </div>

      {content && <TableOfContents key={fileId} contentRef={contentRef} content={content} />}
    </div>
  )
}
