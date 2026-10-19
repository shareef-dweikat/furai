import { useRef, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { Page } from '../components/Page.tsx'

const Options = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
`

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 240px;
  padding: 22px 20px 20px;
  border: 1px solid #e4ddd2;
  border-radius: 16px;
  background: #fffcf7;
  box-shadow: 0 10px 24px rgb(28 25 21 / 6%);
`

const Eyebrow = styled.p`
  margin: 0;
  color: #8a7b6a;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

const Heading = styled.h2`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  text-wrap: balance;
`

const Copy = styled.p`
  margin: 0;
  flex: 1;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
`

const HiddenFileInput = styled.input`
  display: none;
`

const Action = styled.button`
  align-self: flex-start;
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: #1c1915;
  color: #f7f3ec;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  cursor: pointer;

  &:hover {
    background: #3a332c;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

export function SpaceDesignOptionsPage() {
  const navigate = useNavigate()
  const xmlInputRef = useRef<HTMLInputElement>(null)

  function onXmlChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    navigate('/space/my-design')
  }

  return (
    <Page
      title="Space design tool"
      lede="Start a blank room, or import a layout you already designed."
    >
      <Options>
        <Card>
          <Eyebrow>Start fresh</Eyebrow>
          <Heading>Create your own space</Heading>
          <Copy>Begin with an empty room and arrange the layout yourself.</Copy>
          <Action type="button">Create a space</Action>
        </Card>
        <Card>
          <Eyebrow>Import</Eyebrow>
          <Heading>Upload your own XML space design</Heading>
          <Copy>Bring in an existing layout from an XML file.</Copy>
          <Action type="button" onClick={() => xmlInputRef.current?.click()}>
            Choose XML file
          </Action>
          <HiddenFileInput
            ref={xmlInputRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={onXmlChosen}
          />
        </Card>
      </Options>
    </Page>
  )
}
