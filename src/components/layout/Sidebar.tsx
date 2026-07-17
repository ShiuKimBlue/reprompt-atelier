import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Images,
  BookOpen,
  Settings,
  Home,
  PanelLeftClose,
  Clock,
  ChevronDown,
  Zap,
  Layers,
  Image,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUIStore } from '@/stores/useUIStore'
import { useRepromptStore } from '@/stores/useRepromptStore'
import { useGrimoireStore } from '@/stores/useGrimoireStore'
import type { SettingsMode, TabId, WorkspaceMode, WorkspaceSession } from '@/types'

const tabs: { id: TabId; icon: typeof Sparkles; label: string; tooltip: string }[] = [
  { id: 'reprompt', icon: Sparkles, label: '工作台', tooltip: '让咒术师重铸你的咒语' },
  { id: 'grimoire', icon: BookOpen, label: '魔导书', tooltip: '开始研读大魔导书' },
  { id: 'gallery', icon: Images, label: '咒术画廊', tooltip: '感受提示词工程的魅力' },
  { id: 'settings', icon: Settings, label: '核心设定', tooltip: '设置咒术师的大脑和人格' },
  { id: 'github', icon: Home, label: '魔法屋', tooltip: '访问我的魔力小屋' },
]

const workspaceModes: { mode: WorkspaceMode; icon: typeof Zap; label: string; color: string }[] = [
  { mode: 'quick', icon: Zap, label: '快速优化', color: 'text-amber-500' },
  { mode: 'deep', icon: Layers, label: '深度优化', color: 'text-emerald-500' },
  { mode: 'image2prompt', icon: Image, label: '图转提示', color: 'text-sky-500' },
]

const settingsModes: { mode: SettingsMode; icon: typeof Zap; label: string; color: string }[] = [
  { mode: 'quick', icon: Zap, label: '快速优化', color: 'text-amber-500' },
  { mode: 'deep', icon: Layers, label: '深度优化', color: 'text-emerald-500' },
  { mode: 'image2prompt', icon: Image, label: '图转提示', color: 'text-sky-500' },
]

function getWorkspaceMeta(mode: WorkspaceMode) {
  return workspaceModes.find((item) => item.mode === mode) ?? workspaceModes[0]
}

type ModeMenuItem = { mode: SettingsMode; icon: typeof Zap; label: string; color: string }

