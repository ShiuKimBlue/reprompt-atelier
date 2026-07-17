import { useState } from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromptResultActionsProps {
  content: string
  onRetry?: () => void
  align?: 'left' | 'right'
  className?: string
}

export function PromptResultActions({ content, onRetry, align = 'left', className = '' }: PromptResultActionsProps) {
  const [copied, setCopied] = useState(false)

  if (!content && !onRetry) return null

  const handleCopy = async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`mt-2 flex gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'} ${className}`}>
      {content && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          aria-label={copied ? '已复制' : '复制'}
          title={copied ? '已复制' : '复制'}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      {onRetry && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRetry}
          className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          aria-label="重试"
          title="重试"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
