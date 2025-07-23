// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = "http://138.68.190.213:3010";
const API_KEY = "QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==";

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/chat', '/calls', '/settings', '/wallet'];

// Helper function to check if token is expired (basic JWT check)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse it, consider it expired
  }
}

// Function to refresh access token
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        source: 'web',
        user_type: 'client'
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken
    };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get tokens from cookies (Next.js middleware can't access localStorage)
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // If no access token, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if access token is expired
  if (isTokenExpired(accessToken)) {
    // Try to refresh the token
    if (refreshToken) {
      const newTokens = await refreshAccessToken(refreshToken);
      
      if (newTokens) {
        // Create response and set new cookies
        const response = NextResponse.next();
        response.cookies.set('access_token', newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });
        response.cookies.set('refresh_token', newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        });
        
        // Set headers for client-side to update localStorage
        response.headers.set('x-new-access-token', newTokens.accessToken);
        response.headers.set('x-new-refresh-token', newTokens.refreshToken);
        
        return response;
      }
    }
    
    // Refresh failed, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    
    // Clear invalid cookies
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    
    return response;
  }

  // Token is valid, proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};