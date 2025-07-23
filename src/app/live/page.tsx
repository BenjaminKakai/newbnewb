// app/otp/page.tsx

import { OTPVerificationPage } from "@/features/auth/components/OtpPage"

export default function OTP() {
  return <OTPVerificationPage />
}

export const metadata = {
  title: 'Live - WasaaChat',
  description: 'Live page for WasaaChat',
}