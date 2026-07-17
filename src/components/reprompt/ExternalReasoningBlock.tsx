import { useEffect, useRef, useState } from 'react'
import { ReasoningPanel } from './ReasoningPanel'

interface ExternalReasoningBlockProps {
  content: string
  enabled: boolean
  isStreaming?: boolean
  contentStarted?: boolean
}

export function ExternalReasoningBlock({
  content,
  enabled,
  isStreaming = false,
  contentStarted = false,
}: ExternalReasoningBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const autoCollapsedRef = useRef(false)
  const userToggledRef = useRef(false)
  const isReasoningStreaming = isStreaming && !contentStarted
  const shouldRender = enabled && (content.trim().length > 0 || isStreaming)

  useEffect(() => {
    if (!shouldRender) return
    if (isReasoningStreaming && !userToggledRef.current) {
      setExpanded(true)
      autoCollapsedRef.current = false
      return
    }
    if (contentStarted && !autoCollapsedRef.current && !userToggledRef.current) {
      setExpanded(false)
      autoCollapsedRef.current = true
    }
  }, [contentStarted, isReasoningStreaming, shouldRender])

  if (!shouldRender) return null

  return (
    <ReasoningPanel
      content={content}
      expanded={expanded}
      streaming={isReasoningStreaming}
      onToggle={() => {
        userToggledRef.current = true
        setExpanded((value) => !value)
      }}
    />
  )
}
