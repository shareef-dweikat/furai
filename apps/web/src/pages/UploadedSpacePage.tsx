import { Link } from 'react-router'
import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { useSpaceDesignStore } from '../stores/use-space-design.ts'

const Preview = styled.img`
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background: #fffcf7;
`

const Empty = styled.p`
  margin: 0;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

const ChooseLink = styled(Link)`
  color: #1c1915;
`

export function UploadedSpacePage() {
  const svgUrl = useSpaceDesignStore((state) => state.svgUrl)
  const fileName = useSpaceDesignStore((state) => state.fileName)

  return (
    <Page title="My space design tool" lede={fileName ?? undefined}>
      {svgUrl ? (
        <Preview src={svgUrl} alt={fileName ?? 'Uploaded space design'} />
      ) : (
        <Empty>
          No design yet. <ChooseLink to="/space">Choose an SVG file</ChooseLink> to
          see it here.
        </Empty>
      )}
    </Page>
  )
}
