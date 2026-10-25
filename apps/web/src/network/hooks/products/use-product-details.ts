import { useEffect, useState } from 'react'
import type { ProductDetails } from '../../services/products/product-model.ts'
import { getProductDetails } from '../../services/products/products.service.ts'

interface ProductDetailsState {
  data: ProductDetails | null
  loading: boolean
  error: string | null
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function useProductDetails(id: number | null): ProductDetailsState {
  const [data, setData] = useState<ProductDetails | null>(null)
  const [loading, setLoading] = useState(id !== null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (id === null) {
      return
    }

    let active = true
    setData(null)
    setLoading(true)
    setError(null)

    getProductDetails(id)
      .then((product) => {
        if (!active) {
          return
        }
        setData(product)
        setLoading(false)
      })
      .catch((caught: unknown) => {
        if (!active) {
          return
        }
        setLoading(false)
        setError(toErrorMessage(caught, 'Could not load product'))
      })

    return () => {
      active = false
    }
  }, [id])

  return { data, loading, error }
}
