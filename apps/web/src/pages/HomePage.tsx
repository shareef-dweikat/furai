import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { ProductCard, type Product } from '../components/ProductCard.tsx'

const products: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    price: 100,
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 2,
    name: 'Product 2',
    price: 200,
    image: 'https://via.placeholder.com/150',
  },
]

const ProductGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export function HomePage() {
  return (
    <Page title="Products" lede={`${products.length} available`}>
      <ProductGrid>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </Page>
  )
}
