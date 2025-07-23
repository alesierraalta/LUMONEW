'use client'

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { UserGrid } from '@/components/users/user-grid'
import { UserForm, UserData } from '@/components/users/user-form'
import { UserEditForm, UserEditData } from '@/components/users/user-edit-form'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading'
import { Sidebar } from '@/components/layout/sidebar'
import { userService } from '@/lib/database'
import { useTranslations } from 'next-intl'

// Helper function to convert UserData to database format
const mapUserDataToDatabase = (userData: UserData) => ({
  email: userData.email,
  name: `${userData.firstName} ${userData.lastName}`,
  role: userData.position,
  status: userData.status
})

// Helper function to convert database user to UserData format
const mapDatabaseToUserData = (dbUser: any): UserData => ({
  id: dbUser.id,
  firstName: dbUser.name?.split(' ')[0] || '',
  lastName: dbUser.name?.split(' ').slice(1).join(' ') || '',
  email: dbUser.email,
  phone: dbUser.phone || '',
  position: dbUser.role || '',
  department: dbUser.department || '',
  location: dbUser.location || '',
  bio: dbUser.bio || '',
  profileImage: dbUser.profile_image,
  startDate: dbUser.start_date || new Date().toISOString().split('T')[0],
  status: dbUser.status || 'active'
})

// Helper function to convert database user to UserEditData format
const mapDatabaseToUserEditData = (dbUser: any): UserEditData => ({
  id: dbUser.id,
  firstName: dbUser.name?.split(' ')[0] || '',
  lastName: dbUser.name?.split(' ').slice(1).join(' ') || '',
  email: dbUser.email,
  role: dbUser.role || ''
})

// Helper function to convert UserEditData to database format
const mapUserEditDataToDatabase = (userData: UserEditData) => ({
  email: userData.email,
  name: `${userData.firstName} ${userData.lastName}`,
  role: userData.role
})

function UserManagementContent() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { openModal } = useModal()
  const { addToast } = useToast()
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const usersData = await userService.getAll()
      const mappedUsers = usersData.map(mapDatabaseToUserData)
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      addToast({
        type: 'error',
        title: tErrors('generic'),
        description: t('errorLoadingUsers')
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const handleUserCreate = useCallback(() => {
    openModal(
      <UserForm
        onSubmit={async (userData) => {
          try {
            setIsLoading(true)
            const dbUserData = mapUserDataToDatabase(userData)
            const newDbUser = await userService.create(dbUserData)
            const newUser = mapDatabaseToUserData(newDbUser)
            setUsers(prev => [...prev, newUser])
            addToast({
              type: 'success',
              title: t('userCreatedSuccess'),
              description: t('userCreatedDescription', { name: `${userData.firstName} ${userData.lastName}` })
            })
          } catch (error) {
            console.error('Error creating user:', error)
            addToast({
              type: 'error',
              title: t('errorCreatingUser'),
              description: t('errorCreatingUserDescription')
            })
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />,
      { size: 'lg' }
    )
  }, [openModal, setIsLoading, addToast])

  const handleUserEdit = useCallback((user: UserData) => {
    // Convert UserData to UserEditData for the simplified form
    const editUser: UserEditData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.position // Map position to role
    }

    openModal(
      <UserEditForm
        user={editUser}
        onSubmit={async (userData) => {
          try {
            setIsLoading(true)
            if (!user.id) throw new Error('User ID is required for update')
            
            const dbUserData = mapUserEditDataToDatabase(userData)
            const updatedDbUser = await userService.update(user.id, dbUserData)
            const updatedUser = mapDatabaseToUserData(updatedDbUser)
            setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u))
            addToast({
              type: 'success',
              title: t('userUpdatedSuccess'),
              description: t('userUpdatedDescription', { name: `${userData.firstName} ${userData.lastName}` })
            })
          } catch (error) {
            console.error('Error updating user:', error)
            addToast({
              type: 'error',
              title: t('errorUpdatingUser'),
              description: t('errorUpdatingUserDescription')
            })
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />,
      { size: 'md' }
    )
  }, [openModal, setIsLoading, addToast])

  const handleUserDelete = useCallback(async (userId: string) => {
    try {
      setIsLoading(true)
      await userService.delete(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      addToast({
        type: 'success',
        title: t('userDeletedSuccess'),
        description: t('userDeletedDescription')
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      addToast({
        type: 'error',
        title: t('errorDeletingUser'),
        description: t('errorDeletingUserDescription')
      })
    } finally {
      setIsLoading(false)
    }
  }, [setIsLoading, addToast])

  const handleUserView = useCallback((user: UserData) => {
    openModal(
      <UserDetailsModal user={user} />,
      { size: 'md' }
    )
  }, [openModal])

  // Handle client-side hydration and load users
  useEffect(() => {
    setIsClient(true)
    loadUsers()
  }, [loadUsers])

  // Prevent hydration mismatch by showing loading until client-side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">{t('loadingUserManagement')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UserGrid
          users={users}
          isLoading={isLoading}
          onUserCreate={handleUserCreate}
          onUserEdit={handleUserEdit}
          onUserDelete={handleUserDelete}
          onUserView={handleUserView}
        />
      </div>
    </div>
  )
}

// User Details Modal Component
function UserDetailsModal({ user }: { user: UserData }) {
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  
  const getStatusColor = (status: UserData['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: UserData['status']) => {
    switch (status) {
      case 'active': return t('active')
      case 'inactive': return t('inactive')
      case 'pending': return t('pending')
      default: return tCommon('unknown')
    }
  }

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-white font-bold text-2xl">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-lg text-gray-600 mb-2">{user.position}</p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
          {getStatusLabel(user.status)}
        </span>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('contactInformation')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Teléfono:</span>
              <span className="font-medium text-gray-900">{user.phone}</span>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('professionalInformation')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('department')}:</span>
              <span className="font-medium text-gray-900">{user.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('location')}:</span>
              <span className="font-medium text-gray-900">{user.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('startDate')}:</span>
              <span className="font-medium text-gray-900">
                {new Date(user.startDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Biography */}
        {user.bio && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('biography')}</h3>
            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function UsersPage() {
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <UserManagementContent />
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}