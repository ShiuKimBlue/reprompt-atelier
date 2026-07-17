import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Compass,
  Lightbulb,
  Blocks,
  MessagesSquare,
  Brain,
  GraduationCap,
  Bot,
  AlertTriangle,
  FlaskConical,
  FileText,
  Wrench,
  Notebook,
  Database,
  BookMarked,
  BookX,
  ChevronDown,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGrimoireStore } from '@/stores/useGrimoireStore'
import type { GrimoireChapter } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Compass,
  Lightbulb,
  Blocks,
  MessagesSquare,
  Brain,
  GraduationCap,
  Bot,
  AlertTriangle,
  FlaskConical,
  FileText,
  Wrench,
  Notebook,
  Database,
  BookMarked,
}

type SearchableItem = {
  chapterId: string
  sectionId: string | null
  subSectionId: string | null
  title: string
  path: string
}

interface ChapterNavProps {
  chapters: GrimoireChapter[]
  onCloseBook: () => void
}

export function ChapterNav({ chapters, onCloseBook }: ChapterNavProps) {
  const { currentChapter, currentSection, currentSubSection, navigate } = useGrimoireStore()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const ch of chapters) {
      init[ch.id] = false
      for (const sec of ch.sections) {
        if (sec.children && sec.children.length > 0) {
          init[sec.id] = false
        }
      }
    }
    return init
  })

  const searchableItems = useMemo<SearchableItem[]>(() => {
    return chapters.flatMap((chapter) => {
      const items: SearchableItem[] = [
        { chapterId: chapter.id, sectionId: null, subSectionId: null, title: chapter.title, path: chapter.title },
      ]
      for (const section of chapter.sections) {
        items.push({ chapterId: chapter.id, sectionId: section.id, subSectionId: null, title: section.title, path: `${chapter.title} / ${section.title}` })
        for (const child of section.children ?? []) {
          items.push({ chapterId: chapter.id, sectionId: section.id, subSectionId: child.id, title: child.title, path: `${chapter.title} / ${section.title} / ${child.title}` })
        }
      }
      return items
    })
  }, [chapters])

  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return []
    return searchableItems
      .filter((item) => `${item.title} ${item.path}`.toLowerCase().includes(keyword))
      .slice(0, 8)
  }, [query, searchableItems])

  const handleSearchSelect = (item: SearchableItem) => {
    navigate(item.chapterId, item.sectionId, item.subSectionId)
    setQuery('')
    setExpanded((prev) => ({
      ...prev,
      [item.chapterId]: true,
      ...(item.sectionId ? { [item.sectionId]: true } : {}),
    }))
  }
  // Sync expanded state when store navigation changes (e.g. from TOC or internal links)
  useEffect(() => {
    if (currentChapter) {
      queueMicrotask(() => {
        setExpanded((prev) => {
          const updates: Record<string, boolean> = { ...prev }
          if (prev[currentChapter] === false) updates[currentChapter] = true
          if (currentSection && prev[currentSection] === false) updates[currentSection] = true
          return updates
        })
      })
    }
  }, [currentChapter, currentSection])

  const handleChapterClick = (chapterId: string, hasSections: boolean) => {
    if (hasSections) {
      setExpanded((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }))
    }
    navigate(chapterId)
  }

  const handleSectionClick = (chapterId: string, sectionId: string, hasChildren: boolean) => {
    if (hasChildren) {
      setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
    }
    navigate(chapterId, sectionId)
  }

  const handleSubSectionClick = (chapterId: string, sectionId: string, subSectionId: string) => {
    navigate(chapterId, sectionId, subSectionId)
  }

  return (
    <nav className="w-[17rem] h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] shrink-0 flex flex-col">
      <Tooltip>
        <TooltipTrigger render={(
          <div className="border-b border-[var(--border-color)] p-2">
            <button
              type="button"
              onClick={() => navigate(null)}
              className="flex h-10 w-full shrink-0 cursor-pointer items-center rounded-lg text-left transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span className="ml-10 text-sm font-semibold text-[var(--text-primary)] transition-colors">
                章节导航
              </span>
            </button>
          </div>
        )} />
        <TooltipContent side="right" sideOffset={0}>
          回到魔导书导读页
        </TooltipContent>
      </Tooltip>
      <div className="flex-1 overflow-y-auto scrollbar-gutter-stable py-3 pl-3 pr-1">
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索章节或关键词"
              className="h-9 rounded-lg border-[var(--border-color)] bg-[var(--bg-card)] pl-9 text-sm"
            />
          </div>
          {query.trim() && (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
              {searchResults.length > 0 ? searchResults.map((item) => (
                <button
                  key={`${item.chapterId}-${item.sectionId ?? 'chapter'}-${item.subSectionId ?? 'root'}`}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="block w-full cursor-pointer border-b border-[var(--border-color)] px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[var(--bg-hover)]"
                >
                  <div className="truncate text-sm font-medium text-[var(--text-primary)]">{item.title}</div>
                  <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{item.path}</div>
                </button>
              )) : (
                <div className="px-3 py-2 text-sm text-[var(--text-muted)]">没有匹配的标题。</div>
              )}
            </div>
          )}
        </div>
        {chapters.map((chapter) => {
          const Icon = ICON_MAP[chapter.icon] ?? BookOpen
          const isOpen = expanded[chapter.id] !== false
          return (
            <div key={chapter.id} className="mb-2">
              <button
                onClick={() => handleChapterClick(chapter.id, chapter.sections.length > 0)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  currentChapter === chapter.id && !currentSection
                    ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
                aria-current={currentChapter === chapter.id && !currentSection ? 'page' : undefined}
                aria-expanded={chapter.sections.length > 0 ? isOpen : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 text-[var(--accent-primary)]" />
                <span className="min-w-0 flex-1">{chapter.title}</span>
                {chapter.sections.length > 0 && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                      isOpen ? '' : '-rotate-90'
                    }`}
                  />
                )}
              </button>
              <div
                className={`ml-2 grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-200 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  {chapter.sections.map((section) => {
                    const hasChildren = !!(section.children && section.children.length > 0)
                    const isSectionOpen = expanded[section.id] !== false
                    const isActive = currentChapter === chapter.id && currentSection === section.id && !currentSubSection
                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => handleSectionClick(chapter.id, section.id, hasChildren)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 pl-8 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] font-medium'
                              : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-hover)]'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                          aria-expanded={hasChildren ? isSectionOpen : undefined}
                        >
                          <span className="min-w-0 flex-1">{section.title}</span>
                          {hasChildren && (
                            <ChevronDown
                              className={`w-3 h-3 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${
                                isSectionOpen ? '' : '-rotate-90'
                              }`}
                            />
                          )}
                        </button>
                        {hasChildren && (
                          <div
                            className={`ml-2 grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-200 ease-in-out ${
                              isSectionOpen ? 'grid-rows-[1fr] opacity-100 translate-y-0' : 'grid-rows-[0fr] opacity-0 -translate-y-1'
                            }`}
                          >
                            <div className="min-h-0 overflow-hidden">
                              {section.children?.map((child) => {
                                const isChildActive = currentChapter === chapter.id && currentSection === section.id && currentSubSection === child.id
                                return (
                                  <button
                                    key={child.id}
                                    onClick={() => handleSubSectionClick(chapter.id, section.id, child.id)}
                                    className={`w-full cursor-pointer rounded-lg px-3 py-1.5 pl-12 text-left text-sm transition-colors ${
                                      isChildActive
                                        ? 'bg-[var(--accent-light)] text-[var(--accent-primary)] font-medium'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                    aria-current={isChildActive ? 'page' : undefined}
                                  >
                                    {child.title}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Close button — returns to hero */}
      <div className="border-t border-[var(--border-color)] p-3">
        <button
          onClick={onCloseBook}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--accent-primary)]"
        >
          <BookX className="w-4 h-4" />
          合上书本
        </button>
      </div>
    </nav>
  )
}
