// components/ThemeInitializer.tsx
"use client";

import Script from "next/script";

export const ThemeInitializer = () => (
  <Script
    id="theme-script"
    strategy="beforeInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var savedTheme = localStorage.getItem('theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
            
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.style.setProperty(
              '--background',
              isDark ? '#292929' : '#ffffff'
            );
            document.documentElement.style.setProperty(
              '--foreground',
              isDark ? '#ededed' : '#171717'
            );
          } catch (e) {
            console.error('Theme initialization failed', e);
          }
        })();
      `,
    }}
  />
);