function ModeSubmenu({
  open,
  items,
  activeMode,
  onModeClick,
}: {
  open: boolean
  items: ModeMenuItem[]
  activeMode: SettingsMode | null
  onModeClick: (mode: SettingsMode) => void
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity,transform,margin] duration-300 ease-out ${
        open ? 'mt-1 grid-rows-[1fr] translate-y-0 opacity-100' : 'mt-0 grid-rows-[0fr] -translate-y-1 opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="ml-8 min-h-0 overflow-hidden">
        <div className="space-y-0.5">
          {items.map((item) => {
            const ModeIcon = item.icon
            const active = activeMode === item.mode
            return (
              <button
                key={item.mode}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => onModeClick(item.mode)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg py-0 pl-2 pr-2 text-sm transition-colors ${
                  active
                    ? 'bg-[var(--accent-light)] font-medium text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <ModeIcon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[var(--accent-primary)]' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const {
    activeTab,
    activeWorkspaceMode,
    activeSettingsMode,
    sidebarExpanded,
    mobileSidebarOpen,
    setActiveTab,
    setWorkspaceMode,
    setSettingsMode,
    requestGalleryHero,
    toggleSidebar,
    setMobileSidebarOpen,
  } = useUIStore()
  const { sessions, currentSessionId, setCurrentSession, deleteSession, renameSession } = useRepromptStore()
  const closeBook = useGrimoireStore((state) => state.closeBook)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null)
  const [renamingSession, setRenamingSession] = useState<WorkspaceSession | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState<WorkspaceSession | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const drawerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const menuTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const sessionMenuRef = useRef<HTMLDivElement | null>(null)
  const dialogOpenRef = useRef(false)

  const currentSession = sessions.find((session) => session.id === currentSessionId)
  const currentWorkspaceMode = currentSession?.mode ?? activeWorkspaceMode
  const workspaceInHero = activeTab === 'reprompt' && currentWorkspaceMode === null
  const settingsInMode = activeTab === 'settings'

  const closeMobileDrawer = useCallback(() => setMobileSidebarOpen(false), [setMobileSidebarOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches)
    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)
    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    dialogOpenRef.current = renamingSession !== null || deleteCandidate !== null
  }, [deleteCandidate, renamingSession])

  useEffect(() => {
    if (!mobileSidebarOpen || !isMobileViewport) return

    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    triggerRef.current = previouslyFocused
    document.body.style.overflow = 'hidden'

    const focusDrawer = () => drawerRef.current?.querySelector<HTMLElement>('button:not([disabled]), [href], input:not([disabled])')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dialogOpenRef.current) return
        event.preventDefault()
        closeMobileDrawer()
        return
      }
      if (event.key !== 'Tab' || dialogOpenRef.current || !drawerRef.current) return
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter((element) => !element.hasAttribute('aria-hidden'))
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
      triggerRef.current?.focus()
    }
  }, [closeMobileDrawer, isMobileViewport, mobileSidebarOpen])

  useEffect(() => {
    if (!openSessionMenuId) return
    const closeMenuOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (sessionMenuRef.current?.contains(target) || menuTriggerRefs.current[openSessionMenuId]?.contains(target)) return
      setOpenSessionMenuId(null)
    }
    const closeMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      const sessionId = openSessionMenuId
      setOpenSessionMenuId(null)
      menuTriggerRefs.current[sessionId]?.focus()
    }
    window.addEventListener('pointerdown', closeMenuOnPointerDown)
    window.addEventListener('keydown', closeMenuOnEscape)
    return () => {
      window.removeEventListener('pointerdown', closeMenuOnPointerDown)
      window.removeEventListener('keydown', closeMenuOnEscape)
    }
  }, [openSessionMenuId])

  const canSwitchTab = (tabId: TabId) => {
    const { activeTab: currentTab, settingsLeaveGuard } = useUIStore.getState()
    return currentTab !== 'settings' || tabId === 'settings' || !settingsLeaveGuard || settingsLeaveGuard()
  }

  const handleTabClick = (tabId: TabId) => {
    if (!canSwitchTab(tabId)) return

    if (activeTab === tabId) {
      if (tabId === 'reprompt') {
        setWorkspaceMode(null)
        setCurrentSession(null)
      } else if (tabId === 'grimoire') {
        closeBook()
      } else if (tabId === 'gallery') {
        requestGalleryHero()
      }
      closeMobileDrawer()
      return
    }

    setActiveTab(tabId)
    closeMobileDrawer()
  }

  const handleWorkspaceModeClick = (mode: WorkspaceMode) => {
    if (!canSwitchTab('reprompt')) return
    setActiveTab('reprompt')
    setWorkspaceMode(mode)
    setCurrentSession(null)
    closeMobileDrawer()
  }

  const handleSettingsModeClick = (mode: SettingsMode) => {
    const { settingsLeaveGuard } = useUIStore.getState()
    if (settingsLeaveGuard && !settingsLeaveGuard()) return
    setActiveTab('settings')
    setSettingsMode(mode)
    closeMobileDrawer()
  }

  const openRenameDialog = (session: WorkspaceSession) => {
    setOpenSessionMenuId(null)
    setRenamingSession(session)
    setRenameDraft(session.title)
  }

  const submitRename = () => {
    const title = renameDraft.trim().slice(0, 50)
    if (!renamingSession || !title || title === renamingSession.title) {
      setRenamingSession(null)
      return
    }
    renameSession(renamingSession.id, title)
    setRenamingSession(null)
  }

  const confirmDelete = () => {
    if (!deleteCandidate) return
    const deletingCurrentSession = deleteCandidate.id === currentSessionId
    deleteSession(deleteCandidate.id)
    if (deletingCurrentSession) setWorkspaceMode(null)
    setDeleteCandidate(null)
    closeMobileDrawer()
  }

  const isDesktopExpanded = sidebarExpanded
  const drawerIsVisible = mobileSidebarOpen
  const drawerIsInteractive = !isMobileViewport || mobileSidebarOpen

  return (
    <>
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/35 supports-[backdrop-filter]:backdrop-blur-sm md:hidden"
          onClick={closeMobileDrawer}
          aria-label="关闭导航"
        />
      )}
      <aside
        ref={drawerRef}
        aria-hidden={!drawerIsInteractive}
        inert={!drawerIsInteractive}
        className={`fixed inset-y-0 left-0 z-[61] flex w-64 -translate-x-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] transition-[transform,width] duration-300 ease-in-out md:static md:z-auto md:translate-x-0 ${
          drawerIsVisible ? 'translate-x-0' : 'pointer-events-none md:pointer-events-auto'
        } ${isDesktopExpanded ? 'md:w-64' : 'md:w-14'}`}
      >
        <div className="border-b border-[var(--border-color)] p-2">
          <button
            type="button"
            onClick={mobileSidebarOpen ? closeMobileDrawer : toggleSidebar}
            aria-label={mobileSidebarOpen ? '关闭导航' : isDesktopExpanded ? '收起导航' : '展开导航'}
            className="relative flex h-10 w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          >
            <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-transform duration-300 ${isDesktopExpanded || mobileSidebarOpen ? 'rotate-0' : 'rotate-y-180'}`}>
              <PanelLeftClose className="h-5 w-5" />
            </span>
            <span className={`ml-10 text-sm text-[var(--text-secondary)] whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopExpanded || mobileSidebarOpen ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'}`}>
              {mobileSidebarOpen ? '关闭导航' : '收起导航'}
            </span>
          </button>
        </div>

        <nav aria-label="主导航" className="flex flex-col gap-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const hasActiveSubmode = (tab.id === 'reprompt' && !workspaceInHero && currentWorkspaceMode !== null) || (tab.id === 'settings' && settingsInMode)
            const primaryIsStrong = isActive && !hasActiveSubmode
            const button = (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex h-10 w-full cursor-pointer items-center rounded-lg transition-colors ${
                  primaryIsStrong
                    ? 'bg-[var(--accent-light)] font-medium text-[var(--accent-primary)]'
                    : isActive
                      ? 'font-medium text-[var(--accent-primary)] hover:bg-[var(--bg-hover)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`ml-10 text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopExpanded || mobileSidebarOpen ? 'max-w-40 opacity-100' : 'max-w-0 opacity-0'}`}>
                  {tab.label}
                </span>
              </button>
            )

            return (
              <div key={tab.id}>
                {isDesktopExpanded || mobileSidebarOpen ? button : (
                  <Tooltip>
                    <TooltipTrigger render={button} />
                    <TooltipContent side="right" sideOffset={0}>{tab.tooltip}</TooltipContent>
                  </Tooltip>
                )}

                {tab.id === 'reprompt' && (
                  <ModeSubmenu
                    open={activeTab === 'reprompt' && (isDesktopExpanded || mobileSidebarOpen)}
                    items={workspaceModes}
                    activeMode={currentWorkspaceMode}
                    onModeClick={(mode) => handleWorkspaceModeClick(mode)}
                  />
                )}

                {tab.id === 'settings' && (
                  <ModeSubmenu
                    open={activeTab === 'settings' && (isDesktopExpanded || mobileSidebarOpen)}
                    items={settingsModes}
                    activeMode={activeSettingsMode}
                    onModeClick={(mode) => handleSettingsModeClick(mode)}
                  />
                )}
              </div>
            )
          })}
        </nav>

        {activeTab === 'reprompt' && sessions.length > 0 && (
          <div className="mt-auto border-t border-[var(--border-color)] px-2 pt-2 pb-1">
            <button
              type="button"
              onClick={() => {
                if (!isDesktopExpanded && !mobileSidebarOpen) {
                  toggleSidebar()
                  setHistoryExpanded(true)
                  return
                }
                setHistoryExpanded(!historyExpanded)
              }}
              aria-expanded={historyExpanded}
              aria-controls="workspace-history-list"
              className="relative flex h-10 w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            >
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Clock className="h-5 w-5" />
              </span>
              <span className={`ml-10 flex-1 text-left text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopExpanded || mobileSidebarOpen ? 'max-w-40 opacity-100' : 'max-w-0 opacity-0'}`}>
                <span className="text-[var(--text-secondary)]">历史记录</span>
                <span className="ml-2 text-xs text-[var(--text-muted)]">{sessions.length}</span>
              </span>
              <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-transform duration-200 ${historyExpanded ? 'rotate-0' : '-rotate-90'} ${isDesktopExpanded || mobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronDown className="h-4 w-4" />
              </span>
            </button>

            {historyExpanded && (isDesktopExpanded || mobileSidebarOpen) && (
              <div id="workspace-history-list" className="max-h-[40vh] space-y-1 pt-1 overflow-y-auto pb-2">
                {sessions.map((session) => {
                  const meta = getWorkspaceMeta(session.mode)
                  const ModeIcon = meta.icon
                  const menuOpen = openSessionMenuId === session.id
                  return (
                    <div key={session.id} className="group relative flex min-w-0 items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('reprompt')
                          setWorkspaceMode(session.mode)
                          setCurrentSession(session.id)
                          closeMobileDrawer()
                        }}
                        aria-current={currentSessionId === session.id ? 'page' : undefined}
                        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg h-10 px-2.5 pr-9 text-left leading-tight transition-colors ${
                          currentSessionId === session.id
                            ? 'bg-[var(--accent-light)] text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        <ModeIcon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{session.title}</span>
                        </span>
                      </button>
                      <button
                        ref={(node) => { menuTriggerRefs.current[session.id] = node }}
                        type="button"
                        onClick={() => setOpenSessionMenuId(menuOpen ? null : session.id)}
                        aria-label={`会话操作：${session.title}`}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        className={`absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] ${
                          menuOpen ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)]' : ''
                        }`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpen && (
                        <div ref={sessionMenuRef} role="menu" className="absolute right-1 top-[calc(100%-2px)] z-10 w-32 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-lg">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => openRenameDialog(session)}
                            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            重命名
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenSessionMenuId(null)
                              setDeleteCandidate(session)
                            }}
                            className="flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-xs text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除会话
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </aside>

      <Dialog open={renamingSession !== null} onOpenChange={(open) => { if (!open) setRenamingSession(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
            <DialogDescription>名称最多 50 个字符，不会改变历史排序。</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); submitRename() }}>
            <Input
              autoFocus
              value={renameDraft}
              onChange={(event) => setRenameDraft(event.target.value)}
              maxLength={50}
              aria-label="会话名称"
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRenamingSession(null)}>取消</Button>
              <Button type="submit" disabled={!renameDraft.trim()}>保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteCandidate !== null} onOpenChange={(open) => { if (!open) setDeleteCandidate(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>删除会话？</DialogTitle>
            <DialogDescription>“{deleteCandidate?.title}”将被永久删除，无法恢复。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" autoFocus onClick={() => setDeleteCandidate(null)}>取消</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>删除会话</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
