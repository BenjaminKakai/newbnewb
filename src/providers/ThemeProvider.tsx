"use client";

import React, { createContext, useContext, useState, useLayoutEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return savedTheme === "dark" || (!savedTheme && prefersDark);
    }
    return false; // Default to light theme on server
  });

  useLayoutEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  const applyTheme = (isDark: boolean) => {
    document.documentElement.style.setProperty(
      "--background",
      isDark ? "#292929" : "#ffffff"
    );
    document.documentElement.style.setProperty(
      "--foreground",
      isDark ? "#ededed" : "#171717"
    );
    document.documentElement.classList.toggle("dark", isDark);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  // Apply theme immediately on initial client-side render
  if (typeof window !== "undefined") {
    applyTheme(isDarkMode);
  }

  return (
    <>
      {/* Inline script to apply theme from localStorage before render */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'dark' || (!theme && prefersDark);
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.setProperty('--background', isDark ? '#292929' : '#ffffff');
                document.documentElement.style.setProperty('--foreground', isDark ? '#ededed' : '#171717');
              } catch (e) {
                console.error('Failed to apply theme from localStorage:', e);
              }
            })();
          `,
        }}
      />
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    </>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};