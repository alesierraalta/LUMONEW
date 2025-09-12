'use client'

import { createContext, useContext, useEffect, useState } from 'react'
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
  const [authTimeout, setAuthTimeout] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(initialAuth?.error ?? null)
  
  // Initialize Supabase client with error handling
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing completion')
        setLoading(false)
        setAuthTimeout(true)
      }
    }, 10000) // 10 second timeout
    
    // Get initial user if not provided - using secure getUser() instead of getSession()
    if (!initialAuth) {
      supabase.auth.getUser().then(({ data: { user }, error }: any) => {
        if (error) {
          console.error('Error getting user:', error)
          setError(error.message)
          setUser(null)
          setSession(null)
        } else {
          setUser(user)
          // If we have a user, get the session for additional data
          if (user) {
            supabase.auth.getSession().then(({ data: { session } }: any) => {
              setSession(session)
            })
          } else {
            setSession(null)
          }
        }
        setLoading(false)
        clearTimeout(timeoutId)
      }).catch((err: any) => {
        // Handle auth initialization errors
        console.error('Auth initialization error:', err)
        setError('Failed to initialize authentication')
        setLoading(false)
        clearTimeout(timeoutId)
      })
    } else {
      // If we have initial auth, we're not loading
      setLoading(false)
      clearTimeout(timeoutId)
    }

    // Listen for auth changes - verify user authenticity on each change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('Auth state change:', event)
        // Always verify user authenticity with server when auth state changes
        if (session?.user) {
          try {
            const { data: { user }, error } = await supabase.auth.getUser()
            if (error) {
              console.warn('User verification failed:', error.message)
              setUser(null)
              setSession(null)
              setError('Authentication verification failed')
            } else {
              setUser(user)
              setSession(session)
              setError(null)
            }
          } catch (error: any) {
            console.error('Error verifying user:', error)
            setUser(null)
            setSession(null)
            setError('Authentication verification failed')
          }
        } else {
          setUser(null)
          setSession(null)
          setError(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [initialAuth]) // Removed supabase.auth from dependencies to prevent infinite loop

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
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

  const signUp = async (email: string, password: string, options?: { full_name?: string; role?: string }) => {
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