import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-with-retry'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  permissions: string[]
  user_metadata?: {
    role?: string
    [key: string]: any
  }
}

export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  requiredRole?: string
  requiredPermissions?: string[]
}

/**
 * Authentication middleware for API routes
 * Verifies user session and optionally checks roles/permissions
 */
export async function withAuth(
  request: NextRequest,
  options: AuthMiddlewareOptions = { requireAuth: true }
): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    const supabase = createClient()
    
    // Get user from Supabase
    const { data: { user }, error: sessionError } = await supabase.auth.getUser()
    
    if (sessionError) {
      console.error('Session verification error:', sessionError)
      return {
        user: null,
        error: NextResponse.json(
          { success: false, error: 'Authentication failed' },
          { status: 401 }
        )
      }
    }
    
    // Check if authentication is required
    if (options.requireAuth && !user) {
      return {
        user: null,
        error: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
    }
    
    // If no user and auth not required, return null user
    if (!user) {
      return { user: null, error: null }
    }
    
    // Extract user data from user object
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user',
      permissions: getRolePermissions(user.user_metadata?.role || 'user'),
      user_metadata: user.user_metadata
    }
    
    // Check role requirement
    if (options.requiredRole && authenticatedUser.role !== options.requiredRole) {
      // Allow admin to access any role-restricted endpoint
      if (authenticatedUser.role !== 'admin') {
        return {
          user: null,
          error: NextResponse.json(
            { success: false, error: `Access denied. Required role: ${options.requiredRole}` },
            { status: 403 }
          )
        }
      }
    }
    
    // Check permission requirements
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      const hasAllPermissions = options.requiredPermissions.every(permission => 
        authenticatedUser.permissions.includes(permission)
      )
      
      if (!hasAllPermissions) {
        return {
          user: null,
          error: NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }
    }
    
    return { user: authenticatedUser, error: null }
    
  } catch (error) {
    console.error('Auth middleware error:', error)
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Internal authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Get permissions for a given role
 */
function getRolePermissions(role: string): string[] {
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

/**
 * Convenience function to check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
  return user?.role === 'admin'
}

/**
 * Convenience function to check if user has specific permission
 */
export function hasPermission(user: AuthenticatedUser | null, permission: string): boolean {
  return user?.permissions.includes(permission) || false
}