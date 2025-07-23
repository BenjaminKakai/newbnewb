// app/otp/page.tsx

import { ProfileCompletePage } from "@/features/auth/components/kyc/ProfileCompletePage"

export default function OTP() {
  return <ProfileCompletePage />
}

export const metadata = {
  title: 'Complete Profile - WasaaChat',
  description: 'Update Profile Information',
}