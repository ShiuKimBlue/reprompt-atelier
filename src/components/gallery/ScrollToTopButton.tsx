import { useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  targetRef: React.RefObject<HTMLDivElement | null>
}

export function ScrollToTopButton({ scrollContainerRef, targetRef }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setVisible(scrollHeight - scrollTop - clientHeight < 200)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollContainerRef])

  const handleClick = useCallback(() => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [targetRef])

  if (!visible) return null

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-[10px] z-50 w-9 h-9 rounded-lg border cursor-pointer
        flex items-center justify-center transition-all duration-300 ease-out outline-none
        bg-[rgba(76,136,255,0.1)] border-[rgba(76,136,255,0.22)]
        scroll-top-btn-enter"
      style={{
        boxShadow: '0 0 16px rgba(76,136,255,0.12), 0 0 32px rgba(76,136,255,0.06)',
      }}
      title="回到画廊顶部"
      aria-label="回到画廊顶部"
    >
      <ArrowUp
        className="w-[18px] h-[18px] text-[var(--accent-primary)]"
        strokeWidth={1.8}
      />
    </button>
  )
}
