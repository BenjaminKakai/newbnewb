// components/TokenSync.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function TokenSync() {
  const { accessToken, refreshToken, verifyOtp } = useAuthStore();

  useEffect(() => {
    // Sync tokens from localStorage to cookies on mount
    const syncTokensToCookies = () => {
      const storedAccessToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');

      if (storedAccessToken) {
        document.cookie = `access_token=${storedAccessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      if (storedRefreshToken) {
        document.cookie = `refresh_token=${storedRefreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }
    };

    // Check for new tokens from middleware refresh
    const checkForNewTokens = () => {
      const newAccessToken = document.querySelector('meta[name="x-new-access-token"]')?.getAttribute('content');
      const newRefreshToken = document.querySelector('meta[name="x-new-refresh-token"]')?.getAttribute('content');

      if (newAccessToken && newRefreshToken) {
        // Update localStorage
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        
        // Update Zustand store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          verifyOtp({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: currentUser
          });
        }

        // Remove meta tags
        document.querySelector('meta[name="x-new-access-token"]')?.remove();
        document.querySelector('meta[name="x-new-refresh-token"]')?.remove();
      }
    };

    syncTokensToCookies();
    checkForNewTokens();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        syncTokensToCookies();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accessToken, refreshToken, verifyOtp]);

  // Handle response headers for token refresh
  useEffect(() => {
    const handleResponse = (response: Response) => {
      const newAccessToken = response.headers.get('x-new-access-token');
      const newRefreshToken = response.headers.get('x-new-refresh-token');

      if (newAccessToken && newRefreshToken) {
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        
        // Sync to cookies
        document.cookie = `access_token=${newAccessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `refresh_token=${newRefreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        
        // Update store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          verifyOtp({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: currentUser
          });
        }
      }
    };

    // Intercept fetch requests to handle token refresh headers
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      handleResponse(response);
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [verifyOtp]);

  return null; // This component doesn't render anything
}

// Add this to your root layout or _app.tsx
export default TokenSync;