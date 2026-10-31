import { useState } from 'react'
import styled from 'styled-components'
import type { UserProfile, ProfileFormValues } from '../stores/use-profile-store.ts'

export interface ProfileFormProps {
  initialValues: UserProfile
  onSave: (values: ProfileFormValues) => void
}

// ── Styled components ──────────────────────────────────────────────────────────

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const SectionHeading = styled.h2`
  grid-column: 1 / -1;
  margin: 8px 0 0;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #1c1915;
  font-family: ui-sans-serif, system-ui, sans-serif;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Label = styled.label`
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.85rem;
  color: #6b6258;
`

const Input = styled.input`
  border: 1px solid #e4ddd2;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fffcf7;
  color: #1c1915;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;

  &:focus {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

const ErrorText = styled.p`
  margin: 4px 0 0;
  color: #c0392b;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.85rem;
`

const SaveButton = styled.button`
  grid-column: 1 / -1;
  align-self: flex-start;
  justify-self: flex-start;
  border: 0;
  border-radius: 999px;
  padding: 10px 20px;
  background: #1c1915;
  color: #f7f3ec;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    background: #3a332c;
  }

  &:focus-visible {
    outline: 2px solid #1c1915;
    outline-offset: 3px;
  }
`

// ── Component ──────────────────────────────────────────────────────────────────

export function ProfileForm({ initialValues, onSave }: ProfileFormProps) {
  const [draft, setDraft] = useState<ProfileFormValues>({
    name: initialValues.name,
    address: { ...initialValues.address },
    paymentMethod: { ...initialValues.paymentMethod },
  })
  const [nameError, setNameError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (draft.name.trim() === '') {
      setNameError('Name is required.')
      return
    }
    setNameError('')
    onSave(draft)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormGrid>
        {/* ── Personal ──────────────────────────────────────────────── */}
        <SectionHeading>Personal</SectionHeading>

        <FieldGroup>
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            type="text"
            value={draft.name}
            aria-describedby={nameError ? 'profile-name-error' : undefined}
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          {nameError && (
            <ErrorText id="profile-name-error" role="alert">
              {nameError}
            </ErrorText>
          )}
        </FieldGroup>

        {/* ── Address ───────────────────────────────────────────────── */}
        <SectionHeading>Address</SectionHeading>

        <FieldGroup>
          <Label htmlFor="profile-street">Street</Label>
          <Input
            id="profile-street"
            type="text"
            value={draft.address.street}
            onChange={(e) =>
              setDraft((d) => ({ ...d, address: { ...d.address, street: e.target.value } }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-city">City</Label>
          <Input
            id="profile-city"
            type="text"
            value={draft.address.city}
            onChange={(e) =>
              setDraft((d) => ({ ...d, address: { ...d.address, city: e.target.value } }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-state">State</Label>
          <Input
            id="profile-state"
            type="text"
            value={draft.address.state}
            onChange={(e) =>
              setDraft((d) => ({ ...d, address: { ...d.address, state: e.target.value } }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-zip">Zip code</Label>
          <Input
            id="profile-zip"
            type="text"
            value={draft.address.zipCode}
            onChange={(e) =>
              setDraft((d) => ({ ...d, address: { ...d.address, zipCode: e.target.value } }))
            }
          />
        </FieldGroup>

        {/* ── Payment method ────────────────────────────────────────── */}
        <SectionHeading>Payment method</SectionHeading>

        <FieldGroup>
          <Label htmlFor="profile-cardholder-name">Cardholder name</Label>
          <Input
            id="profile-cardholder-name"
            type="text"
            value={draft.paymentMethod.cardholderName}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paymentMethod: { ...d.paymentMethod, cardholderName: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-card-number">Card number</Label>
          <Input
            id="profile-card-number"
            type="text"
            value={draft.paymentMethod.cardNumber}
            inputMode="numeric"
            autoComplete="cc-number"
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paymentMethod: { ...d.paymentMethod, cardNumber: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-expiry">Expiry date</Label>
          <Input
            id="profile-expiry"
            type="text"
            placeholder="MM/YY"
            value={draft.paymentMethod.expiryDate}
            autoComplete="cc-exp"
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paymentMethod: { ...d.paymentMethod, expiryDate: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="profile-cvv">CVV</Label>
          <Input
            id="profile-cvv"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={draft.paymentMethod.cvv}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paymentMethod: { ...d.paymentMethod, cvv: e.target.value },
              }))
            }
          />
        </FieldGroup>

        <SaveButton type="submit">Save profile</SaveButton>
      </FormGrid>
    </form>
  )
}
