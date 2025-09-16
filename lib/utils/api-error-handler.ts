/**
 * Centralized API error handling utility
 * Provides standardized error responses and logging
 */

import { Logger } from './logger'

export class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface APIErrorResponse {
  success: false
  error: string
  code?: string
  timestamp: string
  requestId?: string
}

/**
 * Handle API errors with standardized responses
 */
export function handleAPIError(error: unknown, requestId?: string): Response {
  Logger.error('API Error:', error)
  
  if (error instanceof APIError) {
    const response: APIErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      requestId
    }
    
    return Response.json(response, { status: error.statusCode })
  }
  
  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    const response: APIErrorResponse = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      requestId
    }
    
    return Response.json(response, { status: 400 })
  }
  
  // Handle authentication errors
  if (error instanceof Error && error.message.includes('auth')) {
    const response: APIErrorResponse = {
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString(),
      requestId
    }
    
    return Response.json(response, { status: 401 })
  }
  
  // Handle authorization errors
  if (error instanceof Error && error.message.includes('permission')) {
    const response: APIErrorResponse = {
      success: false,
      error: 'Insufficient permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
      timestamp: new Date().toISOString(),
      requestId
    }
    
    return Response.json(response, { status: 403 })
  }
  
  // Handle not found errors
  if (error instanceof Error && error.message.includes('not found')) {
    const response: APIErrorResponse = {
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      requestId
    }
    
    return Response.json(response, { status: 404 })
  }
  
  // Generic error for unexpected issues
  const response: APIErrorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? (error as Error).message 
      : 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId
  }
  
  return Response.json(response, { status: 500 })
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return Response.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Validate request body and throw appropriate errors
 */
export function validateRequestBody(body: any, requiredFields: string[]): void {
  if (!body || typeof body !== 'object') {
    throw new APIError(400, 'Request body is required', 'MISSING_BODY')
  }
  
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  )
  
  if (missingFields.length > 0) {
    throw new APIError(
      400, 
      `Missing required fields: ${missingFields.join(', ')}`, 
      'MISSING_FIELDS',
      { missingFields }
    )
  }
}

/**
 * Handle async route handlers with error catching
 */
export function withErrorHandling(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      const requestId = request.headers.get('x-request-id') || 
                       `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      Logger.error('Route handler error:', {
        url: request.url,
        method: request.method,
        requestId,
        error
      })
      
      return handleAPIError(error, requestId)
    }
  }
}

/**
 * Common error types for consistent error handling
 */
export const ErrorTypes = {
  VALIDATION_ERROR: (message: string) => new APIError(400, message, 'VALIDATION_ERROR'),
  AUTH_REQUIRED: () => new APIError(401, 'Authentication required', 'AUTH_REQUIRED'),
  INSUFFICIENT_PERMISSIONS: () => new APIError(403, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'),
  NOT_FOUND: (resource: string) => new APIError(404, `${resource} not found`, 'NOT_FOUND'),
  CONFLICT: (message: string) => new APIError(409, message, 'CONFLICT'),
  RATE_LIMITED: () => new APIError(429, 'Too many requests', 'RATE_LIMITED'),
  INTERNAL_ERROR: (message: string) => new APIError(500, message, 'INTERNAL_ERROR'),
  SERVICE_UNAVAILABLE: () => new APIError(503, 'Service temporarily unavailable', 'SERVICE_UNAVAILABLE')
} as const

/**
 * Log security-related errors
 */
export function handleSecurityError(error: unknown, context: string, requestId?: string): Response {
  Logger.security('Security error detected', {
    context,
    error: error instanceof Error ? error.message : 'Unknown error',
    requestId,
    timestamp: new Date().toISOString()
  })
  
  // Don't expose security error details
  const response: APIErrorResponse = {
    success: false,
    error: 'Security validation failed',
    code: 'SECURITY_ERROR',
    timestamp: new Date().toISOString(),
    requestId
  }
  
  return Response.json(response, { status: 403 })
}