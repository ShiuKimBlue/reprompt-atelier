import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GrimoireRecentItem {
  chapterId: string
  sectionId: string | null
  subSectionId: string | null
  title: string
  path: string
  updatedAt: number
}

interface GrimoireState {
  isBookOpen: boolean
  currentChapter: string | null
  currentSection: string | null
  currentSubSection: string | null
  recentItems: GrimoireRecentItem[]
  visitedItemKeys: string[]
  openBook: () => void
  closeBook: () => void
  setChapter: (chapterId: string | null) => void
  setSection: (sectionId: string | null) => void
  setSubSection: (subSectionId: string | null) => void
  navigate: (chapterId: string | null, sectionId?: string | null, subSectionId?: string | null) => void
  addRecentItem: (item: Omit<GrimoireRecentItem, 'updatedAt'>) => void
}

export const useGrimoireStore = create<GrimoireState>()(
  persist(
    (set, get) => ({
      isBookOpen: false,
      currentChapter: null,
      currentSection: null,
      currentSubSection: null,
      recentItems: [],
      visitedItemKeys: [],
      openBook: () => set({
        isBookOpen: true,
        currentChapter: null,
        currentSection: null,
        currentSubSection: null,
      }),
      closeBook: () => set({
        isBookOpen: false,
        currentChapter: null,
        currentSection: null,
        currentSubSection: null,
      }),
      setChapter: (chapterId) => set({ isBookOpen: Boolean(chapterId) || get().isBookOpen, currentChapter: chapterId, currentSection: null, currentSubSection: null }),
      setSection: (sectionId) => set({ currentSection: sectionId, currentSubSection: null }),
      setSubSection: (subSectionId) => set({ currentSubSection: subSectionId }),
      navigate: (chapterId, sectionId = null, subSectionId = null) =>
        set({
          isBookOpen: chapterId ? true : get().isBookOpen,
          currentChapter: chapterId,
          currentSection: sectionId,
          currentSubSection: subSectionId,
        }),
      addRecentItem: (item) => set((state) => {
        const key = `${item.chapterId}/${item.sectionId ?? ''}/${item.subSectionId ?? ''}`
        const withoutDuplicate = state.recentItems.filter((recent) => `${recent.chapterId}/${recent.sectionId ?? ''}/${recent.subSectionId ?? ''}` !== key)
        const visitedItemKeys = state.visitedItemKeys.includes(key) ? state.visitedItemKeys : [...state.visitedItemKeys, key]
        return {
          recentItems: [{ ...item, updatedAt: Date.now() }, ...withoutDuplicate].slice(0, 5),
          visitedItemKeys,
        }
      }),
    }),
    {
      name: 'ai-prompt-studio-grimoire',
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<GrimoireState>

        if (version === 0 || typeof state.isBookOpen !== 'boolean') {
          return {
            ...state,
            isBookOpen: Boolean(state.currentChapter),
          }
        }

        return state
      },
    }
  )
)
