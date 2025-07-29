"use client";
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface VerificationStatus {
  hasToken: boolean;
  hasUserId: boolean;
  isAuthenticated: boolean;
  tokenLength: number;
  tokenPreview: string;
}

const AuthVerificationComponent: React.FC = () => {
  // Use the Zustand hook directly - this is the correct way
  const { user, accessToken, isAuthenticated } = useAuthStore();
  
  const [status, setStatus] = useState<VerificationStatus>({
    hasToken: false,
    hasUserId: false,
    isAuthenticated: false,
    tokenLength: 0,
    tokenPreview: ''
  });

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Use the hook values directly - no getState() needed
        const userId = user?.id;

        setStatus({
          hasToken: !!accessToken,
          hasUserId: !!userId,
          isAuthenticated: !!isAuthenticated,
          tokenLength: accessToken ? accessToken.length : 0,
          tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : 'No token'
        });

        console.log('🔍 Auth Verification:', {
          hasToken: !!accessToken,
          hasUserId: !!userId,
          isAuthenticated: !!isAuthenticated,
          userId: userId,
          tokenLength: accessToken ? accessToken.length : 0,
          tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : 'No token'
        });
      } catch (error) {
        console.error('❌ Auth verification error:', error);
        setStatus({
          hasToken: false,
          hasUserId: false,
          isAuthenticated: false,
          tokenLength: 0,
          tokenPreview: 'Error checking auth'
        });
      }
    };

    checkAuth();
    
    // Check auth every 5 seconds
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [accessToken, user?.id, isAuthenticated]); // Dependencies are the actual values

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 z-50"
      >
        Show Auth Status
      </button>
    );
  }

  const getStatusIcon = (condition: boolean) => condition ? '✅' : '❌';
  const getStatusColor = (condition: boolean) => condition ? 'text-green-600' : 'text-red-600';

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">🔐 Auth Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 ${getStatusColor(status.hasToken)}`}>
          <span>{getStatusIcon(status.hasToken)}</span>
          <span>Access Token: {status.hasToken ? 'Present' : 'Missing'}</span>
        </div>
        
        <div className={`flex items-center gap-2 ${getStatusColor(status.hasUserId)}`}>
          <span>{getStatusIcon(status.hasUserId)}</span>
          <span>User ID: {status.hasUserId ? 'Present' : 'Missing'}</span>
        </div>
        
        <div className={`flex items-center gap-2 ${getStatusColor(status.isAuthenticated)}`}>
          <span>{getStatusIcon(status.isAuthenticated)}</span>
          <span>Authenticated: {status.isAuthenticated ? 'Yes' : 'No'}</span>
        </div>
        
        {status.hasToken && (
          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
            <div>Token Length: {status.tokenLength}</div>
            <div className="font-mono">Preview: {status.tokenPreview}</div>
          </div>
        )}

        {/* Debug info for troubleshooting */}
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
          <div>User ID: {user?.id || 'None'}</div>
          <div>User Name: {user?.name || user?.firstName || 'None'}</div>
          <div>Phone: {user?.phone || 'None'}</div>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          Updates every 5s
        </div>
      </div>
    </div>
  );
};

export default AuthVerificationComponent;