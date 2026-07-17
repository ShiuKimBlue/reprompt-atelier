import { useState, useCallback, useEffect, useRef } from 'react'
import { useGrimoireStore } from '@/stores/useGrimoireStore'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { ChapterNav } from './ChapterNav'
import { ChapterContent } from './ChapterContent'
import { GrimoireHero } from './GrimoireHero'
import type { GrimoireChapter } from '@/types'
import indexData from '@/data/grimoire/index.json'

type GrimoireTransition = 'idle' | 'opening' | 'closing'

const OPEN_TRANSITION_MS = 340
const CLOSE_TRANSITION_MS = 260

export function GrimoireView() {
  const {
    isBookOpen,
    currentChapter,
    currentSection,
    currentSubSection,
    navigate,
    openBook,
    closeBook,
  } = useGrimoireStore()
  const [chapters] = useState<GrimoireChapter[]>(indexData.chapters as GrimoireChapter[])
  const [transition, setTransition] = useState<GrimoireTransition>('idle')
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  useEffect(() => clearTransitionTimer, [clearTransitionTimer])

  const finishTransitionAfter = useCallback((duration: number, onFinish?: () => void) => {
    clearTransitionTimer()
    transitionTimerRef.current = setTimeout(() => {
      onFinish?.()
      setTransition('idle')
      transitionTimerRef.current = null
    }, prefersReducedMotion ? 1 : duration)
  }, [clearTransitionTimer, prefersReducedMotion])

  // Find the first leaf node for a chapter (for hero card clicks)
  const findFirstLeaf = useCallback((chapter: GrimoireChapter): { sectionId: string | null; subSectionId: string | null } => {
    if (chapter.sections.length === 0) return { sectionId: null, subSectionId: null }
    const firstSection = chapter.sections[0]
    if (firstSection.children && firstSection.children.length > 0) {
      return { sectionId: firstSection.id, subSectionId: firstSection.children[0].id }
    }
    return { sectionId: firstSection.id, subSectionId: null }
  }, [])

  const handleSelectChapter = useCallback((chapterId: string, sectionId: string | null, subSectionId?: string | null) => {
    const openTarget = () => {
      if (sectionId !== null || subSectionId !== undefined) {
        navigate(chapterId, sectionId, subSectionId ?? null)
        return
      }

      const chapter = chapters.find(c => c.id === chapterId)
      if (!chapter) return
      const leaf = findFirstLeaf(chapter)
      navigate(chapterId, leaf.sectionId, leaf.subSectionId)
    }

    if (isBookOpen) {
      openTarget()
      return
    }

    setTransition('opening')
    openTarget()
    finishTransitionAfter(OPEN_TRANSITION_MS)
  }, [chapters, navigate, findFirstLeaf, isBookOpen, finishTransitionAfter])

  const handleCloseBook = useCallback(() => {
    setTransition('closing')
    finishTransitionAfter(CLOSE_TRANSITION_MS, closeBook)
  }, [closeBook, finishTransitionAfter])

  const handleNavigate = useCallback((chapterId: string, sectionId: string | null, subSectionId?: string | null) => {
    navigate(chapterId, sectionId, subSectionId ?? null)
  }, [navigate])

  const handleStartReading = useCallback(() => {
    if (isBookOpen) return
    setTransition('opening')
    openBook()
    finishTransitionAfter(OPEN_TRANSITION_MS)
  }, [isBookOpen, openBook, finishTransitionAfter])

  const showHero = !isBookOpen || transition === 'opening' || transition === 'closing'
  const showReader = isBookOpen || transition === 'opening' || transition === 'closing'

  return (
    <div className={`relative h-full scrollbar-gutter-stable ${showReader ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {showHero && (
        <div
          className={`h-full ${transition === 'opening' ? 'grimoire-hero-exit pointer-events-none' : ''} ${transition === 'closing' ? 'grimoire-hero-enter pointer-events-none' : ''}`}
          aria-hidden={transition === 'opening'}
        >
          <GrimoireHero
            chapters={chapters}
            onSelectChapter={handleSelectChapter}
            onStart={handleStartReading}
          />
        </div>
      )}

      {showReader && (
        <div
          className={`h-full flex ${transition === 'opening' ? 'grimoire-reader-enter' : ''} ${transition === 'closing' ? 'grimoire-reader-exit pointer-events-none' : ''}`}
          aria-hidden={!isBookOpen && transition !== 'opening'}
        >
          <div className={`h-full shrink-0 ${transition === 'opening' ? 'grimoire-nav-enter' : ''}`}>
            <ChapterNav chapters={chapters} onCloseBook={handleCloseBook} />
          </div>
          <div className={`h-full min-w-0 flex flex-1 ${transition === 'opening' ? 'grimoire-content-enter' : ''}`}>
            <ChapterContent chapters={chapters} chapterId={currentChapter} sectionId={currentSection} subSectionId={currentSubSection} onNavigate={handleNavigate} />
          </div>
        </div>
      )}
    </div>
  )
}
