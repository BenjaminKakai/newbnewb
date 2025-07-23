"use client";

import React from "react";
import { GlobeIcon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <>
      {/* <section className="px-6 md:px-24 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl font-medium mb-4 md:mb-0">
            <img
              className="w-40 inline-block mr-2"
              src={isDarkMode ? "/dark-logo-white.svg" : "/dark-logo-full.svg"}
              alt="WasaaChat logo icon"
            />
            <p>Chat. Connect. Transact.</p>
          </div>
          <div className="space-x-4 w-full md:w-auto">
            <p className="mb-4">
              Stay updated on new features and community events.
            </p>
            <div className="relative w-full">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-full border w-full pr-20 text-[var(--foreground)] bg-[var(--background)]"
              />
              <button className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#2A8FEA] hover:bg-[#2A8FEA] text-white font-semibold px-4 py-2 rounded-full">
                Submit
              </button>
            </div>
          </div>
        </div>
      </section> */}


      <section className="bg-[#0B1C39] text-white px-6 md:px-24 py-2">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center text-xs text-gray-300">
            2025 All rights reserved
          </div>
          <div className="flex flex-wrap text-xs space-x-8 md:mb-0">
            <a
              href="#"
              className="hover:underline pr-2 mr-1 relative after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-2 after:w-px after:bg-white"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:underline pr-2 mr-1 relative after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-2 after:w-px after:bg-white"
            >
              Terms of Service
            </a>
            <a href="#" className="hover:underline">
              Help Center
            </a>
            <div className="relative flex items-center space-x-6">
              <GlobeIcon className="absolute pl-2 w-4 h-4" />
              <select className="bg-[#0B1C39] pl-4 text-white border border-white px-2 rounded-full">
                <option>English</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};