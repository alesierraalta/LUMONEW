'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Dashboard } from '@/components/dashboard/dashboard'
import { CardProvider } from '@/components/cards/card-provider'

export default function DashboardPage() {
  const { user } = useAuth()

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