export interface Product {
  id: number
  name: string
  price: number
  image: string
  model: 'chair' | 'table' | 'lamp'
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    price: 100,
    image: 'https://via.placeholder.com/150',
    model: 'chair',
  },
  {
    id: 2,
    name: 'Product 2',
    price: 200,
    image: 'https://via.placeholder.com/150',
    model: 'table',
  },
]

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id)
}
