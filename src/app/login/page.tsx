// app/login/page.tsx
// This is the Next.js App Router page - keeps routing simple and clean

import { LoginPageWithPhone } from '@/features/auth/components/LoginPage'

export default function Login() {
  return <LoginPageWithPhone />
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'Login - WasaaChat',
  description: 'Sign in to your WasaaChat account',
}