import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { useCartStore } from '../stores/use-cart-store.ts'

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const Lines = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`

const Line = styled.li`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  padding: 16px 18px;
  background: #fffcf7;
`

const Name = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
`

const Meta = styled.p`
  margin: 4px 0 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
`

const LineTotal = styled.p`
  margin: 0;
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
`

const Empty = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <Page title="Cart">
        <Empty>Your cart is empty.</Empty>
      </Page>
    )
  }

  return (
    <Page title="Cart" lede={itemCount === 1 ? '1 item' : `${itemCount} items`}>
      <Lines>
        {items.map((item) => (
          <Line key={item.id}>
            <div>
              <Name>{item.name}</Name>
              <Meta>
                {priceFormat.format(item.price)} · Qty {item.quantity}
              </Meta>
            </div>
            <LineTotal>
              {priceFormat.format(item.price * item.quantity)}
            </LineTotal>
          </Line>
        ))}
      </Lines>
    </Page>
  )
}
