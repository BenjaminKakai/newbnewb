// hooks/useTokenSync.ts
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useTokenSync() {
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Function to set cookies
    const setCookie = (name: string, value: string, days: number) => {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    };

    // Function to delete cookies
    const deleteCookie = (name: string) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    };

    if (isAuthenticated && accessToken) {
      // Sync tokens from store to cookies
      setCookie('access_token', accessToken, 7); // 7 days
      if (refreshToken) {
        setCookie('refresh_token', refreshToken, 30); // 30 days
      }
    } else {
      // Clear cookies if not authenticated
      deleteCookie('access_token');
      deleteCookie('refresh_token');
    }
  }, [accessToken, refreshToken, isAuthenticated]);

  // Sync tokens from localStorage to store on page load
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUserData = localStorage.getItem('user_data');

    if (storedAccessToken && storedUserData && !isAuthenticated) {
      try {
        const userData = JSON.parse(storedUserData);
        useAuthStore.getState().verifyOtp({
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken || '',
          user: userData
        });
      } catch (error) {
        console.warn('Failed to restore auth state:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
    }
  }, [isAuthenticated]);
}