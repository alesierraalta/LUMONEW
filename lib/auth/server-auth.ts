import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Cached server-side auth check to prevent multiple calls
export const getServerAuth = cache(async () => {
  try {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Server auth error:', error)
      return { user: null, session: null, error: error.message }
    }

    return { 
      user: session?.user ?? null, 
      session, 
      error: null 
    }
  } catch (err: any) {
    console.error('Server auth exception:', err)
    return { 
      user: null, 
      session: null, 
      error: err.message || 'Authentication check failed' 
    }
  }
})

// Helper to check if user is authenticated on server
export const isAuthenticated = async (): Promise<boolean> => {
  const { user } = await getServerAuth()
  return !!user
}

// Helper to get user ID on server
export const getUserId = async (): Promise<string | null> => {
  const { user } = await getServerAuth()
  return user?.id ?? null
}

// Helper to require authentication (throws if not authenticated)
export const requireAuth = async () => {
  const { user, error } = await getServerAuth()
  
  if (!user) {
    throw new Error(error || 'Authentication required')
  }
  
  return user
}

// Helper for API routes to check auth
export const getApiAuth = async (request: Request) => {
  try {
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      return { user: null, session: null, error: 'No authentication cookies' }
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=')
              acc[key] = value
              return acc
            }, {} as Record<string, string>)
            return cookies[name]
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { user: null, session: null, error: error.message }
    }

    return { 
      user: session?.user ?? null, 
      session, 
      error: null 
    }
  } catch (err: any) {
    return { 
      user: null, 
      session: null, 
      error: err.message || 'API authentication check failed' 
    }
  }
}