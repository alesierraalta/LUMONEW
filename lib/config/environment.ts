/**
 * Environment configuration utility
 * Provides secure environment variable handling and validation
 */

export class EnvironmentConfig {
  /**
   * Get masked URL for logging (prevents exposure in production)
   */
  static getMaskedURL(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    return process.env.NODE_ENV === 'production' 
      ? '[REDACTED]' 
      : url.slice(0, 25) + '...'
  }
  
  /**
   * Validate that all required environment variables are present
   */
  static validateRequiredEnvVars(): void {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ]
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }
  
  /**
   * Get environment variable with fallback
   */
  static getEnvVar(key: string, fallback?: string): string {
    const value = process.env[key]
    if (!value && fallback === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`)
    }
    return value || fallback!
  }
  
  /**
   * Get boolean environment variable
   */
  static getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
    const value = process.env[key]
    if (!value) return fallback
    
    return value.toLowerCase() === 'true' || value === '1'
  }
  
  /**
   * Get number environment variable
   */
  static getNumberEnvVar(key: string, fallback?: number): number {
    const value = process.env[key]
    if (!value) {
      if (fallback === undefined) {
        throw new Error(`Environment variable ${key} is required but not set`)
      }
      return fallback
    }
    
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`)
    }
    
    return parsed
  }
  
  /**
   * Check if running in development mode
   */
  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }
  
  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }
  
  /**
   * Check if running in test mode
   */
  static isTest(): boolean {
    return process.env.NODE_ENV === 'test'
  }
  
  /**
   * Get secure cookie configuration
   */
  static getCookieConfig() {
    return {
      secure: this.isProduction(),
      httpOnly: true,
      sameSite: 'strict' as const,
      path: '/'
    }
  }
  
  /**
   * Get CORS configuration
   */
  static getCorsConfig() {
    const allowedOrigins = this.getEnvVar('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    
    return {
      origin: this.isDevelopment() 
        ? ['http://localhost:3000', 'http://localhost:3001']
        : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID']
    }
  }
  
  /**
   * Get rate limiting configuration
   */
  static getRateLimitConfig() {
    return {
      windowMs: this.getNumberEnvVar('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
      maxRequests: this.getNumberEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
      skipSuccessfulRequests: this.getBooleanEnvVar('RATE_LIMIT_SKIP_SUCCESS', false),
      skipFailedRequests: this.getBooleanEnvVar('RATE_LIMIT_SKIP_FAILED', true)
    }
  }
  
  /**
   * Get database configuration
   */
  static getDatabaseConfig() {
    return {
      url: this.getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: this.getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  }
  
  /**
   * Get security configuration
   */
  static getSecurityConfig() {
    return {
      csrfTokenLength: this.getNumberEnvVar('CSRF_TOKEN_LENGTH', 32),
      csrfTokenExpiry: this.getNumberEnvVar('CSRF_TOKEN_EXPIRY', 24 * 60 * 60 * 1000), // 24 hours
      sessionTimeout: this.getNumberEnvVar('SESSION_TIMEOUT', 7 * 24 * 60 * 60 * 1000), // 7 days
      maxLoginAttempts: this.getNumberEnvVar('MAX_LOGIN_ATTEMPTS', 5),
      lockoutDuration: this.getNumberEnvVar('LOCKOUT_DURATION', 15 * 60 * 1000) // 15 minutes
    }
  }
  
  /**
   * Get logging configuration
   */
  static getLoggingConfig() {
    return {
      level: this.getEnvVar('LOG_LEVEL', this.isDevelopment() ? 'debug' : 'error'),
      enableConsole: this.getBooleanEnvVar('LOG_ENABLE_CONSOLE', this.isDevelopment()),
      enableFile: this.getBooleanEnvVar('LOG_ENABLE_FILE', this.isProduction()),
      logFile: this.getEnvVar('LOG_FILE', 'logs/app.log'),
      maxFileSize: this.getNumberEnvVar('LOG_MAX_FILE_SIZE', 10 * 1024 * 1024), // 10MB
      maxFiles: this.getNumberEnvVar('LOG_MAX_FILES', 5)
    }
  }
  
  /**
   * Validate environment configuration on startup
   */
  static validateConfiguration(): void {
    try {
      this.validateRequiredEnvVars()
      
      // Validate Supabase configuration
      const dbConfig = this.getDatabaseConfig()
      if (!dbConfig.url.startsWith('https://')) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL')
      }
      
      // Validate security configuration
      const securityConfig = this.getSecurityConfig()
      if (securityConfig.csrfTokenLength < 16) {
        throw new Error('CSRF_TOKEN_LENGTH must be at least 16')
      }
      
      // Validate rate limiting configuration
      const rateLimitConfig = this.getRateLimitConfig()
      if (rateLimitConfig.maxRequests < 1) {
        throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1')
      }
      
    } catch (error) {
      console.error('Environment configuration validation failed:', error)
      throw error
    }
  }
  
  /**
   * Get environment summary for debugging (sanitized)
   */
  static getEnvironmentSummary(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV,
      isDevelopment: this.isDevelopment(),
      isProduction: this.isProduction(),
      isTest: this.isTest(),
      supabaseUrl: this.getMaskedURL(),
      hasServiceRoleKey: this.getDatabaseConfig().hasServiceRoleKey,
      rateLimitConfig: this.getRateLimitConfig(),
      securityConfig: {
        csrfTokenLength: this.getSecurityConfig().csrfTokenLength,
        sessionTimeout: this.getSecurityConfig().sessionTimeout,
        maxLoginAttempts: this.getSecurityConfig().maxLoginAttempts
      },
      loggingConfig: {
        level: this.getLoggingConfig().level,
        enableConsole: this.getLoggingConfig().enableConsole
      }
    }
  }
}