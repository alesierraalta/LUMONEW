export interface SupabaseError {
  code: string
  message: string
  details?: any
  hint?: string
  isRetryable: boolean
  retryAfter?: number
}

export class SupabaseErrorHandler {
  static parseError(error: any): SupabaseError {
    // DNS resolution errors
    if (error?.cause?.code === 'EAI_AGAIN' || error?.code === 'EAI_AGAIN') {
      return {
        code: 'DNS_RESOLUTION_FAILED',
        message: 'Unable to resolve Supabase hostname. This is usually a temporary network issue.',
        details: error,
        hint: 'Try again in a few moments. If the problem persists, check your internet connection.',
        isRetryable: true,
        retryAfter: 2000
      }
    }

    // Network timeout errors
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      return {
        code: 'NETWORK_TIMEOUT',
        message: 'Request to Supabase timed out.',
        details: error,
        hint: 'Check your internet connection and try again.',
        isRetryable: true,
        retryAfter: 3000
      }
    }

    // Connection refused
    if (error?.code === 'ECONNREFUSED') {
      return {
        code: 'CONNECTION_REFUSED',
        message: 'Connection to Supabase was refused.',
        details: error,
        hint: 'Supabase service might be temporarily unavailable.',
        isRetryable: true,
        retryAfter: 5000
      }
    }

    // Network unreachable
    if (error?.code === 'ENETUNREACH') {
      return {
        code: 'NETWORK_UNREACHABLE',
        message: 'Network is unreachable.',
        details: error,
        hint: 'Check your internet connection.',
        isRetryable: true,
        retryAfter: 5000
      }
    }

    // Supabase API errors
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode
      
      if (status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: `Supabase server error (${status})`,
          details: error,
          hint: 'This is a temporary server issue. Please try again.',
          isRetryable: true,
          retryAfter: 3000
        }
      }
      
      if (status === 429) {
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests to Supabase API',
          details: error,
          hint: 'Please wait before making more requests.',
          isRetryable: true,
          retryAfter: 10000
        }
      }
      
      if (status >= 400 && status < 500) {
        return {
          code: 'CLIENT_ERROR',
          message: `Client error (${status}): ${error.message || 'Bad request'}`,
          details: error,
          hint: 'Check your request parameters and authentication.',
          isRetryable: false
        }
      }
    }

    // Authentication errors
    if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: error,
        hint: 'Please check your API keys or re-authenticate.',
        isRetryable: false
      }
    }

    // Generic fetch errors
    if (error?.message?.includes('fetch failed')) {
      return {
        code: 'FETCH_FAILED',
        message: 'Network request failed',
        details: error,
        hint: 'Check your internet connection and try again.',
        isRetryable: true,
        retryAfter: 2000
      }
    }

    // Default case
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: error,
      hint: 'Please try again or contact support if the problem persists.',
      isRetryable: true,
      retryAfter: 3000
    }
  }

  static shouldRetry(error: SupabaseError, attemptCount: number, maxRetries: number): boolean {
    return error.isRetryable && attemptCount < maxRetries
  }

  static getRetryDelay(error: SupabaseError, attemptCount: number): number {
    const baseDelay = error.retryAfter || 1000
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount)
    const jitter = Math.random() * 1000
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }

  static formatErrorMessage(error: SupabaseError): string {
    let message = `[${error.code}] ${error.message}`
    if (error.hint) {
      message += `\nHint: ${error.hint}`
    }
    return message
  }

  static logError(error: SupabaseError, context?: string): void {
    const contextStr = context ? `[${context}] ` : ''
    console.error(`${contextStr}Supabase Error:`, {
      code: error.code,
      message: error.message,
      hint: error.hint,
      isRetryable: error.isRetryable,
      details: error.details
    })
  }
}

// Utility function to wrap Supabase operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  maxRetries = 3
): Promise<T> {
  let lastError: SupabaseError | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (rawError: any) {
      const error = SupabaseErrorHandler.parseError(rawError)
      lastError = error
      
      SupabaseErrorHandler.logError(error, context)
      
      if (SupabaseErrorHandler.shouldRetry(error, attempt, maxRetries)) {
        const delay = SupabaseErrorHandler.getRetryDelay(error, attempt)
        console.warn(`Retrying operation in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      throw error
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}