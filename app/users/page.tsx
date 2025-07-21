'use client'

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { UserGrid } from '@/components/users/user-grid'
import { UserForm, UserData } from '@/components/users/user-form'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading'
import { Sidebar } from '@/components/layout/sidebar'

// Mock data for demonstration
const mockUsers: UserData[] = [
  {
    id: '1',
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@empresa.com',
    phone: '+58 414-123-4567',
    position: 'Gerente de Ventas',
    department: 'Ventas',
    location: 'Caracas',
    bio: 'Especialista en ventas con más de 8 años de experiencia en el sector tecnológico.',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    startDate: '2020-03-15',
    status: 'active'
  },
  {
    id: '2',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@empresa.com',
    phone: '+58 412-987-6543',
    position: 'Desarrollador Senior',
    department: 'Tecnología',
    location: 'Valencia',
    bio: 'Desarrollador full-stack especializado en React y Node.js.',
    startDate: '2019-08-22',
    status: 'active'
  },
  {
    id: '3',
    firstName: 'María',
    lastName: 'López',
    email: 'maria.lopez@empresa.com',
    phone: '+58 416-555-0123',
    position: 'Diseñadora UX/UI',
    department: 'Diseño',
    location: 'Maracaibo',
    bio: 'Diseñadora creativa con pasión por crear experiencias de usuario excepcionales.',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    startDate: '2021-01-10',
    status: 'active'
  },
  {
    id: '4',
    firstName: 'José',
    lastName: 'Martínez',
    email: 'jose.martinez@empresa.com',
    phone: '+58 424-777-8888',
    position: 'Analista de Marketing',
    department: 'Marketing',
    location: 'Caracas',
    bio: 'Especialista en marketing digital y análisis de datos.',
    startDate: '2022-06-01',
    status: 'pending'
  },
  {
    id: '5',
    firstName: 'Laura',
    lastName: 'Fernández',
    email: 'laura.fernandez@empresa.com',
    phone: '+58 414-999-0000',
    position: 'Contadora',
    department: 'Finanzas',
    location: 'Valencia',
    bio: 'Contadora pública con experiencia en auditoría y finanzas corporativas.',
    startDate: '2018-11-30',
    status: 'inactive'
  },
  {
    id: '6',
    firstName: 'Roberto',
    lastName: 'Silva',
    email: 'roberto.silva@empresa.com',
    phone: '+58 412-333-4444',
    position: 'Especialista en RRHH',
    department: 'Recursos Humanos',
    location: 'Maracaibo',
    bio: 'Profesional en recursos humanos enfocado en desarrollo del talento.',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    startDate: '2020-09-15',
    status: 'active'
  }
]

function UserManagementContent() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { openModal } = useModal()
  const { addToast } = useToast()

  const handleUserCreate = useCallback(() => {
    openModal(
      <UserForm
        onSubmit={async (userData) => {
          setIsLoading(true)
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const newUser: UserData = {
            ...userData,
            id: Date.now().toString()
          }
          
          setUsers(prev => [...prev, newUser])
          setIsLoading(false)
        }}
        isLoading={isLoading}
      />,
      { size: 'lg' }
    )
  }, [openModal, setIsLoading])

  const handleUserEdit = useCallback((user: UserData) => {
    openModal(
      <UserForm
        user={user}
        onSubmit={async (userData) => {
          setIsLoading(true)
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          setUsers(prev => prev.map(u => u.id === user.id ? { ...userData, id: user.id } : u))
          setIsLoading(false)
        }}
        isLoading={isLoading}
      />,
      { size: 'lg' }
    )
  }, [openModal, setIsLoading])

  const handleUserDelete = useCallback(async (userId: string) => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUsers(prev => prev.filter(u => u.id !== userId))
    setIsLoading(false)
  }, [setIsLoading])

  const handleUserView = useCallback((user: UserData) => {
    openModal(
      <UserDetailsModal user={user} />,
      { size: 'md' }
    )
  }, [openModal])

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    setUsers(mockUsers)
  }, [])

  // Prevent hydration mismatch by showing loading until client-side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando gestión de usuarios...</p>
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
      case 'active': return 'Activo'
      case 'inactive': return 'Inactivo'
      case 'pending': return 'Pendiente'
      default: return 'Desconocido'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Contacto</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Profesional</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Departamento:</span>
              <span className="font-medium text-gray-900">{user.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ubicación:</span>
              <span className="font-medium text-gray-900">{user.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha de Inicio:</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Biografía</h3>
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