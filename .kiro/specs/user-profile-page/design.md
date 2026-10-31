# Design Document: User Profile Page

## Overview

Adds a User Profile Page to the Furai web app. The work touches four files and adds three new
ones:

- **`useProfileStore`** — a plain Zustand store (no persistence) that owns `UserProfile` data and
  the `isSignedIn` flag.
- **`ProfilePage`** — the page component rendered at `/profile`.
- **`ProfileForm`** — a controlled form component with name-only validation.
- **`Navbar`** — gains a conditional Profile link driven by `isSignedIn`.
- **`App.tsx`** — gains the `/profile` route.

No new external dependencies are needed. The feature uses React 19, React Router 8,
styled-components 6, and Zustand 5 — all already present in `apps/web`.

---

## Architecture

```
apps/web/src/
├── stores/
│   └── use-profile-store.ts        NEW
├── pages/
│   └── ProfilePage.tsx             NEW
├── components/
│   ├── Navbar.tsx                  MODIFIED – conditional Profile tab
│   └── ProfileForm.tsx             NEW
└── App.tsx                         MODIFIED – /profile route
```

---

## Data Models

```ts
// apps/web/src/stores/use-profile-store.ts

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

export interface PaymentMethod {
  cardholderName: string
  cardNumber: string
  expiryDate: string
  cvv: string
}

export interface UserProfile {
  name: string
  email: string
  address: Address
  paymentMethod: PaymentMethod
}

// The editable subset – email is read-only and never passed to updateProfile
export type ProfileFormValues = Omit<UserProfile, 'email'>
```

---

## Store Design

`useProfileStore` is a plain `create` call — no `persist` middleware, matching the pattern used by
`use-app-store.ts`. All state lives in memory and resets on page reload.

```ts
import { create } from 'zustand'
import type { UserProfile, ProfileFormValues } from './use-profile-store.ts'

interface ProfileState {
  profile: UserProfile
  isSignedIn: boolean
  updateProfile: (values: ProfileFormValues) => void
}

const emptyProfile: UserProfile = {
  name: '',
  email: '',
  address: { street: '', city: '', state: '', zipCode: '' },
  paymentMethod: { cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' },
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: emptyProfile,
  isSignedIn: true,                        // hardcoded until auth is implemented
  updateProfile: (values) =>
    set((state) => ({
      profile: {
        ...values,
        email: state.profile.email,        // preserve the read-only email
      },
    })),
}))
```

Key decisions:

- **`isSignedIn: true`** — hardcoded per spec; never updated.
- **`email` preservation** — `updateProfile` accepts `ProfileFormValues` (no `email` field), so
  the type prevents accidentally overwriting it.
- **No persist** — in-memory only. Adding `persist` later is a one-line change.

---

## Components and Interfaces

### Navbar (modified)

The static `navItems` array is replaced with a derived list that appends the Profile item when
`isSignedIn` is `true`. The component already calls `useCartStore`; it gains one extra
`useProfileStore` selector.

```tsx
const isSignedIn = useProfileStore((state) => state.isSignedIn)

const navItems = [
  { to: '/cart', label: 'Cart' },
  { to: '/orders', label: 'Orders' },
  { to: '/', label: 'Home' },
  { to: '/space', label: 'Space design tool' },
  ...(isSignedIn ? [{ to: '/profile', label: 'Profile' }] : []),
]
```

The Profile `<Tab>` is identical to all other tabs and inherits the existing `.active` CSS rule
automatically via `NavLink`.

---

### ProfilePage

Standard page component following the same shape as `CartPage`:

- Wraps content in `<Page title="Profile" />`.
- Reads `profile` from `useProfileStore`.
- Renders the email as a read-only `<p>` above the form.
- Passes `profile` and `onSave` to `ProfileForm`.
- Shows a brief confirmation message for 3 seconds after a successful save, managed with local
  `useState` + `setTimeout`.

```tsx
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
      {saved && <SuccessBanner role="status">Profile saved.</SuccessBanner>}
      <ProfileForm initialValues={profile} onSave={handleSave} />
    </Page>
  )
}
```

---

### ProfileForm

