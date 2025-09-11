'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    // Log unauthorized access attempt for security monitoring
    console.warn('Unauthorized access attempt detected:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }, [])

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-500">
            <p>
              If you believe this is an error, please contact your administrator
              or try logging in with a different account.
            </p>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Error Code: 403 - Forbidden
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}