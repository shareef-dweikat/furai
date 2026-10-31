import { create } from 'zustand'

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
  isSignedIn: true, // hardcoded until auth is implemented
  updateProfile: (values) =>
    set((state) => ({
      profile: {
        ...values,
        email: state.profile.email, // preserve the read-only email
      },
    })),
}))
