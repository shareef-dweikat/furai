import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { ProductCard } from '../components/ProductCard.tsx'
import { useProducts } from '../network/hooks/products/use-products.ts'

const ProductGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Status = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

export function HomePage() {
  const { data, loading, error } = useProducts()

  if (loading) {
    return (
      <Page title="Products">
        <Status>Loading products…</Status>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Products">
        <Status>{error}</Status>
      </Page>
    )
  }

  const products = data ?? []

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
