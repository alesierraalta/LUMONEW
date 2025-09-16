import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createClient } from '@/lib/supabase/server-with-retry'
import { validateCSRFToken } from '@/lib/security/csrf'
import { Logger } from '@/lib/utils/logger'
import { EnvironmentConfig } from '@/lib/config/environment'

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing)

// Define route permissions
const routePermissions: Record<string, { roles?: string[], permissions?: string[] }> = {
  '/api/users': { roles: ['admin'], permissions: ['manage_users'] },
  '/api/users/create': { roles: ['admin'], permissions: ['users.create'] },
  '/users/create': { roles: ['admin'], permissions: ['users.create'] },
  '/admin': { roles: ['admin'] },
  '/dashboard': { roles: ['user', 'moderator', 'admin'] }
}

// Get user permissions based on role
function getUserPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    user: ['read_profile', 'update_profile'],
    moderator: ['read_profile', 'update_profile', 'moderate_content', 'manage_posts'],
    admin: [
      'read_profile', 
      'update_profile', 
      'manage_users', 
      'manage_roles', 
      'system_admin',
      'users.create',
      'users.edit',
      'users.delete',
      'roles.manage'
    ]
  }
  
  return rolePermissions[role] || rolePermissions.user
}

// Check if user has required permissions for a route
function hasRouteAccess(userRole: string, userPermissions: string[], routePath: string): boolean {
  const routeConfig = routePermissions[routePath]
  if (!routeConfig) return true // No restrictions
  
  // Check role requirement
  if (routeConfig.roles && !routeConfig.roles.includes(userRole)) {
    // Admin can access any role-restricted route
    if (userRole !== 'admin') {
      return false
    }
  }
  
  // Check permission requirement
  if (routeConfig.permissions) {
    const hasAllPermissions = routeConfig.permissions.every(permission => 
      userPermissions.includes(permission)
    )
    if (!hasAllPermissions) {
      return false
    }
  }
  
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/admin-signup',
    '/api/auth/callback',
    '/api/health'
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Skip auth check for static files and certain system routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Handle auth routes without i18n middleware
  if (pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // For non-public routes, check authentication
  if (!isPublicRoute) {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      // If there's an error getting the session, handle appropriately
      if (error) {
        Logger.warn('Middleware auth check error:', error.message)
        
        // Handle API routes differently
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 401 }
          )
        }
        
        // For web routes, allow client-side to handle auth
        return intlMiddleware(request)
      }

      if (!user) {
        // Handle API routes differently
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          )
        }
        
        // Only redirect if we're sure there's no session
        const isAlreadyRedirecting = request.headers.get('referer')?.includes('/auth/login')
        
        if (!isAlreadyRedirecting) {
          const loginUrl = new URL('/auth/login', request.url)
          loginUrl.searchParams.set('redirectTo', pathname)
          return NextResponse.redirect(loginUrl)
        }
        
        // If already redirecting, let it continue to prevent loops
        return intlMiddleware(request)
      }

      // Check role-based access for protected routes
      const userRole = user.user_metadata?.role || 'user'
      const userPermissions = getUserPermissions(userRole)
      
      // Check if user has access to this specific route
      if (!hasRouteAccess(userRole, userPermissions, pathname)) {
        // Handle API routes differently
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
        
        const unauthorizedUrl = new URL('/unauthorized', request.url)
        return NextResponse.redirect(unauthorizedUrl)
      }

      // CSRF Protection for state-changing API requests
      const isStateChangingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
      const isApiRoute = pathname.startsWith('/api/')
      const isCSRFExempt = pathname === '/api/csrf-token' || pathname === '/api/auth/callback'
      
      if (isStateChangingRequest && isApiRoute && !isCSRFExempt) {
        const isCSRFValid = validateCSRFToken(request)
        
        if (!isCSRFValid) {
          Logger.security('CSRF validation failed for:', {
            method: request.method,
            pathname,
            ip: request.ip || 'unknown',
            userAgent: request.headers.get('user-agent')
          })
          
          return NextResponse.json(
            { 
              error: 'CSRF token validation failed',
              code: 'CSRF_INVALID'
            },
            { status: 403 }
          )
        }
      }

      // Add security headers and user info for authenticated requests
      const response = pathname.startsWith('/api/') ? NextResponse.next() : intlMiddleware(request)
      
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      // Enhanced security headers
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://hnbtninlyzpdemyudaqg.supabase.co https://heteecppghdkkzgrbdko.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
      
      response.headers.set('Content-Security-Policy', csp)
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      
      // Add user info to headers for API routes (for logging/audit)
      if (pathname.startsWith('/api/')) {
        response.headers.set('X-User-ID', user.id)
        response.headers.set('X-User-Role', userRole)
      }
      
      return response
    } catch (error) {
      Logger.error('Middleware error:', error)
      
      // Handle API routes differently
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Internal authentication error' },
          { status: 500 }
        )
      }
      
      // On error, let the request continue and handle auth client-side
      return intlMiddleware(request)
    }
  }

  // For public routes, add security headers and continue
  const response = pathname.startsWith('/api/') ? NextResponse.next() : intlMiddleware(request)
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}