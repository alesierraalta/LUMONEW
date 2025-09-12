import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

interface CSRFTokenData {
  token: string
  timestamp: number
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Create CSRF token with timestamp
 */
export function createCSRFTokenData(): CSRFTokenData {
  return {
    token: generateCSRFToken(),
    timestamp: Date.now()
  }
}

/**
 * Set CSRF token in cookies
 */
export function setCSRFToken(): string {
  const tokenData = createCSRFTokenData()
  const tokenString = JSON.stringify(tokenData)
  const encodedToken = Buffer.from(tokenString).toString('base64')
  
  const cookieStore = cookies()
  cookieStore.set(CSRF_COOKIE_NAME, encodedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY / 1000,
    path: '/'
  })
  
  return tokenData.token
}

/**
 * Get CSRF token from cookies
 */
export function getCSRFTokenFromCookies(): CSRFTokenData | null {
  try {
    const cookieStore = cookies()
    const encodedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value
    
    if (!encodedToken) {
      return null
    }
    
    const tokenString = Buffer.from(encodedToken, 'base64').toString('utf-8')
    const tokenData: CSRFTokenData = JSON.parse(tokenString)
    
    // Check if token is expired
    if (Date.now() - tokenData.timestamp > TOKEN_EXPIRY) {
      return null
    }
    
    return tokenData
  } catch (error) {
    console.error('Error parsing CSRF token from cookies:', error)
    return null
  }
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest): boolean {
  try {
    // Get token from header or form data
    const headerToken = request.headers.get(CSRF_HEADER_NAME)
    let formToken: string | null = null
    
    // Try to get token from form data for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        // For form submissions, we'll need to parse the body
        // This is handled in the middleware or route handler
      }
    }
    
    const submittedToken = headerToken || formToken
    
    if (!submittedToken) {
      console.warn('CSRF validation failed: No token provided')
      return false
    }
    
    // Get stored token from cookies
    const storedTokenData = getCSRFTokenFromCookies()
    
    if (!storedTokenData) {
      console.warn('CSRF validation failed: No stored token found')
      return false
    }
    
    // Compare tokens using constant-time comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(submittedToken, 'hex'),
      Buffer.from(storedTokenData.token, 'hex')
    )
    
    if (!isValid) {
      console.warn('CSRF validation failed: Token mismatch')
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * Middleware function to check CSRF token for state-changing requests
 */
export function withCSRFProtection(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    // Only check CSRF for state-changing methods
    const methodsToProtect = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    if (methodsToProtect.includes(request.method)) {
      const isValid = validateCSRFToken(request)
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ 
            error: 'CSRF token validation failed',
            code: 'CSRF_INVALID'
          }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }
    
    return handler(request, ...args)
  }
}

/**
 * Get CSRF token for client-side use
 */
export function getCSRFTokenForClient(): string | null {
  const tokenData = getCSRFTokenFromCookies()
  return tokenData?.token || null
}

/**
 * Generate new CSRF token and return it
 */
export function refreshCSRFToken(): string {
  return setCSRFToken()
}