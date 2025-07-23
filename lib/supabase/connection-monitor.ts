import React from 'react'
import { checkSupabaseConnection } from './client-with-retry'
import { checkSupabaseServerConnection } from './server-with-retry'

export interface ConnectionStatus {
  isConnected: boolean
  lastChecked: Date
  error?: string
  retryCount: number
}

class SupabaseConnectionMonitor {
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    retryCount: 0
  }
  
  private listeners: ((status: ConnectionStatus) => void)[] = []
  private checkInterval: NodeJS.Timeout | null = null
  private isChecking = false

  constructor() {
    // Initial connection check
    this.checkConnection()
  }

  async checkConnection(isServer = false): Promise<ConnectionStatus> {
    if (this.isChecking) {
      return this.status
    }

    this.isChecking = true
    
    try {
      const isConnected = isServer 
        ? await checkSupabaseServerConnection()
        : await checkSupabaseConnection()
      
      this.status = {
        isConnected,
        lastChecked: new Date(),
        retryCount: isConnected ? 0 : this.status.retryCount + 1,
        error: isConnected ? undefined : this.status.error
      }
    } catch (error: any) {
      this.status = {
        isConnected: false,
        lastChecked: new Date(),
        retryCount: this.status.retryCount + 1,
        error: error.message || 'Unknown connection error'
      }
    } finally {
      this.isChecking = false
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.status))
    
    return this.status
  }

  getStatus(): ConnectionStatus {
    return { ...this.status }
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  startMonitoring(intervalMs = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkConnection()
    }, intervalMs)
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  async waitForConnection(timeoutMs = 30000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkConnection()
      if (status.isConnected) {
        return true
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    return false
  }
}

// Singleton instance
export const connectionMonitor = new SupabaseConnectionMonitor()

// React hook for connection status
export function useSupabaseConnection() {
  const [status, setStatus] = React.useState<ConnectionStatus>(
    connectionMonitor.getStatus()
  )

  React.useEffect(() => {
    const unsubscribe = connectionMonitor.onStatusChange(setStatus)
    
    // Check connection on mount
    connectionMonitor.checkConnection()
    
    return unsubscribe
  }, [])

  return {
    ...status,
    checkConnection: () => connectionMonitor.checkConnection(),
    waitForConnection: (timeout?: number) => connectionMonitor.waitForConnection(timeout)
  }
}

// Utility function to execute with connection retry
export async function withConnectionRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before attempting operation
      const isConnected = await connectionMonitor.waitForConnection(10000)
      
      if (!isConnected && attempt === maxRetries) {
        throw new Error('Supabase connection unavailable after retries')
      }
      
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // If it's a DNS error and we have retries left, wait and try again
      const isDnsError = error?.cause?.code === 'EAI_AGAIN' || 
                        error?.code === 'EAI_AGAIN' ||
                        error?.message?.includes('getaddrinfo')
      
      if (isDnsError && attempt < maxRetries) {
        console.warn(`Operation failed with DNS error, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        continue
      }
      
      // If not a DNS error or no retries left, throw
      if (attempt === maxRetries) {
        throw lastError
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}