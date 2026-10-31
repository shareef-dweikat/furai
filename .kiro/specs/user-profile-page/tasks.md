# Implementation Plan: User Profile Page

## Overview

Implement the User Profile Page feature across five discrete steps: the Zustand store first,
then the form and page components, then the navbar update and routing change.

The implementation touches exactly five files in `apps/web/src`:

1. `stores/use-profile-store.ts` — new
2. `components/ProfileForm.tsx` — new
3. `pages/ProfilePage.tsx` — new
4. `components/Navbar.tsx` — modified
5. `App.tsx` — modified

---

## Tasks

- [x] 1. Create `use-profile-store.ts`
  - [x] 1.1 Create `apps/web/src/stores/use-profile-store.ts`
    - Export the `Address`, `PaymentMethod`, `UserProfile`, and `ProfileFormValues` TypeScript
      interfaces as defined in the design's Data Models section.
    - Export `useProfileStore` using a plain `create<ProfileState>()` call — no `persist`
      middleware — matching the pattern used by `use-app-store.ts`.
    - Initialise `profile` with empty strings for all fields and hardcode `isSignedIn: true`.
    - Implement `updateProfile(values: ProfileFormValues)` to spread the submitted values while
      preserving the existing `email` from store state.
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.4_

- [x] 2. Create `ProfileForm.tsx`
  - [x] 2.1 Create `apps/web/src/components/ProfileForm.tsx`
    - Define and export `ProfileFormProps` (`initialValues: UserProfile`,
      `onSave: (values: ProfileFormValues) => void`).
    - Own draft state initialised from `initialValues` and a `nameError` string state.
    - Render nine editable `<input>` fields — name, street, city, state, zip code, cardholder
      name, card number, expiry date, CVV — each wrapped in a `FieldGroup` with a `Label`,
      `Input`, and optional `ErrorText`.
    - On submit: if `draft.name.trim()` is empty, set `nameError` and return without calling
      `onSave`; otherwise call `onSave(draft)` and clear `nameError`.
    - All inputs must have `id` / `htmlFor` associations; the error paragraph must be linked via
      `aria-describedby`.
    - Apply styled components (`FormGrid`, `FieldGroup`, `Label`, `Input`, `ErrorText`,
      `SaveButton`) following the design conventions.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

- [x] 3. Create `ProfilePage.tsx`
  - [x] 3.1 Create `apps/web/src/pages/ProfilePage.tsx`
    - Import `useProfileStore` and read `profile` and `updateProfile` via selectors.
    - Wrap the page in `<Page title="Profile" />` — same pattern as `CartPage`.
    - Display the email address as a read-only `<p>` (using a `ReadOnlyValue` styled component)
      above the form; it must not be editable.
    - Pass `profile` as `initialValues` and an `onSave` handler to `ProfileForm`.
    - The `onSave` handler calls `updateProfile`, sets local `saved` state to `true`, then clears
      it after 3 seconds via `setTimeout`.
    - Render a `SuccessBanner` with `role="status"` while `saved` is `true`.
    - _Requirements: 3.1, 3.2, 4.2, 4.4, 4.5_

- [x] 4. Modify `Navbar.tsx`
  - [x] 4.1 Modify `apps/web/src/components/Navbar.tsx`
    - Import `useProfileStore` and read `isSignedIn` via a selector alongside the existing
      `useCartStore` call.
    - Replace the static `navItems` constant with a derived list: keep all existing items and
      conditionally append `{ to: '/profile', label: 'Profile' }` when `isSignedIn` is `true`.
    - The Profile `<Tab>` must use the same styled component and `end` prop as the other tabs so
      the existing active-link CSS rule applies automatically.
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Modify `App.tsx`
  - [x] 5.1 Modify `apps/web/src/App.tsx`
    - Import `ProfilePage` from `./pages/ProfilePage.tsx`.
    - Add `<Route path="profile" element={<ProfilePage />} />` inside `<Routes>`, alongside the
      existing page routes.
    - _Requirements: 2.1, 2.2_

---

## Notes

- Each task references the specific requirements it satisfies for traceability.
- Tasks 2 and 3 can be built in parallel once Task 1 is complete.
- Tasks 4 and 5 can be built in parallel once Tasks 2 and 3 are complete.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["4.1", "5.1"] }
  ]
}
```
