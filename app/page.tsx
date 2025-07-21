'use client'

import { useEffect, useState, useCallback } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { CardProvider } from '@/components/cards/card-provider'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'

// Mock user data - in a real app this would come from authentication
const mockUser = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin' as const,
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
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system'
}

function DashboardContent() {
  const [isClient, setIsClient] = useState(false)

  const handleMount = useCallback(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    handleMount()
  }, [handleMount])

  if (!isClient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <CardProvider
            currentPage="dashboard"
            currentUser={mockUser}
          >
            <Dashboard />
          </CardProvider>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <ToastProvider>
      <ModalProvider>
        <DashboardContent />
      </ModalProvider>
    </ToastProvider>
  )
}