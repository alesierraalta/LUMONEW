import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createClient } from '@/lib/supabase/server-with-retry'

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/admin-signup'
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Skip auth check for API routes, static files, and auth routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.') ||
    pathname.startsWith('/auth')
  ) {
    // For auth routes, don't apply i18n middleware to avoid locale prefixes
    if (pathname.startsWith('/auth')) {
      return NextResponse.next()
    }
    return intlMiddleware(request)
  }

  // Check authentication for protected routes with improved error handling
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    // If there's an error getting the session, log it but don't redirect immediately
    if (error) {
      console.warn('Middleware auth check error:', error.message)
      // Allow the request to continue and let client-side handle auth
      return intlMiddleware(request)
    }

    if (!session) {
      // Only redirect if we're sure there's no session
      // Add a check to prevent redirect loops
      const isAlreadyRedirecting = request.headers.get('referer')?.includes('/auth/login')
      
      if (!isAlreadyRedirecting) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }
      
      // If already redirecting, let it continue to prevent loops
      return intlMiddleware(request)
    }

    // User is authenticated, continue with i18n middleware
    return intlMiddleware(request)
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, let the request continue and handle auth client-side
    // This prevents the app from breaking due to middleware issues
    return intlMiddleware(request)
  }
} = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/admin-signup'
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Skip auth check for API routes, static files, and auth routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.') ||
    pathname.startsWith('/auth')
  ) {
    // For auth routes, don't apply i18n middleware to avoid locale prefixes
    if (pathname.startsWith('/auth')) {
      return NextResponse.next()
    }
    return intlMiddleware(request)
  }

  // Check authentication for protected routes
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // Redirect to login with the current path as redirect parameter
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // User is authenticated, continue with i18n middleware
    return intlMiddleware(request)
  } catch (error) {
    // If there's an error checking auth, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
}