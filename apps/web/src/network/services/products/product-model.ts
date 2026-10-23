export interface ProductSummary {
  id: number
  name: string
  price: number
  image: string
}

export type ProductModel = 'chair' | 'table' | 'lamp' | 'closet'

export interface ProductDetails {
  id: number
  name: string
  price: number
  color: string
  model: ProductModel
}
