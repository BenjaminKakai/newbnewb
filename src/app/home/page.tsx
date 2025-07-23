// app/home/page.tsx

import FeedsPage from "@/features/feeds/components/FeedsPage"


export default function Home() {
  return <FeedsPage />
}

// Optional: Add metadata for the page
export const metadata = {
  title: 'WasaaChat | Secure and reliable free private messaging and calling',
  description: 'Stay connected with your friends and family on WasaaChat. Share moments, discover trending topics, and join conversations.',
}