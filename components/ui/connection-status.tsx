'use client'

import { useSupabaseConnection } from '@/lib/supabase/connection-monitor'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionIndicatorProps {
  className?: string
  showText?: boolean
}

export function ConnectionIndicator({ className, showText = false }: ConnectionIndicatorProps) {
  const { isConnected, isChecking, lastError, retryCount } = useSupabaseConnection()

  const getStatusIcon = () => {
    if (isChecking) {
      return <Wifi className="h-4 w-4 animate-pulse text-yellow-500" />
    }
    
    if (!isConnected) {
      return <WifiOff className="h-4 w-4 text-red-500" />
    }
    
    if (lastError && retryCount > 0) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />
    }
    
    return <Wifi className="h-4 w-4 text-green-500" />
  }

  const getStatusText = () => {
    if (isChecking) return 'Checking...'
    if (!isConnected) return 'Offline'
    if (lastError && retryCount > 0) return `Unstable (${retryCount} retries)`
    return 'Connected'
  }

  const getTooltipText = () => {
    if (isChecking) return 'Checking connection status...'
    if (!isConnected) return 'No connection to Supabase'
    if (lastError && retryCount > 0) {
      return `Connection unstable. Last error: ${lastError.message}. Retries: ${retryCount}`
    }
    return 'Connected to Supabase'
  }

  return (
    <div 
      data-testid="connection-indicator"
      className={cn(
        'flex items-center space-x-2 transition-all duration-200',
        className
      )}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      {showText && (
        <span className={cn(
          'text-xs font-medium',
          isConnected && !lastError ? 'text-green-600' : 
          !isConnected ? 'text-red-600' : 'text-orange-600'
        )}>
          {getStatusText()}
        </span>
      )}
    </div>
  )
}

export function ConnectionStatus() {
  return <ConnectionIndicator showText className="px-2 py-1 rounded-md bg-muted" />
}