import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2
}

// DNS resolution retry wrapper for server-side
const createServerClientWithRetry = async (retryCount = 0): Promise<any> => {
  try {
    const cookieStore = cookies()
    
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // Test the connection with a simple query
    await client.from('_health_check').select('*').limit(1)
    
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
      
      console.warn(`Server DNS resolution failed, retrying in ${delay}ms... (attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return createServerClientWithRetry(retryCount + 1)
    }
    
    // If not a DNS error or max retries reached, throw the error
    throw error
  }
}

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Export async version with retry logic for server components that can handle promises
export async function createClientAsync() {
  return createServerClientWithRetry()
}

// Health check function for server-side
export async function checkSupabaseServerConnection(): Promise<boolean> {
  try {
    const client = await createClientAsync()
    await client.from('_health_check').select('*').limit(1)
    return true
  } catch (error) {
    console.error('Server Supabase connection check failed:', error)
    return false
  }
}