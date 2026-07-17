import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delay={200}>
        <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
          <Sidebar />
          <MainContent />
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
