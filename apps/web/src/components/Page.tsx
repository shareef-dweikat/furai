import type { ReactNode } from 'react'
import styled from 'styled-components'

const Frame = styled.section`
  width: min(880px, 100%);
  margin: 0 auto;
`

const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 2.25rem;
  font-weight: 500;
  letter-spacing: -0.03em;
`

const Lede = styled.p`
  margin: 0 0 28px;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
`

export function Page({
  title,
  lede,
  children,
}: {
  title: string
  lede?: string
  children?: ReactNode
}) {
  return (
    <Frame aria-labelledby="page-title">
      <Title id="page-title">{title}</Title>
      {lede ? <Lede>{lede}</Lede> : null}
      {children}
    </Frame>
  )
}
