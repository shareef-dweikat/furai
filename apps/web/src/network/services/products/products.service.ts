import { request } from '../../../lib/api.ts'
import type { ProductDetails, ProductSummary } from './product-model.ts'

export function getProducts(): Promise<ProductSummary[]> {
  return request<ProductSummary[]>('/products')
}

export function getProductDetails(id: number): Promise<ProductDetails> {
  return request<ProductDetails>(`/products/${id}`)
}
