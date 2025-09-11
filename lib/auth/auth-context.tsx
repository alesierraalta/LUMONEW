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
  signUp: (email: string, password: string) => Promise<{ error?: string }>
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
  
  // Initialize Supabase client with error handling
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    
    
    // Get initial user if not provided - using secure getUser() instead of getSession()
    if (!initialAuth) {
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (error) {
          console.error('Error getting user:', error)
          setError(error.message)
          setUser(null)
          setSession(null)
        } else {
          setUser(user)
          // If we have a user, get the session for additional data
          if (user) {
            supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session)
            })
          } else {
            setSession(null)
          }
        }
        setLoading(false)
      })
    }

    // Listen for auth changes - verify user authenticity on each change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe()
  }, [initialAuth, supabase.auth])

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

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signUp({ email, password })
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
    return null
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