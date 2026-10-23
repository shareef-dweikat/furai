import { useEffect, useState } from 'react'
import type { ProductSummary } from '../../services/products/product-model.ts'
import { getProducts } from '../../services/products/products.service.ts'

interface ProductsState {
  data: ProductSummary[] | null
  loading: boolean
  error: string | null
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useProducts(): ProductsState {
  const [data, setData] = useState<ProductSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    getProducts()
      .then((products) => {
        if (!active) {
          return
        }
        setData(products)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        if (!active) {
          return
        }
        setLoading(false)
        setError(toErrorMessage(caught, 'Could not load products'))
      })

    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}
