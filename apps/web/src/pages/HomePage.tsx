import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { ProductCard } from '../components/ProductCard.tsx'
import { products } from '../data/products.ts'

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
