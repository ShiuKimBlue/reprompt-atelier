import { forwardRef, useState, useCallback } from 'react'
import type { PromptItem } from '@/types'

interface GalleryCardProps {
  item: PromptItem
  onClick: (item: PromptItem, rect: DOMRect) => void
}

export const GalleryCard = forwardRef<HTMLDivElement, GalleryCardProps>(
  ({ item, onClick }, ref) => {
    const [imgError, setImgError] = useState(false)

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      onClick(item, rect)
    }, [item, onClick])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick(e)
      }
    }, [handleClick])

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        className="rounded-xl overflow-hidden cursor-pointer outline-none transition-transform duration-200 ease-out hover:scale-[1.015] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)]"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '300px 400px' }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <img
          src={imgError ? '/favicon.svg' : item.imageUrl}
          alt={`${item.title}，模型 ${item.model}`}
          loading="lazy"
          className="w-full h-auto block"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }
)

GalleryCard.displayName = 'GalleryCard'
