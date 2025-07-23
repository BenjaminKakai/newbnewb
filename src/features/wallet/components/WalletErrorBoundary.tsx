// components/wallet/WalletErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class WalletErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Wallet Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to a logging service like Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data')!).id : null,
    };

    console.log('Error report:', errorReport);
    
    // Example: Send to monitoring service
    // sendToMonitoringService(errorReport);
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      // After 3 retries, suggest page reload
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleGoToChat = () => {
    window.location.href = '/chat';
  };

  private getErrorMessage = (error: Error | null): string => {
    if (!error) return 'An unexpected error occurred';

    // Provide user-friendly error messages
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Unable to connect to our servers. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (error.message.includes('Forbidden') || error.message.includes('403')) {
      return 'You do not have permission to access this feature.';
    }
    
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    if (error.message.includes('Internal Server Error') || error.message.includes('500')) {
      return 'Our servers are experiencing issues. Please try again later.';
    }

    // For wallet-specific errors
    if (error.message.includes('Insufficient funds')) {
      return 'You do not have enough balance to complete this transaction.';
    }
    
    if (error.message.includes('Transaction failed')) {
      return 'Your transaction could not be processed. Please try again.';
    }

    return 'Something went wrong. Our team has been notified and is working to fix this issue.';
  };

  private renderErrorUI = () => {
    const { error, retryCount } = this.state;
    const errorMessage = this.getErrorMessage(error);
    const canRetry = retryCount < 3;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {errorMessage}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {canRetry ? (
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              
              <button
                onClick={this.handleGoToChat}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              Need help? Contact our support team
            </p>
            <a
              href="mailto:support@wasaachat.com"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              support@wasaachat.com
            </a>
          </div>

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details (Development Only)
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono whitespace-pre-wrap">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong> {error.stack}
                </div>
                {this.state.errorInfo && (
                  <div>
                    <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || this.renderErrorUI();
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withWalletErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <WalletErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </WalletErrorBoundary>
  );

  WrappedComponent.displayName = `withWalletErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for programmatic error handling
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // You can also dispatch to error reporting service here
    // or show toast notifications
    
    // For critical wallet errors, you might want to:
    // - Clear sensitive data
    // - Log out the user
    // - Redirect to a safe page
    
    if (error.message.includes('Unauthorized') || error.message.includes('403')) {
      // Handle auth errors
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
  };

  return { handleError };
};

// Custom error classes for different wallet scenarios
export class WalletError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'WalletError';
  }
}

export class TransactionError extends Error {
  constructor(message: string, public transactionId?: string, public details?: any) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export default WalletErrorBoundary;