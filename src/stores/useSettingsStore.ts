import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings, ModelConfig } from '@/types'
import { ANALYZER_SYSTEM_PROMPT, PLANNER_SYSTEM_PROMPT, SYNTHESIZER_SYSTEM_PROMPT, QUICK_OPTIMIZE_SYSTEM_PROMPT, IMAGE2PROMPT_SYSTEM_PROMPT } from '@/lib/prompts'

const DEFAULT_SETTINGS: AppSettings = {
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.4,
  darkMode: false,
  githubUrl: '',
  showReasoning: false,
  analyzerPrompt: ANALYZER_SYSTEM_PROMPT,
  plannerPrompt: PLANNER_SYSTEM_PROMPT,
  synthesizerPrompt: SYNTHESIZER_SYSTEM_PROMPT,
  analyzerModel: null,
  plannerModel: null,
  synthesizerModel: null,
  quickOptimizePrompt: QUICK_OPTIMIZE_SYSTEM_PROMPT,
  image2PromptPrompt: IMAGE2PROMPT_SYSTEM_PROMPT,
  image2PromptModel: null,
}

interface SettingsState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void
  toggleDarkMode: () => void
  resetSettings: () => void
}

interface LegacySettingsState extends Partial<SettingsState> {
  perAgentModel?: boolean
  analyzerModel?: ModelConfig | null
  planerPrompt?: string
  planerModel?: ModelConfig | null
  deepAgentPrompt?: string
  deepAgentModel?: ModelConfig | null
  deepAgentSearch?: unknown
}

function migrateLegacySettings(state: unknown): SettingsState {
  const settings = state as LegacySettingsState
  const next = {
    ...DEFAULT_SETTINGS,
    ...settings,
    plannerPrompt: settings.plannerPrompt ?? settings.planerPrompt ?? DEFAULT_SETTINGS.plannerPrompt,
    analyzerModel: settings.analyzerModel ?? DEFAULT_SETTINGS.analyzerModel,
    plannerModel: settings.plannerModel ?? settings.planerModel ?? DEFAULT_SETTINGS.plannerModel,
  }

  delete (next as LegacySettingsState).perAgentModel
  delete (next as LegacySettingsState).planerPrompt
  delete (next as LegacySettingsState).planerModel
  delete (next as LegacySettingsState).deepAgentPrompt
  delete (next as LegacySettingsState).deepAgentModel
  delete (next as LegacySettingsState).deepAgentSearch

  return next as SettingsState
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (settings) => set((state) => ({ ...state, ...settings })),
      toggleDarkMode: () => set((state) => {
        const newDark = !state.darkMode
        document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light')
        return { darkMode: newDark }
      }),
      resetSettings: () => {
        document.documentElement.setAttribute('data-theme', DEFAULT_SETTINGS.darkMode ? 'dark' : 'light')
        set(DEFAULT_SETTINGS)
      },
    }),
    {
      name: 'ai-settings',
      version: 4,
      migrate: migrateLegacySettings,
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light')
        }
      },
    }
  )
)
