import { NextRequest } from 'next/server'

interface RateLimitOptions {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max unique tokens (IPs) per interval
  tokensPerInterval: number // Max requests per token per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  })
}, 5 * 60 * 1000)

export default function rateLimit(options: RateLimitOptions) {
  const { interval, tokensPerInterval } = options

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const now = Date.now()
      const key = `rate_limit:${identifier}`
      
      // Get current rate limit data
      const current = rateLimitStore.get(key)
      
      // If no data exists or reset time has passed, create new entry
      if (!current || now > current.resetTime) {
        const resetTime = now + interval
        rateLimitStore.set(key, { count: 1, resetTime })
        
        return {
          success: true,
          limit: tokensPerInterval,
          remaining: tokensPerInterval - 1,
          reset: resetTime
        }
      }
      
      // Check if limit exceeded
      if (current.count >= tokensPerInterval) {
        return {
          success: false,
          limit: tokensPerInterval,
          remaining: 0,
          reset: current.resetTime
        }
      }
      
      // Increment count
      current.count += 1
      rateLimitStore.set(key, current)
      
      return {
        success: true,
        limit: tokensPerInterval,
        remaining: tokensPerInterval - current.count,
        reset: current.resetTime
      }
    }
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to request IP (might be undefined in some environments)
  return request.ip || 'unknown'
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(options: RateLimitOptions) {
  const limiter = rateLimit(options)
  
  return async function(request: NextRequest) {
    const identifier = getClientIP(request)
    const result = await limiter.check(identifier)
    
    return {
      ...result,
      headers: {
        'X-RateLimit-Limit': options.tokensPerInterval.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString()
      }
    }
  }
}