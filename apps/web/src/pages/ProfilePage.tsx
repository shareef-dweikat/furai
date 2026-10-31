import { useState } from 'react'
import styled from 'styled-components'
import { Page } from '../components/Page.tsx'
import { ProfileForm } from '../components/ProfileForm.tsx'
import { useProfileStore } from '../stores/use-profile-store.ts'
import type { ProfileFormValues } from '../stores/use-profile-store.ts'

const SuccessBanner = styled.div`
  background: #eaf4ea;
  color: #2d6a2d;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
`

const ReadOnlyValue = styled.p`
  margin: 0 0 24px;
  color: #6b6258;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
`

export function ProfilePage() {
  const profile = useProfileStore((state) => state.profile)
  const updateProfile = useProfileStore((state) => state.updateProfile)
  const [saved, setSaved] = useState(false)

  function handleSave(values: ProfileFormValues) {
    updateProfile(values)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Page title="Profile">
      {saved && (
        <SuccessBanner role="status">Profile saved.</SuccessBanner>
      )}
      <ReadOnlyValue>{profile.email || 'No email on file'}</ReadOnlyValue>
      <ProfileForm initialValues={profile} onSave={handleSave} />
    </Page>
  )
}
