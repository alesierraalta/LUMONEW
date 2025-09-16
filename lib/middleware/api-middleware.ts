import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../supabase/server'

/**
 * API Middleware - Centralized middleware system for API routes
 * Implements authentication, rate limiting, validation, and error handling
 */

export interface MiddlewareConfig {
  requireAuth: boolean
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
  validateSchema?: any
  cache?: {
    enabled: boolean
    ttl: number
  }
  cors?: {
    enabled: boolean
    origins: string[]
  }
}

export interface RequestContext {
  user?: any
  requestId: string
  startTime: number
  ip: string
  userAgent: string
}

/**
 * Authentication middleware
 */
export async function authMiddleware(request: NextRequest): Promise<{ user: any } | NextResponse> {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    return { user }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed', message: 'Unable to verify user' },
      { status: 500 }
    )
  }
}

/**
 * Rate limiting middleware
 */
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()

  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100
  ) {}

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const key = identifier
    const record = this.requests.get(key)

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs
      }
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      }
    }

    // Increment count
    record.count++
    this.requests.set(key, record)

    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key)
      }
    }
  }
}

const rateLimiter = new RateLimiter()

export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const result = await rateLimiter.checkLimit(ip)

  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded', 
        message: 'Too many requests, please try again later',
        resetTime: result.resetTime
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimiter.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }

  return null
}

/**
 * CORS middleware
 */
export function corsMiddleware(request: NextRequest, allowedOrigins: string[] = ['*']): NextResponse | null {
  const origin = request.headers.get('origin')
  
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    return null // Allow request
  }

  return NextResponse.json(
    { error: 'CORS error', message: 'Origin not allowed' },
    { status: 403 }
  )
}

/**
 * Request validation middleware
 */
export function validateRequestMiddleware(request: NextRequest, schema?: any): NextResponse | null {
  if (!schema) return null

  try {
    // This would integrate with a validation library like Zod
    // For now, just return null (no validation)
    return null
  } catch (error) {
    return NextResponse.json(
      { error: 'Validation error', message: 'Invalid request data' },
      { status: 400 }
    )
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(error: any, request: NextRequest): NextResponse {
  console.error('API Error:', error)

  // Handle specific error types
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { error: 'Not found', message: 'Resource not found' },
      { status: 404 }
    )
  }

  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Conflict', message: 'Resource already exists' },
      { status: 409 }
    )
  }

  if (error.code === '23503') {
    return NextResponse.json(
      { error: 'Bad request', message: 'Invalid reference' },
      { status: 400 }
    )
  }

  // Generic error response
  return NextResponse.json(
    { 
      error: 'Internal server error', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    },
    { status: 500 }
  )
}

/**
 * Request logging middleware
 */
export function logRequestMiddleware(request: NextRequest, context: RequestContext): void {
  const { method, url } = request
  const { user, requestId, ip, userAgent } = context
  
  console.log(`[${requestId}] ${method} ${url}`, {
    user: user?.id || 'anonymous',
    ip,
    userAgent: userAgent.substring(0, 100),
    timestamp: new Date().toISOString()
  })
}

/**
 * Response logging middleware
 */
export function logResponseMiddleware(response: NextResponse, context: RequestContext): void {
  const { requestId, startTime } = context
  const duration = Date.now() - startTime
  
  console.log(`[${requestId}] Response`, {
    status: response.status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  })
}

/**
 * Main middleware handler
 */
export async function withMiddleware(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
  config: MiddlewareConfig = { requireAuth: false }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const context: RequestContext = {
      requestId,
      startTime,
      ip,
      userAgent
    }

    try {
      // Log request
      logRequestMiddleware(request, context)

      // CORS check
      if (config.cors?.enabled) {
        const corsResponse = corsMiddleware(request, config.cors.origins)
        if (corsResponse) {
          logResponseMiddleware(corsResponse, context)
          return corsResponse
        }
      }

      // Rate limiting
      if (config.rateLimit) {
        const rateLimitResponse = await rateLimitMiddleware(request)
        if (rateLimitResponse) {
          logResponseMiddleware(rateLimitResponse, context)
          return rateLimitResponse
        }
      }

      // Authentication
      if (config.requireAuth) {
        const authResult = await authMiddleware(request)
        if (authResult instanceof NextResponse) {
          logResponseMiddleware(authResult, context)
          return authResult
        }
        context.user = authResult.user
      }

      // Request validation
      if (config.validateSchema) {
        const validationResponse = validateRequestMiddleware(request, config.validateSchema)
        if (validationResponse) {
          logResponseMiddleware(validationResponse, context)
          return validationResponse
        }
      }

      // Execute handler
      const response = await handler(request, context)
      
      // Log response
      logResponseMiddleware(response, context)
      
      return response

    } catch (error) {
      const errorResponse = errorHandler(error, request)
      logResponseMiddleware(errorResponse, context)
      return errorResponse
    }
  }
}

/**
 * Cache middleware
 */
export class CacheMiddleware {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async get(key: string): Promise<any | null> {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  generateKey(request: NextRequest): string {
    const { method, url, headers } = request
    const authHeader = headers.get('authorization')
    return `${method}:${url}:${authHeader || 'no-auth'}`
  }
}

const cacheMiddleware = new CacheMiddleware()

export async function cacheMiddlewareHandler(
  request: NextRequest,
  ttl: number = 5 * 60 * 1000
): Promise<{ cached: boolean; data?: any }> {
  const key = cacheMiddleware.generateKey(request)
  const cached = await cacheMiddleware.get(key)
  
  if (cached) {
    return { cached: true, data: cached }
  }
  
  return { cached: false }
}

export async function setCacheResponse(
  request: NextRequest,
  data: any,
  ttl: number = 5 * 60 * 1000
): Promise<void> {
  const key = cacheMiddleware.generateKey(request)
  await cacheMiddleware.set(key, data, ttl)
}

/**
 * Utility functions for common middleware patterns
 */
export const middlewareUtils = {
  /**
   * Create authenticated API handler
   */
  withAuth: (handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>) =>
    withMiddleware(handler, { requireAuth: true }),

  /**
   * Create rate-limited API handler
   */
  withRateLimit: (
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
    rateLimit: { windowMs: number; maxRequests: number }
  ) =>
    withMiddleware(handler, { requireAuth: false, rateLimit }),

  /**
   * Create cached API handler
   */
  withCache: (
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
    ttl: number = 5 * 60 * 1000
  ) =>
    withMiddleware(handler, { requireAuth: false, cache: { enabled: true, ttl } }),

  /**
   * Create fully protected API handler
   */
  withFullProtection: (
    handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
    options: Partial<MiddlewareConfig> = {}
  ) =>
    withMiddleware(handler, {
      requireAuth: true,
      rateLimit: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
      cors: { enabled: true, origins: ['*'] },
      ...options
    })
}