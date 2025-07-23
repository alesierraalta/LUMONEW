'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Dashboard } from '@/components/dashboard/dashboard'
import { CardProvider } from '@/components/cards/card-provider'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Prevent hydration mismatch by showing loading state until client-side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null // ProtectedLayout will handle authentication
  }

  return (
    <CardProvider
      currentPage="dashboard"
      currentUser={{
        id: user.id,
        name: user.user_metadata?.full_name || user.email || 'Usuario',
        email: user.email || '',
        role: 'admin' as const, // Since this is a closed system, all users are admins
        isActive: true,
        permissions: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canViewReports: true,
          canManageUsers: true,
          canBulkOperations: true,
          canQuickStock: true,
          canViewAuditLogs: true
        },
        accessibleLocations: ['all'],
        preferences: {
          language: 'es' as const,
          theme: 'light' as const,
          dateFormat: 'DD/MM/YYYY',
          currency: 'USD',
          notifications: {
            email: true,
            push: true,
            lowStock: true,
            bulkOperations: true
          }
        },
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at),
        createdBy: 'system',
        updatedBy: 'system'
      }}
    >
      <Dashboard />
    </CardProvider>
  )
}