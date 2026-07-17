import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RepromptRecord, WorkspaceMessage, WorkspaceMode, WorkspaceSession } from '@/types'

const MAX_RECORDS = 50

type LegacyWorkspaceMode = WorkspaceMode | 'deepAgent'
type LegacyWorkspaceSession = Omit<WorkspaceSession, 'mode'> & { mode: LegacyWorkspaceMode }

interface RepromptState {
  records: RepromptRecord[]
  currentRecordId: string | null
  sessions: WorkspaceSession[]
  currentSessionId: string | null
  addRecord: (record: RepromptRecord) => void
  updateRecord: (id: string, updates: Partial<RepromptRecord>) => void
  deleteRecord: (id: string) => void
  setCurrentRecord: (id: string | null) => void
  getCurrentRecord: () => RepromptRecord | undefined
  createSession: (mode: WorkspaceMode, title: string, model: string, messages?: WorkspaceMessage[]) => WorkspaceSession
  updateSession: (id: string, updates: Partial<WorkspaceSession>) => void
  renameSession: (id: string, title: string) => void
  appendMessage: (sessionId: string, message: WorkspaceMessage) => void
  deleteSession: (id: string) => void
  setCurrentSession: (id: string | null) => void
  getCurrentSession: () => WorkspaceSession | undefined
}

interface LegacyRepromptState extends Partial<Omit<RepromptState, 'sessions'>> {
  records?: RepromptRecord[]
  sessions?: LegacyWorkspaceSession[]
}

function recordToSession(record: RepromptRecord): WorkspaceSession {
  const mode: WorkspaceMode = record.mode === 'quick'
    ? 'quick'
    : record.mode === 'deep' || record.pipelineVersion === 'v2'
    ? 'deep'
    : 'deep'

  const assistantContent = mode === 'deep'
    ? record.finalPrompt || record.optimizedPrompt
    : record.optimizedPrompt

  return {
    id: record.id,
    mode,
    title: record.title,
    model: record.model,
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
    messages: [
      {
        id: `${record.id}-user`,
        role: 'user',
        content: record.originalPrompt,
        createdAt: record.createdAt,
      },
      {
        id: `${record.id}-assistant`,
        role: 'assistant',
        content: assistantContent,
        createdAt: record.createdAt,
        artifact: {
          reasoning: record.thinking,
          pipeline: mode === 'deep'
            ? {
                draftPrompt: record.draftPrompt || record.thinking || '',
                critiqueReport: record.critiqueReport || '',
                finalPrompt: record.finalPrompt || record.optimizedPrompt,
                draftReasoning: record.draftReasoning || '',
                critiqueReasoning: record.critiqueReasoning || '',
                synthesizerReasoning: record.rewriterReasoning || '',
              }
            : undefined,
        },
      },
    ],
  }
}

function isActiveWorkspaceSession(session: LegacyWorkspaceSession): session is WorkspaceSession {
  return session.mode === 'quick' || session.mode === 'deep' || session.mode === 'image2prompt'
}

function migrateRepromptState(state: unknown): Pick<RepromptState, 'records' | 'currentRecordId' | 'sessions' | 'currentSessionId'> {
  const legacy = state as LegacyRepromptState
  const records = legacy.records ?? []
  const sessions = legacy.sessions && legacy.sessions.length > 0
    ? legacy.sessions.filter(isActiveWorkspaceSession)
    : records.map(recordToSession)
  const currentSession = sessions.find((session) => session.id === legacy.currentSessionId)

  return {
    records,
    currentRecordId: legacy.currentRecordId ?? null,
    sessions: sessions.slice(0, MAX_RECORDS),
    currentSessionId: currentSession?.id ?? null,
  }
}

export const useRepromptStore = create<RepromptState>()(
  persist(
    (set, get) => ({
      records: [],
      currentRecordId: null,
      sessions: [],
      currentSessionId: null,
      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records].slice(0, MAX_RECORDS),
          currentRecordId: record.id,
        })),
      updateRecord: (id, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      deleteRecord: (id) =>
        set((state) => {
          const filtered = state.records.filter((r) => r.id !== id)
          return {
            records: filtered,
            currentRecordId:
              state.currentRecordId === id
                ? filtered[0]?.id ?? null
                : state.currentRecordId,
          }
        }),
      setCurrentRecord: (id) => set({ currentRecordId: id }),
      getCurrentRecord: () => {
        const state = get()
        return state.records.find((r) => r.id === state.currentRecordId)
      },
      createSession: (mode, title, model, messages = []) => {
        const now = Date.now()
        const session: WorkspaceSession = {
          id: crypto.randomUUID(),
          mode,
          title,
          messages,
          model,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          sessions: [session, ...state.sessions].slice(0, MAX_RECORDS),
          currentSessionId: session.id,
        }))
        return session
      },
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions
            .map((session) => session.id === id ? { ...session, ...updates, updatedAt: updates.updatedAt ?? Date.now() } : session)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, MAX_RECORDS),
        })),
      renameSession: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((session) => session.id === id ? { ...session, title } : session),
        })),
      appendMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions
            .map((session) => session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, message],
                  title: session.messages.length === 0 && message.role === 'user' && !(session.mode === 'image2prompt' && message.images?.length)
                    ? message.content.slice(0, 50) || session.title
                    : session.title,
                  updatedAt: message.createdAt,
                }
              : session)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, MAX_RECORDS),
        })),
      deleteSession: (id) =>
        set((state) => {
          const filtered = state.sessions.filter((session) => session.id !== id)
          return {
            sessions: filtered,
            currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
          }
        }),
      setCurrentSession: (id) => set({ currentSessionId: id }),
      getCurrentSession: () => {
        const state = get()
        return state.sessions.find((session) => session.id === state.currentSessionId)
      },
    }),
    {
      name: 'ai-records',
      version: 3,
      migrate: migrateRepromptState,
    }
  )
)
