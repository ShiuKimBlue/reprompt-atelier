import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SettingsMode, TabId, WorkspaceMode } from '@/types'

type WorkspaceSelection = WorkspaceMode | null
type GalleryViewMode = 'hero' | 'content'

interface UIState {
  activeTab: TabId
  activeWorkspaceMode: WorkspaceSelection
  activeSettingsMode: SettingsMode
  gallerySelectedModel: string | null
  galleryViewMode: GalleryViewMode
  galleryHeroRequestId: number
  sidebarExpanded: boolean
  mobileSidebarOpen: boolean
  settingsLeaveGuard: (() => boolean) | null
  setActiveTab: (tab: TabId) => void
  setWorkspaceMode: (mode: WorkspaceSelection) => void
  setSettingsMode: (mode: SettingsMode) => void
  setGallerySelectedModel: (model: string | null) => void
  setGalleryViewMode: (mode: GalleryViewMode) => void
  requestGalleryHero: () => void
  setSettingsLeaveGuard: (guard: (() => boolean) | null) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
}

interface PersistedUIState {
  activeSettingsMode?: SettingsMode
  gallerySelectedModel?: string | null
  galleryViewMode?: GalleryViewMode
  sidebarExpanded?: boolean
}

function normalizeSettingsMode(mode: PersistedUIState['activeSettingsMode']): SettingsMode {
  return mode === 'deep' || mode === 'image2prompt' ? mode : 'quick'
}

function normalizeGalleryViewMode(mode: PersistedUIState['galleryViewMode']): GalleryViewMode {
  return mode === 'content' ? 'content' : 'hero'
}

function migrateUIState(state: unknown): Partial<UIState> {
  const persisted = state as PersistedUIState
  return {
    activeTab: 'reprompt',
    sidebarExpanded: persisted.sidebarExpanded ?? true,
    activeWorkspaceMode: null,
    activeSettingsMode: normalizeSettingsMode(persisted.activeSettingsMode),
    gallerySelectedModel: typeof persisted.gallerySelectedModel === 'string' ? persisted.gallerySelectedModel : null,
    galleryViewMode: normalizeGalleryViewMode(persisted.galleryViewMode),
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: 'reprompt',
      activeWorkspaceMode: null,
      activeSettingsMode: 'quick',
      gallerySelectedModel: null,
      galleryViewMode: 'hero',
      galleryHeroRequestId: 0,
      sidebarExpanded: true,
      mobileSidebarOpen: false,
      settingsLeaveGuard: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setWorkspaceMode: (mode) => set({ activeWorkspaceMode: mode }),
      setSettingsMode: (mode) => set({ activeSettingsMode: mode }),
      setGallerySelectedModel: (model) => set({ gallerySelectedModel: model }),
      setGalleryViewMode: (mode) => set({ galleryViewMode: mode }),
      requestGalleryHero: () => set((state) => ({
        gallerySelectedModel: null,
        galleryViewMode: 'hero',
        galleryHeroRequestId: state.galleryHeroRequestId + 1,
      })),
      setSettingsLeaveGuard: (guard) => set({ settingsLeaveGuard: guard }),
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: 'ai-prompt-studio-sidebar',
      version: 5,
      migrate: migrateUIState,
      partialize: (state) => ({
        sidebarExpanded: state.sidebarExpanded,
        activeSettingsMode: state.activeSettingsMode,
        gallerySelectedModel: state.gallerySelectedModel,
        galleryViewMode: state.galleryViewMode,
      }),
    }
  )
)
