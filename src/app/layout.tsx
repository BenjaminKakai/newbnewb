// app/layout.tsx
import { Montserrat, Urbanist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import type { Metadata } from "next";
import { ThemeInitializer } from "@/providers/ThemeInitializer";

const montserrat = Urbanist({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "WasaaChat | Secure and reliable free private messaging and calling",
  description:
    "Stay connected with your friends and family on WasaaChat. Share moments, discover trending topics, and join conversations.",
  icons: {
    icon: "/favicon-2.svg",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        <ThemeInitializer />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
