import { NextRequest, NextResponse } from 'next/server'
import { setCSRFToken, getCSRFTokenForClient } from '@/lib/security/csrf'
import { withAuth } from '@/lib/auth/middleware'

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    // Generate and set new CSRF token
    const token = setCSRFToken()
    
    return NextResponse.json({
      token,
      success: true
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    
    return NextResponse.json({
      error: 'Failed to generate CSRF token',
      success: false
    }, {
      status: 500
    })
  }
}

/**
 * Apply authentication middleware
 * Only authenticated users can get CSRF tokens
 */
export const middleware = withAuth({
  requiredPermissions: [], // No specific permissions required, just authentication
  requireAdmin: false
})