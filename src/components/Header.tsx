"use client";

import React, { useState } from "react";
import { Menu, X, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";

export const Header: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center md:px-48 px-4 py-6 backdrop-blur-sm">
        <div className="absolute flex bottom-4 border-b border-[#D1D7DC] px-48 w-[1030px]"></div>
        <img
          src={isDarkMode ? "/dark-logo-white.svg" : "/dark-logo-full.svg"}
          className="w-36"
          alt="WasaaChat logo icon"
        />
        <nav className="hidden md:flex space-x-8 text-md">
          <a href="#" className="hover:text-[#2A8FEA]">
            Features
          </a>
          <a href="#" className="hover:text-[#2A8FEA]">
            FAQ
          </a>
          <a href="#" className="hover:text-[#2A8FEA]">
            Apps
          </a>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 hidden md:block rounded-full cursor-pointer"
            aria-label="Toggle Theme"
          >
            <Sun
              className={`w-5 h-5 ${
                isDarkMode ? "text-white" : "text-gray-500"
              }`}
            />
          </button>
          <div className="hidden md:block">
            <Link
              href="/login"
              className="text-[#2A8FEA] text-sm font-semibold"
            >
              <button className="bg-[#2A8FEA] text-white cursor-pointer px-5 py-2 rounded-full text-sm hover:bg-[#2A8FEA]">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        <button
          className="block md:hidden text-black border border-[#2A8FEA] rounded-lg p-1"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--background)]/50 text-[var(--foreground)] flex justify-end">
          <div className="w-64 h-full bg-[var(--background)] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <img
                src={isDarkMode ? "/dark-logo-white.svg" : "/dark-logo-full.svg"}
                className="w-36"
                alt="WasaaChat logo icon"
              />
              <button onClick={() => setMenuOpen(false)}>
                <X className="w-6 h-6 text-black" />
              </button>
            </div>
            <nav className="flex flex-col space-y-4 text-md">
              <a href="#" className="hover:text-[#2A8FEA]">
                Features
              </a>
              <a href="#" className="hover:text-[#2A8FEA]">
                FAQ
              </a>
              <a href="#" className="hover:text-[#2A8FEA]">
                Apps
              </a>
            </nav>

            <button className="mt-auto bg-[#2A8FEA] text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700">
              Get Started
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 flex mx-auto rounded-full cursor-pointer"
              aria-label="Toggle Theme"
            >
              <Sun
                className={`w-5 h-5 ${
                  isDarkMode ? "text-white" : "text-gray-500"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};