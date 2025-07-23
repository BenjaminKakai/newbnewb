// app/privacy-policy/page.tsx
// This is the Next.js App Router page - keeps routing simple and clean

import PrivacyPolicyPage from '@/features/privacy-policy/PrivacyPolicy'

export default function Login() {
  return <PrivacyPolicyPage />
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Privacy Policy - WasaaChat',
  description: 'Privcy Policy Page',
}