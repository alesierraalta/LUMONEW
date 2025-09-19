'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, options?: { full_name?: string; role?: string }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

interface AuthProviderProps {
  children: React.ReactNode
  initialAuth?: {
    user: User | null
    session: Session | null
    error: string | null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialAuth }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialAuth?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialAuth?.session ?? null)
  const [loading, setLoading] = useState(!initialAuth)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(initialAuth?.error ?? null)
  
  // Refs to track state and prevent race conditions
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const lastUpdateRef = useRef<number>(0)
  
  // Initialize Supabase client with error handling
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  let supabase: any = null
  
  try {
    supabase = createClient()
  } catch (err: any) {
    console.error('Failed to create Supabase client:', err)
    setSupabaseError(err.message || 'Failed to initialize Supabase client')
  }

  // Debounced state update function to prevent race conditions
  const debouncedStateUpdate = useCallback((
    newUser: User | null,
    newSession: Session | null,
    newError: string | null = null,
    forceUpdate: boolean = false
  ) => {
    const now = Date.now()
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // If this is a forced update or enough time has passed, update immediately
    if (forceUpdate || now - lastUpdateRef.current > 100) {
      setUser(newUser)
      setSession(newSession)
      setError(newError)
      setLoading(false)
      lastUpdateRef.current = now
      return
    }
    
    // Otherwise, debounce the update
    debounceTimeoutRef.current = setTimeout(() => {
      setUser(newUser)
      setSession(newSession)
      setError(newError)
      setLoading(false)
      lastUpdateRef.current = Date.now()
    }, 50) // 50ms debounce
  }, [])

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return
    }
    
    setMounted(true)
    isInitializedRef.current = true
    
    // If Supabase client failed to initialize, set error and stop loading
    if (supabaseError || !supabase) {
      debouncedStateUpdate(null, null, supabaseError || 'Failed to initialize authentication service', true)
      return
    }
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing completion')
        debouncedStateUpdate(user, session, 'Authentication service is taking too long to respond. Please check your internet connection.', true)
      }
    }, 5000) // Increased to 5 second timeout for better reliability
    
    // If initialAuth is provided, use it immediately and set up listener without verification
    if (initialAuth) {
      // Use server-provided auth state as single source of truth
      debouncedStateUpdate(initialAuth.user, initialAuth.session, initialAuth.error, true)
      clearTimeout(timeoutId)
    } else {
      // Only get initial user if not provided
      supabase.auth.getUser().then(({ data: { user }, error }: any) => {
        if (error) {
          console.error('Error getting user:', error)
          debouncedStateUpdate(null, null, error.message, true)
        } else {
          // If we have a user, get the session for additional data
          if (user) {
            supabase.auth.getSession().then(({ data: { session } }: any) => {
              debouncedStateUpdate(user, session, null, true)
            })
          } else {
            debouncedStateUpdate(null, null, null, true)
          }
        }
        clearTimeout(timeoutId)
      }).catch((err: any) => {
        // Handle auth initialization errors
        console.error('Auth initialization error:', err)
        debouncedStateUpdate(null, null, 'Failed to initialize authentication', true)
        clearTimeout(timeoutId)
      })
    }

    // Listen for auth changes - NO verification calls, trust the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        console.log('Auth state change:', event)
        
        // Use debounced update to prevent race conditions
        if (session?.user) {
          debouncedStateUpdate(session.user, session, null)
        } else {
          debouncedStateUpdate(null, null, null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, []) // Empty dependency array to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      const errorMessage = 'Authentication service not available. Please check your configuration.'
      setError(errorMessage)
      return { error: errorMessage }
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Create a promise that resolves when auth state changes to signed in
      const authStatePromise = new Promise<{ error?: string }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Authentication timeout - please try again'))
        }, 15000) // Increased to 15 second timeout
        
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: any, session: any) => {
            console.log('Auth state change during sign in:', event, session?.user?.email)
            if (event === 'SIGNED_IN' && session?.user) {
              clearTimeout(timeout)
              subscription.unsubscribe()
              resolve({})
            } else if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session?.user)) {
              clearTimeout(timeout)
              subscription.unsubscribe()
              resolve({ error: 'Authentication failed' })
            }
          }
        )
      })
      
      // Start the sign in process
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (signInError) {
        setError(signInError.message)
        return { error: signInError.message }
      }
      
      // Wait for the auth state to actually change
      const result = await authStatePromise
      
      if (result.error) {
        setError(result.error)
        return result
      }
      
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, options?: { full_name?: string; role?: string }) => {
    if (!supabase) {
      const errorMessage = 'Authentication service not available. Please check your configuration.'
      setError(errorMessage)
      return { error: errorMessage }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: options || {}
        }
      })
      if (error) {
        setError(error.message)
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    if (!supabase) {
      console.error('Cannot sign out: Authentication service not available')
      return
    }
    
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (error: any) {
      console.error('Error signing out:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      const errorMessage = 'Authentication service not available. Please check your configuration.'
      setError(errorMessage)
      return { error: errorMessage }
    }
    
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        setError(error.message)
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  // Cleanup effect for debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}