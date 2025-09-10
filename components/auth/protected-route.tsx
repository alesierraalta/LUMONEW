'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading) return

    if (!user) {
      // Redirect to login with current path as redirect parameter
      router.push(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname, mounted])

  // Show loading state during SSR and initial client render
  if (!mounted || loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Verificando autenticación...</p>
          </div>
        </div>
      )
    )
  }

  // Don't render anything if user is not authenticated
  // The useEffect will handle the redirect
  if (!user) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}