import { useId, useRef, type KeyboardEvent } from 'react'
import styled from 'styled-components'
import { productFinishes, type ProductFinishId } from './product-finishes.ts'

const Block = styled.div`
  display: grid;
  gap: 10px;
`

const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
`

const Label = styled.span`
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.85rem;
`

const Name = styled.span`
  color: #3f382f;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
`

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const Swatch = styled.button<{ $hex: string }>`
  width: 36px;
  height: 36px;
  border: 1px solid rgb(28 25 21 / 18%);
  border-radius: 50%;
  padding: 0;
  background: ${(props) => props.$hex};
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 35%);
  cursor: pointer;

  &[aria-checked='true'] {
    box-shadow:
      inset 0 0 0 1px rgb(255 255 255 / 55%),
      0 0 0 2px #f4f1ea,
      0 0 0 4px #1c1915;
  }

  &:hover {
    transform: scale(1.06);
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

export function ProductColorPalette({
  value,
  onChange,
}: {
  value: ProductFinishId
  onChange: (finishId: ProductFinishId) => void
}) {
  const labelId = useId()
  const swatchRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selected = productFinishes.find((finish) => finish.id === value) ?? productFinishes[0]

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (delta === 0) return

    const current = productFinishes.findIndex((finish) => finish.id === value)
    if (current < 0) return

    event.preventDefault()
    const next = (current + delta + productFinishes.length) % productFinishes.length
    const finish = productFinishes[next]
    if (!finish) return
    onChange(finish.id)
    swatchRefs.current[next]?.focus()
  }

  return (
    <Block>
      <Header>
        <Label id={labelId}>Color</Label>
        <Name>{selected.name}</Name>
      </Header>
      <Swatches role="radiogroup" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        {productFinishes.map((finish, index) => {
          const checked = finish.id === value
          return (
            <Swatch
              key={finish.id}
              ref={(node) => {
                swatchRefs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={finish.name}
              tabIndex={checked ? 0 : -1}
              $hex={finish.hex}
              onClick={() => onChange(finish.id)}
            />
          )
        })}
      </Swatches>
    </Block>
  )
}
