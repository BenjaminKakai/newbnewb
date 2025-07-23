// app/otp/page.tsx

import { OTPVerificationPage } from "@/features/auth/components/OtpPage"

export default function OTP() {
  return <OTPVerificationPage />
}

export const metadata = {
  title: 'Verify OTP - WasaaChat',
  description: 'Enter the verification code sent to your phone',
}