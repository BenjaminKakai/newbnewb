// components/ThemeInitializer.tsx
"use client";

import { useEffect } from "react";

export const ThemeInitializer = () => {
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = savedTheme === "dark" || (!savedTheme && prefersDark);

      // Apply dark class and CSS variables
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.setProperty(
        "--background",
        isDark ? "#292929" : "#ffffff"
      );
      document.documentElement.style.setProperty(
        "--foreground",
        isDark ? "#ededed" : "#171717"
      );
    } catch (e) {
      console.error("Theme initialization failed", e);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // No DOM output
};