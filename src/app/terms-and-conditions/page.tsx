// app/privacy-policy/page.tsx
// This is the Next.js App Router page - keeps routing simple and clean

import TermsConditionsPage from '@/features/terms-and-conditions/Terms&Conditions'

export default function Login() {
  return <TermsConditionsPage />
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Terms and Conditions - WasaaChat',
  description: 'Terms and Conditions Page',
}