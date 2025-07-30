"use client";

import React from "react";
import { GlobeIcon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <>
      <section className="py-16 px-6 bg-[#F4F5F7]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/dark-logo-full.svg" 
                alt="Blue chat bubble icon logo" 
                className="w-40" 
              />

            </div>
            <p className="text-lg font-medium mb-2">Chat. Connect. Transact.</p>
            <p className="text-sm text-gray-600 mb-4">
              Stay updated on new features and community events.
            </p>
            <div className="flex items-center max-w-md">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-grow px-4 py-2 w-80 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <button className="ml-2 px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600">
                Submit
              </button>
            </div>
          </div>

          {/* Features Column */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Message Privately</li>
              <li>Connect in groups</li>
              <li>Safe Wallet</li>
              <li>Gifts</li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Privacy policy</li>
              <li>Terms & Condition</li>
              <li>Transparency Report</li>
              <li>Report Abuse</li>
            </ul>
          </div>

          {/* Social Column */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Social</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Twitter</li>
              <li>Facebook</li>
              <li>Linkedin</li>
              <li>Instagram</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1C39] text-white px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
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