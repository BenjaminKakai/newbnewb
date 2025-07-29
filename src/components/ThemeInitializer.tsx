'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {
    // Only run on client side after hydration
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.style.setProperty('--background', '#292929');
      htmlElement.style.setProperty('--foreground', '#ededed');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.removeProperty('--background');
      htmlElement.style.removeProperty('--foreground');
    }
  }, []);

  return null;
}
