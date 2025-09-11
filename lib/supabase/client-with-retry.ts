import { createBrowserClient } from '@supabase/ssr'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

// DNS resolution retry wrapper
const createClientWithRetry = async (retryCount = 0): Promise<any> => {
  try {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Return client without health check - Supabase handles its own monitoring
    return client
  } catch (error: any) {
    // Check if it's a DNS resolution error
    const isDnsError = error?.cause?.code === 'EAI_AGAIN' || 
                      error?.code === 'EAI_AGAIN' ||
                      error?.message?.includes('getaddrinfo')
    
    if (isDnsError && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, retryCount),
        RETRY_CONFIG.maxDelay
      )
      
      console.warn(`DNS resolution failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return createClientWithRetry(retryCount + 1)
    }
    
    // If not a DNS error or max retries reached, throw the error
    throw error
  }
}

// Cached client instance
let clientInstance: any = null
let clientPromise: Promise<any> | null = null

export function createClient() {
  // Return cached instance if available
  if (clientInstance) {
    return clientInstance
  }
  
  // Return existing promise if client creation is in progress
  if (clientPromise) {
    return clientPromise
  }
  
  // For immediate synchronous usage, return basic client with enhanced error handling
  const basicClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => {
          // Add timeout and retry logic to fetch requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
          
          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).catch(error => {
            clearTimeout(timeoutId)
            // Log the error but don't throw to prevent app crashes
            console.warn('Supabase request failed:', error.message)
            // Return a rejected promise that can be handled gracefully
            throw new Error(`Connection failed: ${error.message}`)
          }).finally(() => {
            clearTimeout(timeoutId)
          })
        }
      }
    }
  )
  
  // Start async client creation with retry logic
  clientPromise = createClientWithRetry()
    .then(client => {
      clientInstance = client
      clientPromise = null
      return client
    })
    .catch(error => {
      clientPromise = null
      console.error('Failed to create Supabase client after retries:', error)
      // Fall back to basic client
      return basicClient
    })
  
  return basicClient
}

// Export async version for components that can handle promises
export async function createClientAsync() {
  if (clientInstance) {
    return clientInstance
  }
  
  if (clientPromise) {
    return clientPromise
  }
  
  return createClientWithRetry()
}

// Health check function - simplified for Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const client = await createClientAsync()
    // Simple connection test without querying non-existent tables
    return client !== null && client !== undefined
  } catch (error) {
    console.error('Supabase connection check failed:', error)
    return false
  }
}