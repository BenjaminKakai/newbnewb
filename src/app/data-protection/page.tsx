// app/data-protection/page.tsx

import { LoginPageWithPhone } from '@/features/auth/components/LoginPage'
import DataProtectionPage from '@/features/data-protection/DataProtection'

export default function Login() {
  return <DataProtectionPage />
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Data Protection - WasaaChat',
  description: 'Data Protection Page',
}