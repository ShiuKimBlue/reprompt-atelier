import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
const DRAWER_MS = 300

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
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  const [navDrawerOpen, setNavDrawerOpen] = useState(false)
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drawerPanelRef = useRef<HTMLDivElement | null>(null)
  const drawerTriggerRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  useEffect(() => clearTransitionTimer, [clearTransitionTimer])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncViewport = () => {
      const mobile = mediaQuery.matches
      setIsMobileViewport(mobile)
      if (!mobile) setNavDrawerOpen(false)
    }
    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)
    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  const closeNav = useCallback(() => setNavDrawerOpen(false), [])

  const openNav = useCallback(() => {
    const active = document.activeElement
    drawerTriggerRef.current = active instanceof HTMLElement ? active : null
    setNavDrawerOpen(true)
  }, [])

  // Drawer a11y: body lock, focus, Escape, Tab trap
  useEffect(() => {
    if (!navDrawerOpen || !isMobileViewport) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusDrawer = () => {
      const panel = drawerPanelRef.current
      if (!panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      focusable[0]?.focus()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeNav()
        return
      }
      if (event.key !== 'Tab' || !drawerPanelRef.current) return
      const focusable = Array.from(
        drawerPanelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('aria-hidden'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const frame = window.requestAnimationFrame(focusDrawer)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      drawerTriggerRef.current?.focus()
    }
  }, [closeNav, isMobileViewport, navDrawerOpen])

  const finishTransitionAfter = useCallback((duration: number, onFinish?: () => void) => {
    clearTransitionTimer()
    transitionTimerRef.current = setTimeout(() => {
      onFinish?.()
      setTransition('idle')
      transitionTimerRef.current = null
    }, prefersReducedMotion ? 1 : duration)
  }, [clearTransitionTimer, prefersReducedMotion])

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
    closeNav()
    setTransition('closing')
    finishTransitionAfter(CLOSE_TRANSITION_MS, closeBook)
  }, [closeBook, closeNav, finishTransitionAfter])

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

  const drawerMotion = prefersReducedMotion
    ? { transition: 'opacity 150ms ease-out' }
    : { transition: `transform ${DRAWER_MS}ms ease-in-out, opacity ${DRAWER_MS}ms ease-out` }

  const drawerPortal =
    typeof document !== 'undefined' &&
    createPortal(
      <>
        {/* Backdrop — below App Sidebar z-60/61 */}
        <div
          className={`fixed inset-0 z-[55] bg-black/35 supports-[backdrop-filter]:backdrop-blur-sm md:hidden ${
            navDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          style={drawerMotion}
          aria-hidden={!navDrawerOpen}
          onClick={closeNav}
        />
        <div
          ref={drawerPanelRef}
          role="dialog"
          aria-modal="true"
          aria-label="章节目录"
          aria-hidden={!navDrawerOpen}
          className={`fixed inset-y-0 left-0 z-[56] flex w-[min(17rem,85vw)] max-w-[85vw] flex-col bg-[var(--bg-sidebar)] shadow-xl md:hidden ${
            navDrawerOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-full opacity-0'
          }`}
          style={drawerMotion}
        >
          {/* Keep nav mounted while mobile reader is up so close slide retains content */}
          <ChapterNav
            chapters={chapters}
            onCloseBook={handleCloseBook}
            onNavigateComplete={closeNav}
            variant="drawer"
          />
        </div>
      </>,
      document.body,
    )

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
          {/* Desktop docked nav */}
          {!isMobileViewport && (
            <div className={`h-full shrink-0 ${transition === 'opening' ? 'grimoire-nav-enter' : ''}`}>
              <ChapterNav
                chapters={chapters}
                onCloseBook={handleCloseBook}
                variant="docked"
              />
            </div>
          )}
          <div className={`h-full min-w-0 flex flex-1 ${transition === 'opening' ? 'grimoire-content-enter' : ''}`}>
            <ChapterContent
              chapters={chapters}
              chapterId={currentChapter}
              sectionId={currentSection}
              subSectionId={currentSubSection}
              onNavigate={handleNavigate}
              onOpenNav={isMobileViewport ? openNav : undefined}
            />
          </div>
        </div>
      )}

      {isMobileViewport && showReader ? drawerPortal : null}
    </div>
  )
}
