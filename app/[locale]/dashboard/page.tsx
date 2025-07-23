'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { Dashboard } from '@/components/dashboard/dashboard'
import { CardProvider } from '@/components/cards/card-provider'

export default function DashboardPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will redirect to login
  }

  // Convert user to the format expected by CardProvider
  const cardProviderUser = {
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
  }

  return (
    <CardProvider
      currentPage="dashboard"
      currentUser={cardProviderUser}
    >
      <Dashboard />
    </CardProvider>
  )
}