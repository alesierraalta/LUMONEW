'use client'

import React from 'react'
import { useSupabaseConnection } from '@/lib/supabase/connection-monitor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

interface ConnectionStatusProps {
  showDetails?: boolean
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { isConnected, lastChecked, error, retryCount, checkConnection, waitForConnection } = useSupabaseConnection()
  const [isReconnecting, setIsReconnecting] = React.useState(false)

  const handleReconnect = async () => {
    setIsReconnecting(true)
    try {
      await waitForConnection(15000)
    } finally {
      setIsReconnecting(false)
    }
  }

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500'
    if (retryCount > 0) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (isConnected) return 'Connected'
    if (isReconnecting) return 'Reconnecting...'
    if (retryCount > 0) return `Retrying (${retryCount})`
    return 'Disconnected'
  }

  const getStatusIcon = () => {
    if (isReconnecting) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (isConnected) return <Wifi className="h-4 w-4" />
    if (retryCount > 0) return <AlertTriangle className="h-4 w-4" />
    return <WifiOff className="h-4 w-4" />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Badge 
          variant={isConnected ? 'default' : 'destructive'}
          className="flex items-center gap-1"
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {!isConnected && !isReconnecting && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconnect}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Last checked: {lastChecked.toLocaleTimeString()}</div>
          {retryCount > 0 && (
            <div>Retry attempts: {retryCount}</div>
          )}
        </div>
      )}

      {!isConnected && error && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Connection Issue:</strong> {error}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              The app will automatically retry connecting. You can also try refreshing the page.
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Compact version for header/navbar
export const ConnectionIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isConnected, retryCount } = useSupabaseConnection()
  
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : retryCount > 0 ? 'bg-yellow-500' : 'bg-red-500'
        }`}
        title={isConnected ? 'Connected to Supabase' : 'Connection issues detected'}
      />
    </div>
  )
}

// Hook for components that need to handle connection state
export const useConnectionAwareOperation = () => {
  const { isConnected, waitForConnection } = useSupabaseConnection()
  
  const executeWithConnection = React.useCallback(
    async (
      operation: () => Promise<any>,
      options: { timeout?: number; showError?: boolean } = {}
    ) => {
      const { timeout = 10000, showError = true } = options
      
      if (!isConnected) {
        const connected = await waitForConnection(timeout)
        if (!connected) {
          const error = new Error('Unable to establish connection to Supabase')
          if (showError) {
            console.error('Connection timeout:', error)
          }
          throw error
        }
      }
      
      return operation()
    },
    [isConnected, waitForConnection]
  )
  
  return {
    isConnected,
    executeWithConnection
  }
}