"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    setIsDarkMode(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (isMounted) {
      applyTheme(isDarkMode);
    }
  }, [isDarkMode, isMounted]);

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
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};