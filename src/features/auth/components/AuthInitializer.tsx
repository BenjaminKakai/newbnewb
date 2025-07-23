// components/auth/AuthInitializer.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useAuthInit } from '@/store/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * AuthInitializer handles auth state restoration and initialization
 * Call this high up in your component tree to ensure auth state is ready
 */
export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state
  useAuthInit();

  useEffect(() => {
    // Set initialized after a brief delay to allow auth state to settle
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Alternative: Hook-based approach for components that need to ensure auth is initialized
export const useAuthInitialized = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useAuthInit();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return isInitialized;
};