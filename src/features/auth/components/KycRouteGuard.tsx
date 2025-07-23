// components/auth/KycRouteGuard.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore, useKycFlow } from "@/store/authStore";

interface KycRouteGuardProps {
  children: React.ReactNode;
}

/**
 * KycRouteGuard ensures users complete KYC steps in the correct order
 * and redirects them to the appropriate step if they try to skip ahead
 */
export const KycRouteGuard: React.FC<KycRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { getNextKycStep, isKycComplete } = useKycFlow();

  useEffect(() => {
    // Only run KYC checks if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    const nextStep = getNextKycStep();
    const isComplete = isKycComplete();

    // Define KYC-related paths
    const kycPaths = ['/profile/complete', '/profile/verify-id'];
    const isOnKycPath = kycPaths.includes(pathname);
    const isChatPath = pathname === '/chat';

    // If user is on chat page but KYC is not complete, redirect to next step
    if (isChatPath && !isComplete && nextStep) {
      router.push(nextStep);
      return;
    }

    // If user is on KYC path but trying to access wrong step
    if (isOnKycPath && nextStep && pathname !== nextStep) {
      router.push(nextStep);
      return;
    }

    // If user has completed KYC but is still on KYC pages, redirect to chat
    if (isOnKycPath && isComplete) {
      router.push('/chat');
      return;
    }

  }, [isAuthenticated, user, pathname, router, getNextKycStep, isKycComplete]);

  return <>{children}</>;
};

// Higher-order component for protecting routes that require complete KYC
export const withKycProtection = <P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/profile/complete'
) => {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();
    const { isKycComplete } = useKycFlow();

    useEffect(() => {
      if (isAuthenticated && user && !isKycComplete()) {
        router.push(redirectTo);
      }
    }, [isAuthenticated, user, isKycComplete, router]);

    // Show loading state while checking
    if (!isAuthenticated || !user) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    // Only render component if KYC is complete
    if (!isKycComplete()) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

// Hook for KYC status checking in components
export const useKycRedirect = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { getNextKycStep, isKycComplete } = useKycFlow();

  const checkAndRedirect = () => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return false;
    }

    if (!isKycComplete()) {
      const nextStep = getNextKycStep();
      if (nextStep) {
        router.push(nextStep);
        return false;
      }
    }

    return true;
  };

  return {
    checkAndRedirect,
    isKycComplete: isKycComplete(),
    nextStep: getNextKycStep(),
  };
};