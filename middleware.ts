// middleware.ts (place this at project root, same level as src/ folder)
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/chat', '/wallet', '/settings', '/calls', '/feeds'];

async function refreshToken(refreshTokenValue: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue,
        source: 'web',
        user_type: 'client',
      }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    // Check if token expires within the next 5 minutes
    return payload.exp < (currentTime + 300);
  } catch (error) {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and non-protected routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshTokenValue = request.cookies.get('refresh_token')?.value;

  // No tokens available, redirect to login
  if (!accessToken && !refreshTokenValue) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if access token is valid
  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  // Try to refresh token if access token is expired
  if (refreshTokenValue) {
    const refreshResponse = await refreshToken(refreshTokenValue);
    
    if (refreshResponse && refreshResponse.tokens) {
      // Create response and set new tokens
      const response = NextResponse.next();
      
      // Set new tokens in cookies
      response.cookies.set('access_token', refreshResponse.tokens.access_token, {
        httpOnly: false, // Allow JavaScript access for client-side store
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      response.cookies.set('refresh_token', refreshResponse.tokens.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }
  }

  // No valid tokens, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};