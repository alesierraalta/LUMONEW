'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from './client-with-retry'

interface ConnectionState {
  isConnected: boolean
  lastChecked: Date
  error: string | null
  retryCount: number
}

const INITIAL_STATE: ConnectionState = {
  isConnected: false,
  lastChecked: new Date(),
  error: null,
  retryCount: 0
}

const CHECK_INTERVAL = 30000 // 30 seconds
const MAX_RETRIES = 5
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000] // Progressive backoff

export function useSupabaseConnection() {
  const [state, setState] = useState<ConnectionState>(INITIAL_STATE)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCheckingRef = useRef(false)

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (isCheckingRef.current) {
      return state.isConnected
    }

    isCheckingRef.current = true

    try {
      const supabase = createClient()
      
      // Simple connection test - just check if client can be created and has auth
      const isConnected = supabase && supabase.auth !== undefined
      const now = new Date()

      setState(prev => ({
        isConnected,
        lastChecked: now,
        error: isConnected ? null : 'Connection failed',
        retryCount: isConnected ? 0 : prev.retryCount
      }))

      return isConnected
    } catch (err: any) {
      const now = new Date()
      setState(prev => ({
        isConnected: false,
        lastChecked: now,
        error: err.message || 'Connection check failed',
        retryCount: prev.retryCount
      }))
      return false
    } finally {
      isCheckingRef.current = false
    }
  }, [state.isConnected])

  const scheduleRetry = useCallback((retryCount: number) => {
    if (retryCount >= MAX_RETRIES) {
      console.warn('Max connection retries reached')
      return
    }

    const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]
    
    setState(prev => ({
      ...prev,
      retryCount: retryCount + 1
    }))

    retryTimeoutRef.current = setTimeout(async () => {
      const connected = await checkConnection()
      if (!connected) {
        scheduleRetry(retryCount + 1)
      }
    }, delay)
  }, [checkConnection])

  const waitForConnection = useCallback(async (timeout: number = 10000): Promise<boolean> => {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const connected = await checkConnection()
      if (connected) {
        return true
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return false
  }, [checkConnection])

  // Initial connection check and periodic monitoring
  useEffect(() => {
    // Initial check
    checkConnection().then(connected => {
      if (!connected) {
        scheduleRetry(0)
      }
    })

    // Set up periodic checks
    intervalRef.current = setInterval(() => {
      if (!isCheckingRef.current) {
        checkConnection().then(connected => {
          if (!connected && state.retryCount === 0) {
            scheduleRetry(0)
          }
        })
      }
    }, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [checkConnection, scheduleRetry, state.retryCount])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network back online, checking connection...')
      checkConnection()
    }

    const handleOffline = () => {
      console.log('Network went offline')
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: 'Network offline',
        lastChecked: new Date()
      }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  return {
    isConnected: state.isConnected,
    isChecking: isCheckingRef.current,
    lastChecked: state.lastChecked,
    lastError: state.error ? { message: state.error } : null,
    retryCount: state.retryCount,
    checkConnection,
    waitForConnection
  }
}

// Global connection state for components that need it
let globalConnectionState: ConnectionState = INITIAL_STATE
const connectionListeners = new Set<(state: ConnectionState) => void>()

export function subscribeToConnectionState(listener: (state: ConnectionState) => void) {
  connectionListeners.add(listener)
  listener(globalConnectionState) // Send current state immediately
  
  return () => {
    connectionListeners.delete(listener)
  }
}

export function updateGlobalConnectionState(newState: Partial<ConnectionState>) {
  globalConnectionState = { ...globalConnectionState, ...newState }
  connectionListeners.forEach(listener => listener(globalConnectionState))
}

// Utility to check connection without hook
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = createClient()
    // Simple connection test - just check if client can be created and has auth
    const isConnected = supabase && supabase.auth !== undefined
    
    updateGlobalConnectionState({
      isConnected,
      lastChecked: new Date(),
      error: isConnected ? null : 'Connection failed'
    })
    
    return isConnected
  } catch (err: any) {
    updateGlobalConnectionState({
      isConnected: false,
      lastChecked: new Date(),
      error: err.message || 'Connection check failed'
    })
    return false
  }
}