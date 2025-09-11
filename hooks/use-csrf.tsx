'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface CSRFState {
  token: string | null
  loading: boolean
  error: string | null
}

interface CSRFHookReturn extends CSRFState {
  refreshToken: () => Promise<void>
  getHeaders: () => Record<string, string>
}

/**
 * Custom hook for managing CSRF tokens
 */
export function useCSRF(): CSRFHookReturn {
  const [state, setState] = useState<CSRFState>({
    token: null,
    loading: true,
    error: null
  })

  const fetchToken = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success || !data.token) {
        throw new Error('Invalid CSRF token response')
      }
      
      setState({
        token: data.token,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching CSRF token:', error)
      setState({
        token: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }, [])

  const refreshToken = useCallback(async () => {
    await fetchToken()
  }, [fetchToken])

  const getHeaders = useCallback((): Record<string, string> => {
    if (!state.token) {
      console.warn('No CSRF token available for headers')
      return {}
    }
    
    return {
      'X-CSRF-Token': state.token
    }
  }, [state.token])

  // Fetch token on mount
  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  // Auto-refresh token every 23 hours (before 24h expiry)
  useEffect(() => {
    if (!state.token) return
    
    const refreshInterval = setInterval(() => {
      refreshToken()
    }, 23 * 60 * 60 * 1000) // 23 hours
    
    return () => clearInterval(refreshInterval)
  }, [state.token, refreshToken])

  return {
    ...state,
    refreshToken,
    getHeaders
  }
}

/**
 * Higher-order component to provide CSRF protection to forms
 */
export function withCSRFProtection<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>
) {
  return function CSRFProtectedComponent(props: T) {
    const csrf = useCSRF()
    
    return (
      <WrappedComponent 
        {...props} 
        csrf={csrf}
      />
    )
  }
}

/**
 * Utility function to make CSRF-protected API calls
 */
export async function csrfFetch(
  url: string, 
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> {
  // Get CSRF token if not provided
  let token = csrfToken
  
  if (!token) {
    try {
      const tokenResponse = await fetch('/api/csrf-token', {
        credentials: 'include'
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        token = tokenData.token
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token for request:', error)
    }
  }
  
  // Prepare headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers['X-CSRF-Token'] = token
  }
  
  // Make the request
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers
  })
}

/**
 * React component for CSRF token input (for traditional forms)
 */
export function CSRFTokenInput() {
  const { token, loading, error } = useCSRF()
  
  if (loading || error || !token) {
    return null
  }
  
  return (
    <input 
      type="hidden" 
      name="_csrf" 
      value={token}
      aria-hidden="true"
    />
  )
}