import type { CreateItemRequest, Item } from '@furai/shared'
import { request } from '../../../lib/http.ts'

export function getItems(): Promise<Item[]> {
  return request<Item[]>('/items')
}

export function createItem(title: string): Promise<Item> {
  const payload: CreateItemRequest = { title }
  return request<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
