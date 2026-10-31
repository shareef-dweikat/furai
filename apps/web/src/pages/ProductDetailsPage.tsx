import { useState } from 'react'
import { Link, useParams } from 'react-router'
import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { ProductColorPalette } from '../components/ProductColorPalette.tsx'
import { ProductModelViewer } from '../components/ProductModelViewer.tsx'
import {
  finishById,
  finishForProductColor,
  type ProductFinishId,
} from '../components/product-finishes.ts'
import { useProductDetails } from '../network/hooks/products/use-product-details.ts'
import type { ProductDetails } from '../network/services/products/product-model.ts'

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const Layout = styled.div`
  display: grid;
  gap: 24px;
`

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 24px;
`

const Price = styled.p`
  margin: 0;
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
`

const Hint = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.85rem;
`

const BackLink = styled(Link)`
  color: #1c1915;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
`

const Empty = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

export function ProductDetailsPage() {
  const { productId } = useParams()
  const parsedId = Number(productId)
  const id = Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
  const { data: product, loading, error } = useProductDetails(id)
  const missing = id === null || error === 'Product not found'

  if (!loading && (missing || error || !product)) {
    return (
      <Page title={missing ? 'Product not found' : 'Could not load product'}>
        <Empty>
          {missing ? 'That product does not exist.' : error}{' '}
          <BackLink to="/">Back to products</BackLink>
        </Empty>
      </Page>
    )
  }

  if (loading || !product) {
    return (
      <Page title="Product">
        <Empty>Loading product…</Empty>
      </Page>
    )
  }

  return <LoadedProduct key={product.id} product={product} />
}

function LoadedProduct({ product }: { product: ProductDetails }) {
  const preset = finishForProductColor(product.color)
  const [finishId, setFinishId] = useState<ProductFinishId>(preset.id)
  const finish = finishById(finishId)

  return (
    <Page title={product.name}>
      <Layout>
        <Meta>
          <Price>{priceFormat.format(product.price)}</Price>
          <Hint>Drag to rotate · scroll to zoom</Hint>
        </Meta>
        <ProductColorPalette value={finish.id} onChange={setFinishId} />
        <ProductModelViewer model={product.model} color={finish.hex} />
        <BackLink to="/">← All products</BackLink>
      </Layout>
    </Page>
  )
}