A controlled form component that owns its own draft state and a single `nameError` string.

```ts
interface ProfileFormProps {
  initialValues: UserProfile
  onSave: (values: ProfileFormValues) => void
}
```

On submit:

1. If `draft.name.trim()` is empty, set `nameError` and return — store is not updated.
2. Otherwise, call `onSave(draft)` and clear `nameError`.

Fields (nine editable inputs; email shown read-only above the form in `ProfilePage`):

| Field | Input type | Validation |
|---|---|---|
| Name | text | Required (non-empty after trim) |
| Street | text | None |
| City | text | None |
| State | text | None |
| Zip code | text | None |
| Cardholder name | text | None |
| Card number | text | None |
| Expiry date | text | None |
| CVV | text | None |

---

## Routing Change

In `App.tsx`, add the import and route alongside the existing page routes:

```tsx
import { ProfilePage } from './pages/ProfilePage.tsx'

// Inside <Routes>:
<Route path="profile" element={<ProfilePage />} />
```

No changes to the `Shell`, `Navbar` wrapper, or catch-all route.

---

## Styled-components Conventions

All new styled components follow the patterns established in `CartPage`, `SpaceDesignOptionsPage`,
and `Navbar`:

| Concern | Convention |
|---|---|
| Background / surface | `#f4f1ea` shell, `#fffcf7` card/panel |
| Text | `#1c1915` primary, `#6b6258` muted |
| Borders | `1px solid #e4ddd2` |
| Border radius | `16px` for panels, `8px` for inputs, `999px` for buttons |
| Font – headings | Georgia / Times (inherited from `Shell`) |
| Font – body / labels | `ui-sans-serif, system-ui, sans-serif` |
| Focus ring | `outline: 2px solid #1c1915; outline-offset: 3px` |
| Button (filled) | `background: #1c1915; color: #f7f3ec` — hover `#3a332c` (matches `Action` in `SpaceDesignOptionsPage`) |
| Button (ghost) | `background: transparent` — hover `#efe8dc` (matches `RemoveButton` in `CartPage`) |

New styled components introduced in this feature:

- **`FormGrid`** — `display: grid; grid-template-columns: 1fr 1fr; gap: 16px` on wide viewports,
  single column on narrow (`@media (max-width: 600px)`).
- **`FieldGroup`** — vertical stack of label + input + optional error text.
- **`Label`** — `styled.label`, sans-serif, `0.85rem`, `#6b6258`.
- **`Input`** — `styled.input`, `border: 1px solid #e4ddd2`, `border-radius: 8px`,
  `padding: 10px 12px`, focus ring as above.
- **`ErrorText`** — `styled.p`, `color: #c0392b`, `font-size: 0.85rem`, `margin: 4px 0 0`.
- **`SuccessBanner`** — `styled.div`, soft green tint (`background: #eaf4ea; color: #2d6a2d`),
  `border-radius: 8px`, `padding: 10px 14px`, `margin-bottom: 20px`.
- **`SaveButton`** — matches the `Action` button from `SpaceDesignOptionsPage`.
- **`ReadOnlyValue`** — `styled.p`, muted color, used to display the non-editable email.

---

## Correctness Properties

### Property 1: Profile link visibility matches sign-in state

The Navbar SHALL render the Profile link if and only if `isSignedIn` is `true`.

**Validates: Requirements 1.1, 1.2**

---

### Property 2: Name validation guards the store

Submitting the form with a non-empty name SHALL update the store. Submitting with an empty name SHALL NOT update the store and SHALL display a validation error.

**Validates: Requirements 4.4, 4.6**

---

### Property 3: Email is never overwritten

`updateProfile` SHALL preserve the current `email` value in the store regardless of what values are submitted via the form.

**Validates: Requirements 3.1, 4.2**

---

## Error Handling

- If the name field is empty on submit, a validation error message is shown next to the field and the store is not updated.
- No other error states are in scope for this version.

---

## Testing Strategy

- Manual verification: confirm the Profile link appears in the navbar, navigates to `/profile`, the form saves data to the store, and the name validation error displays correctly.
- No automated tests are required for this initial implementation.
