import type { HealthStatus, Item } from '@furai/shared'
import { create } from 'zustand'
import { createItem, fetchHealth, fetchItems } from '../lib/api.ts'

interface AppState {
  health: HealthStatus | null
  items: Item[]
  loading: boolean
  submitting: boolean
  error: string | null
  refresh: () => Promise<void>
  addItem: (title: string) => Promise<void>
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export const useAppStore = create<AppState>((set) => ({
  health: null,
  items: [],
  loading: false,
  submitting: false,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const [health, items] = await Promise.all([fetchHealth(), fetchItems()])
      set({ health, items, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: toErrorMessage(error, 'Could not reach the API'),
      })
    }
  },
  addItem: async (title) => {
    set({ submitting: true, error: null })
    try {
      const item = await createItem(title)
      set((state) => ({
        items: [item, ...state.items],
        submitting: false,
      }))
    } catch (error) {
      set({
        submitting: false,
        error: toErrorMessage(error, 'Could not add that note'),
      })
      throw error
    }
  },
}))
