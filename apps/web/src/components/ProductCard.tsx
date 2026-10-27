import { Link } from 'react-router'
import styled from 'styled-components'
import type { ProductSummary } from '../network/services/products/product-model.ts'
import { useCartStore } from '../stores/use-cart-store.ts'

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const Card = styled.li`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background: #fffcf7;
  box-shadow: 0 10px 24px rgb(28 25 21 / 6%);
`

const CardLink = styled(Link)`
  color: inherit;
  text-decoration: none;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 2px solid #1c1915;
    outline-offset: -3px;
  }
`

const ProductMedia = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  height: 148px;
  background:
    linear-gradient(160deg, rgb(255 255 255 / 35%), transparent 55%),
    #e7d7c3;
  color: #5c4a38;
  font-size: 2rem;
  letter-spacing: 0.08em;
`

const ProductBody = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 16px 18px;
`

const ProductName = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
`

const ProductPrice = styled.p`
  margin: 0;
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
`

const AddButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: #1c1915;
  width: 32px;
  height: 32px;
  color: #f7f3ec;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: #3a332c;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

export function ProductCard({ product }: { product: ProductSummary }) {
  const addProduct = useCartStore((state) => state.addProduct)

  return (
    <Card>
      <ProductMedia>
        <AddButton
          type="button"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => addProduct(product)}
        >
          +
        </AddButton>
        <span aria-hidden="true">{String(product.id).padStart(2, '0')}</span>
      </ProductMedia>
      <ProductBody>
        <ProductName>
          <CardLink to={`/products/${product.id}`}>{product.name}</CardLink>
        </ProductName>
        <ProductPrice>{priceFormat.format(product.price)}</ProductPrice>
      </ProductBody>
    </Card>
  )
}
