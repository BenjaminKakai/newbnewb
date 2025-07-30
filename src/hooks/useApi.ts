// hooks/useApi.ts
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export const useApi = () => {
  const { getAuthHeaders, refreshTokens, logoutLocal } = useAuthStore();
  const router = useRouter();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    let headers = getAuthHeaders();
    
    const makeRequest = async (requestHeaders: Record<string, string>) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...requestHeaders,
          ...options.headers,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        try {
          const refreshSuccess = await refreshTokens();
          
          if (refreshSuccess) {
            // Retry with new token
            const newHeaders = getAuthHeaders();
            return fetch(url, {
              ...options,
              headers: {
                ...newHeaders,
                ...options.headers,
              },
            });
          } else {
            // Refresh failed, logout and redirect
            logoutLocal();
            router.push('/login');
            throw new Error('Authentication failed');
          }
        } catch (error) {
          logoutLocal();
          router.push('/login');
          throw error;
        }
      }

      return response;
    };

    return makeRequest(headers);
  };

  return { apiCall };
};

// Usage example:
// const { apiCall } = useApi();
// const response = await apiCall('/api/protected-endpoint', { method: 'GET' });