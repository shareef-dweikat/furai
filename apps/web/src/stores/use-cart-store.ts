import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProductSummary } from '../network/services/products/product-model.ts'

export interface CartLine {
  id: number
  name: string
  price: number
  quantity: number
}

interface CartState {
  items: CartLine[]
  addProduct: (product: ProductSummary) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addProduct: (product) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id)

          if (!existing) {
            return {
              items: [
                ...state.items,
                {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  quantity: 1,
                },
              ],
            }
          }

          return {
            items: state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          }
        }),
    }),
    {
      name: 'furai-cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
