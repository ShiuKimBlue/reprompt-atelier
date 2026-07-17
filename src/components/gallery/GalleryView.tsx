import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import { Palette } from 'lucide-react'
import { GalleryCard } from './GalleryCard'
import { GalleryHero } from './GalleryHero'
import { Lightbox } from './Lightbox'
import { ScrollToTopButton } from './ScrollToTopButton'
import { useUIStore } from '@/stores/useUIStore'
import galleryData from '@/data/gallery/gallery.json'
import type { PromptItem } from '@/types'

const BREAKPOINTS = {
  default: 5,
  1280: 3,
  1024: 2,
  640: 1,
}

const rawData = galleryData as PromptItem[]
const stableShuffledData = shuffleArray(rawData)

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface LightboxState {
  item: PromptItem
  rect: DOMRect
}

export function GalleryView() {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)
  const {
    gallerySelectedModel: selectedModel,
    galleryHeroRequestId,
    galleryViewMode,
    setGallerySelectedModel: setSelectedModel,
    setGalleryViewMode,
  } = useUIStore()
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const skipNextContentRestoreRef = useRef(false)

  const shuffledData = useMemo(() => stableShuffledData, [])

  const models = useMemo(() => {
    const set = new Set(rawData.map(item => item.model))
    return Array.from(set).sort()
  }, [])

  useEffect(() => {
    if (selectedModel && !models.includes(selectedModel)) setSelectedModel(null)
  }, [models, selectedModel, setSelectedModel])

  const items = useMemo(() => {
    return selectedModel
      ? shuffledData.filter(item => item.model === selectedModel)
      : shuffledData
  }, [selectedModel, shuffledData])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    if (galleryViewMode === 'hero') {
      container.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    if (skipNextContentRestoreRef.current) {
      skipNextContentRestoreRef.current = false
      return
    }

    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
  }, [galleryViewMode, selectedModel])

  useEffect(() => {
    if (galleryHeroRequestId === 0) return
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollTo({ top: 0, behavior: 'smooth' })
  }, [galleryHeroRequestId])

  const scrollToContent = useCallback(() => {
    skipNextContentRestoreRef.current = true
    setGalleryViewMode('content')
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [setGalleryViewMode])

  const handleCardClick = useCallback((item: PromptItem, rect: DOMRect) => {
    setLightbox({ item, rect })
  }, [])

  const handleCloseLightbox = useCallback(() => {
    setLightbox(null)
  }, [])

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden scrollbar-gutter-stable">
      {/* Hero */}
      <GalleryHero onStart={scrollToContent} />

      {/* Content phase */}
      <div ref={contentRef} className="flex flex-col h-full">
        {/* Sticky header with model filter */}
        <div className="sticky top-0 z-10 shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-main)] p-2">
          <div className="flex h-10 items-center gap-3 px-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-light)]">
              <Palette className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">咒术画廊</h1>
            {/* Model filter pills */}
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:ml-2">
              <ModelPill
                label="全部"
                active={selectedModel === null}
                onClick={() => setSelectedModel(null)}
              />
              {models.map(model => (
                <ModelPill
                  key={model}
                  label={model}
                  active={selectedModel === model}
                  onClick={() => setSelectedModel(model)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Grid area */}
        <div className="flex-1 p-6">
          <Masonry
            breakpointCols={BREAKPOINTS}
            className="flex gap-4"
            columnClassName="bg-clip-padding"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="mb-4"
              >
                <GalleryCard item={item} onClick={handleCardClick} />
              </div>
            ))}
          </Masonry>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <Lightbox
            item={lightbox.item}
            originRect={lightbox.rect}
            onClose={handleCloseLightbox}
          />
        )}
      </div>

      {/* Back to top button */}
      <ScrollToTopButton scrollContainerRef={scrollContainerRef} targetRef={contentRef} />
    </div>
  )
}

function ModelPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
      style={{
        background: active ? 'var(--accent-primary)' : 'var(--bg-input)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
      }}
    >
      {label}
    </button>
  )
}
