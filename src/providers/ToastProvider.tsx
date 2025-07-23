// components/providers/ToastProvider.tsx
"use client";

import React from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

interface ToastProviderProps {
  children: React.ReactNode;
}

// Define custom toast style options interface
interface CustomToastOptions extends Partial<ToastOptions> {
  style?: React.CSSProperties;
  iconTheme?: {
    primary: string;
    secondary: string;
  };
}

// Define promise messages interface
interface PromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            maxWidth: '500px',
          },

          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#088EF9',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#088EF9',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#EF4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
          loading: {
            style: {
              background: '#3B82F6',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#3B82F6',
            },
          },
        }}
      />
    </>
  );
};

// Custom toast functions with consistent styling
export const showToast = {
  success: (message: string, options?: CustomToastOptions) => {
    return toast.success(message, {
      style: {
        background: '#088EF9',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#088EF9',
      },
      ...options,
    });
  },

  error: (message: string, options?: CustomToastOptions) => {
    return toast.error(message, {
      style: {
        background: '#EF4444',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#EF4444',
      },
      ...options,
    });
  },

  loading: (message: string, options?: CustomToastOptions) => {
    return toast.loading(message, {
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#3B82F6',
      },
      ...options,
    });
  },

  info: (message: string, options?: CustomToastOptions) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
      ...options,
    });
  },

  warning: (message: string, options?: CustomToastOptions) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
      },
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: PromiseMessages<T>,
    options?: CustomToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading: msgs.loading,
        success: msgs.success,
        error: msgs.error,
      },
      {
        style: {
          minWidth: '250px',
        },
        success: {
          duration: 3000,
          style: {
            background: '#088EF9',
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        },
        loading: {
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        },
        ...options,
      }
    );
  },
};