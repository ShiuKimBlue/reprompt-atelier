import type { ReactNode } from 'react'
import { Bot } from 'lucide-react'

interface AssistantOutputFrameProps {
  children: ReactNode
}

export function AssistantOutputFrame({ children }: AssistantOutputFrameProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent-primary)]">
        <Bot className="h-4 w-4" />
      </div>
      <div className="w-[86%] min-w-0 space-y-2">
        {children}
      </div>
    </div>
  )
}
