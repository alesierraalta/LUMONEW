/**
 * Centralized logging utility with environment-aware filtering
 * Sanitizes sensitive information in production environments
 */

export class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development'
  private static isProduction = process.env.NODE_ENV === 'production'
  
  /**
   * Log information message (only in development)
   */
  static log(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(message, data)
    }
  }
  
  /**
   * Log error message (always logged, but sanitized in production)
   */
  static error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(message, error)
    } else {
      // In production, only log the message, not the error details
      console.error(message, 'Error occurred')
    }
  }
  
  /**
   * Log warning message (only in development)
   */
  static warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(message, data)
    }
  }
  
  /**
   * Log debug information (only in development)
   */
  static debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(message, data)
    }
  }
  
  /**
   * Log security events (always logged, but sanitized)
   */
  static security(event: string, details?: any): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details: this.sanitizeForProduction(details),
      environment: process.env.NODE_ENV
    }
    
    console.log('[SECURITY]', JSON.stringify(securityLog))
  }
  
  /**
   * Sanitize data for production logging
   * Removes or masks sensitive fields
   */
  static sanitizeForProduction(data: any): any {
    if (this.isDevelopment) return data
    
    if (data === null || data === undefined) return data
    
    // Handle primitive types
    if (typeof data !== 'object') return data
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForProduction(item))
    }
    
    // Handle objects
    const sensitive = [
      'password', 'token', 'key', 'secret', 'email', 'auth',
      'authorization', 'cookie', 'session', 'jwt', 'api_key',
      'access_token', 'refresh_token', 'private_key', 'secret_key'
    ]
    
    const sanitized = { ...data }
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase()
      
      // Check if key contains sensitive information
      const isSensitive = sensitive.some(sensitiveKey => 
        lowerKey.includes(sensitiveKey)
      )
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForProduction(sanitized[key])
      }
    })
    
    return sanitized
  }
  
  /**
   * Log API request (sanitized in production)
   */
  static apiRequest(method: string, url: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url}`, data)
    } else {
      console.log(`[API] ${method} ${url}`, this.sanitizeForProduction(data))
    }
  }
  
  /**
   * Log API response (sanitized in production)
   */
  static apiResponse(method: string, url: string, status: number, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url} - ${status}`, data)
    } else {
      console.log(`[API] ${method} ${url} - ${status}`, this.sanitizeForProduction(data))
    }
  }
  
  /**
   * Log database operations (sanitized in production)
   */
  static database(operation: string, table: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[DB] ${operation} on ${table}`, data)
    } else {
      console.log(`[DB] ${operation} on ${table}`, this.sanitizeForProduction(data))
    }
  }
  
  /**
   * Log authentication events
   */
  static auth(event: string, userId?: string, details?: any): void {
    const authLog = {
      timestamp: new Date().toISOString(),
      event,
      userId: userId ? '[USER_ID]' : undefined,
      details: this.sanitizeForProduction(details)
    }
    
    console.log('[AUTH]', JSON.stringify(authLog))
  }
}