import { lazy, Suspense } from 'react'
import { Loader2, Menu } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { BulbToggle } from '@/components/ui/BulbToggle'
import { Button } from '@/components/ui/button'

const RepromptView = lazy(() => import('@/components/reprompt/RepromptView').then(m => ({ default: m.RepromptView })))
const GalleryView = lazy(() => import('@/components/gallery/GalleryView').then(m => ({ default: m.GalleryView })))
const GrimoireView = lazy(() => import('@/components/grimoire/GrimoireView').then(m => ({ default: m.GrimoireView })))
const SettingsView = lazy(() => import('@/components/settings/SettingsView').then(m => ({ default: m.SettingsView })))
const GitHubView = lazy(() => import('@/components/github/GitHubView').then(m => ({ default: m.GitHubView })))

function ModuleFallback() {
  return (
    <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-primary)]" />
        正在打开模块...
      </div>
    </div>
  )
}

export function MainContent() {
  const { activeTab, setMobileSidebarOpen } = useUIStore()

  return (
    <main className="relative min-w-0 flex-1 overflow-hidden bg-[var(--bg-main)]">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setMobileSidebarOpen(true)}
        className="absolute left-[10px] top-[10px] z-50 md:hidden"
        aria-label="打开导航"
        title="打开导航"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <BulbToggle />
      {activeTab === 'reprompt' && <Suspense fallback={<ModuleFallback />}><RepromptView /></Suspense>}
      {activeTab === 'gallery' && <Suspense fallback={<ModuleFallback />}><GalleryView /></Suspense>}
      {activeTab === 'grimoire' && <Suspense fallback={<ModuleFallback />}><GrimoireView /></Suspense>}
      {activeTab === 'settings' && <Suspense fallback={<ModuleFallback />}><SettingsView /></Suspense>}
      {activeTab === 'github' && <Suspense fallback={<ModuleFallback />}><GitHubView /></Suspense>}
    </main>
  )
}
