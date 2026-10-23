import type { HealthStatus, Item } from '@furai/shared'
import { create } from 'zustand'
import { getHealth } from '../network/services/health/health.service.ts'
import { createItem, getItems } from '../network/services/items/items.service.ts'

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
      const [health, items] = await Promise.all([getHealth(), getItems()])
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
