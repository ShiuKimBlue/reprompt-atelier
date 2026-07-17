import { useState } from 'react'
import { Brain, ChevronDown, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ReasoningPanelProps {
  content: string
  expanded?: boolean
  defaultExpanded?: boolean
  streaming?: boolean
  onToggle?: () => void
  icon?: LucideIcon
  label?: string
}

export function ReasoningPanel({
  content,
  expanded,
  defaultExpanded = false,
  streaming = false,
  onToggle,
  icon = Brain,
  label = '思考过程',
}: ReasoningPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  const Icon = icon

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
      return
    }
    setInternalExpanded((value) => !value)
  }

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]/60">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] transition-colors ${isExpanded ? '' : 'hover:bg-[var(--bg-hover)]'}`}
      >
        {streaming ? <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)]" /> : <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <span>{label}</span>
        <ChevronDown className={`ml-auto h-4 w-4 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="border-t border-[var(--border-color)] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words text-[var(--text-secondary)]">
          <span className={streaming && content.length > 0 ? 'streaming-cursor' : ''}>
            {content.trimStart() || '正在思考...'}
          </span>
        </div>
      )}
    </div>
  )
}
