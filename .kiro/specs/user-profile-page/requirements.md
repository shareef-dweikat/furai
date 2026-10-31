# Requirements Document

## Introduction

This feature adds a User Profile Page to the Furai web app. Users can view and edit their personal information — name, email, address, and payment method — from a dedicated profile page. A "Profile" button in the navbar navigates to this page. Authentication is not yet implemented, so `isSignedIn` is hardcoded to `true`. Profile data is held in a Zustand store (in-memory only for now).

## Glossary

- **Navbar**: The top navigation bar rendered by the `Navbar` component on every page of the app.
- **Profile_Page**: The `/profile` route and its corresponding `ProfilePage` React component.
- **Profile_Store**: The Zustand store that holds and manages the user's profile data in memory.
- **Profile_Form**: The form rendered on the Profile_Page that displays and allows editing of profile fields.
- **UserProfile**: The data object containing a user's `name`, `email`, `address`, and `paymentMethod` fields. The `email` field is read-only and cannot be edited.
- **isSignedIn**: A boolean flag in the Profile_Store hardcoded to `true` until authentication is implemented.
- **Address**: A structured value consisting of `street`, `city`, `state`, and `zipCode` string fields.
- **PaymentMethod**: A structured value consisting of `cardholderName`, `cardNumber`, `expiryDate`, and `cvv` string fields.

## Requirements

### Requirement 1: Profile Navbar Button

**User Story:** As a signed-in user, I want a Profile button in the navbar, so that I can quickly navigate to my profile page from anywhere in the app.

#### Acceptance Criteria

1. WHILE `isSignedIn` is `true`, THE Navbar SHALL render a navigation link labelled "Profile" that navigates to `/profile`.
2. WHILE `isSignedIn` is `false`, THE Navbar SHALL NOT render the Profile navigation link.
3. WHEN the "Profile" link is the active route, THE Navbar SHALL apply the same active link visual indicator that it applies to other navigation links.

---

### Requirement 2: Profile Page Route

**User Story:** As a user, I want a dedicated profile page at a stable URL, so that I can navigate directly to it.

#### Acceptance Criteria

1. THE App SHALL register a route at the path `/profile` that renders the Profile_Page component.
2. WHEN a user navigates to `/profile`, THE Profile_Page SHALL render with the Navbar visible and the Shell layout wrapping the page content.

---

### Requirement 3: View Profile Information

**User Story:** As a signed-in user, I want to see my current profile information on the profile page, so that I can verify what the app has on file for me.

#### Acceptance Criteria

1. WHEN the Profile_Page mounts, THE Profile_Page SHALL read the current UserProfile from the Profile_Store and display name, email (read-only), address, and payment method.
2. THE Profile_Store SHALL initialise the UserProfile with empty strings for all fields so that the Profile_Page renders without errors when no profile data has been saved yet.

---

### Requirement 4: Edit Profile Information

**User Story:** As a signed-in user, I want to edit my profile details and save them, so that my name, address, and payment method stay up to date.

#### Acceptance Criteria

1. THE Profile_Page SHALL provide a Profile_Form containing labelled input fields for: name, street, city, state, zip code, cardholder name, card number, expiry date, and CVV.
2. THE Profile_Page SHALL display the email address as a read-only text value that cannot be edited.
3. WHEN a user modifies a field in the Profile_Form, THE Profile_Form SHALL reflect the updated value immediately.
4. WHEN a user submits the Profile_Form and the name field is not empty, THE Profile_Store SHALL update the stored UserProfile with the submitted field values.
5. WHEN the Profile_Form is submitted successfully, THE Profile_Page SHALL display a confirmation message indicating the profile was saved.
6. IF the name field is empty when the Profile_Form is submitted, THEN THE Profile_Form SHALL display a validation error for the name field and SHALL NOT update the Profile_Store.
