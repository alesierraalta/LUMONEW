'use client'

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { RoleGrid } from '@/components/roles/role-grid'
import { RoleForm, RoleData } from '@/components/roles/role-form'
import { ToastProvider } from '@/components/ui/toast'
import { ModalProvider } from '@/components/ui/modal'
import { useModal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/ui/loading'
import { Sidebar } from '@/components/layout/sidebar'
import { Shield } from 'lucide-react'

// Available permissions in the system
export const AVAILABLE_PERMISSIONS = [
  { id: 'users.view', name: 'Ver usuarios', category: 'Usuarios' },
  { id: 'users.create', name: 'Crear usuarios', category: 'Usuarios' },
  { id: 'users.edit', name: 'Editar usuarios', category: 'Usuarios' },
  { id: 'users.delete', name: 'Eliminar usuarios', category: 'Usuarios' },
  { id: 'roles.view', name: 'Ver roles', category: 'Roles' },
  { id: 'roles.create', name: 'Crear roles', category: 'Roles' },
  { id: 'roles.edit', name: 'Editar roles', category: 'Roles' },
  { id: 'roles.delete', name: 'Eliminar roles', category: 'Roles' },
  { id: 'roles.assign', name: 'Asignar roles', category: 'Roles' },
  { id: 'inventory.view', name: 'Ver inventario', category: 'Inventario' },
  { id: 'inventory.create', name: 'Crear productos', category: 'Inventario' },
  { id: 'inventory.edit', name: 'Editar productos', category: 'Inventario' },
  { id: 'inventory.delete', name: 'Eliminar productos', category: 'Inventario' },
  { id: 'reports.view', name: 'Ver reportes', category: 'Reportes' },
  { id: 'reports.create', name: 'Crear reportes', category: 'Reportes' },
  { id: 'reports.export', name: 'Exportar reportes', category: 'Reportes' },
  { id: 'system.admin', name: 'Administración del sistema', category: 'Sistema' },
  { id: 'system.settings', name: 'Configuración del sistema', category: 'Sistema' },
  { id: 'system.backup', name: 'Respaldos del sistema', category: 'Sistema' },
  { id: 'profile.view', name: 'Ver perfil propio', category: 'Perfil' },
  { id: 'profile.edit', name: 'Editar perfil propio', category: 'Perfil' },
  // Sidebar visibility permissions
  { id: 'sidebar.dashboard', name: 'Ver Dashboard', category: 'Navegación' },
  { id: 'sidebar.users', name: 'Ver sección Usuarios', category: 'Navegación' },
  { id: 'sidebar.roles', name: 'Ver sección Roles', category: 'Navegación' },
  { id: 'sidebar.inventory', name: 'Ver sección Inventario', category: 'Navegación' },
  { id: 'sidebar.categories', name: 'Ver sección Categorías', category: 'Navegación' },
  { id: 'sidebar.locations', name: 'Ver sección Ubicaciones', category: 'Navegación' },
  { id: 'sidebar.reports', name: 'Ver sección Reportes', category: 'Navegación' },
  { id: 'sidebar.alerts', name: 'Ver sección Alertas', category: 'Navegación' },
  { id: 'sidebar.settings', name: 'Ver sección Configuración', category: 'Navegación' }
]

// Mock roles data
const mockRoles: RoleData[] = [
  {
    id: '1',
    name: 'Super Administrador',
    description: 'Acceso completo a todas las funciones del sistema',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    color: 'red',
    isSystem: true,
    userCount: 2,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Administrador',
    description: 'Gestión de usuarios, roles e inventario',
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'roles.view', 'roles.create', 'roles.edit', 'roles.assign',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
      'reports.view', 'reports.create', 'reports.export',
      'profile.view', 'profile.edit',
      'sidebar.dashboard', 'sidebar.users', 'sidebar.roles', 'sidebar.inventory',
      'sidebar.categories', 'sidebar.locations', 'sidebar.reports', 'sidebar.alerts', 'sidebar.settings'
    ],
    color: 'blue',
    isSystem: false,
    userCount: 5,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-10'
  },
  {
    id: '3',
    name: 'Gerente',
    description: 'Gestión de equipos y supervisión de operaciones',
    permissions: [
      'users.view', 'users.edit',
      'inventory.view', 'inventory.create', 'inventory.edit',
      'reports.view', 'reports.create',
      'profile.view', 'profile.edit',
      'sidebar.dashboard', 'sidebar.users', 'sidebar.inventory', 'sidebar.reports'
    ],
    color: 'green',
    isSystem: false,
    userCount: 8,
    createdAt: '2024-01-25',
    updatedAt: '2024-03-05'
  },
  {
    id: '4',
    name: 'Empleado',
    description: 'Acceso básico para operaciones diarias',
    permissions: [
      'users.view',
      'inventory.view', 'inventory.create',
      'reports.view',
      'profile.view', 'profile.edit',
      'sidebar.dashboard', 'sidebar.inventory', 'sidebar.reports'
    ],
    color: 'yellow',
    isSystem: false,
    userCount: 25,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-15'
  },
  {
    id: '5',
    name: 'Invitado',
    description: 'Acceso de solo lectura para visitantes',
    permissions: [
      'inventory.view',
      'reports.view',
      'profile.view',
      'sidebar.dashboard', 'sidebar.inventory'
    ],
    color: 'gray',
    isSystem: false,
    userCount: 3,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-10'
  }
]

function RoleManagementContent() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { openModal } = useModal()
  const { addToast } = useToast()

  const handleRoleCreate = useCallback(() => {
    openModal(
      <RoleForm
        onSubmit={async (roleData) => {
          setIsLoading(true)
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const newRole: RoleData = {
            ...roleData,
            id: Date.now().toString(),
            userCount: 0,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          }
          
          setRoles(prev => [...prev, newRole])
          setIsLoading(false)
        }}
        isLoading={isLoading}
        availablePermissions={AVAILABLE_PERMISSIONS}
      />,
      { size: 'xl' }
    )
  }, [openModal, setIsLoading])

  const handleRoleEdit = useCallback((role: RoleData) => {
    openModal(
      <RoleForm
        role={role}
        onSubmit={async (roleData) => {
          setIsLoading(true)
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          setRoles(prev => prev.map(r => r.id === role.id ? { 
            ...roleData, 
            id: role.id,
            userCount: role.userCount,
            createdAt: role.createdAt,
            updatedAt: new Date().toISOString().split('T')[0]
          } : r))
          setIsLoading(false)
        }}
        isLoading={isLoading}
        availablePermissions={AVAILABLE_PERMISSIONS}
      />,
      { size: 'xl' }
    )
  }, [openModal, setIsLoading])

  const handleRoleDelete = useCallback(async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      addToast({
        type: 'error',
        title: 'No se puede eliminar',
        description: 'Los roles del sistema no pueden ser eliminados'
      })
      return
    }

    if (role?.userCount && role.userCount > 0) {
      addToast({
        type: 'error',
        title: 'No se puede eliminar',
        description: `Este rol está asignado a ${role.userCount} usuario(s). Reasigna los usuarios antes de eliminar el rol.`
      })
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setRoles(prev => prev.filter(r => r.id !== roleId))
    setIsLoading(false)
  }, [roles, addToast, setIsLoading])

  const handleRoleView = useCallback((role: RoleData) => {
    openModal(
      <RoleDetailsModal role={role} availablePermissions={AVAILABLE_PERMISSIONS} />,
      { size: 'lg' }
    )
  }, [openModal])

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
    setRoles(mockRoles)
  }, [])

  // Prevent hydration mismatch by showing loading until client-side
  if (!isClient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Cargando gestión de roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="custom-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RoleGrid
          roles={roles}
          isLoading={isLoading}
          onRoleCreate={handleRoleCreate}
          onRoleEdit={handleRoleEdit}
          onRoleDelete={handleRoleDelete}
          onRoleView={handleRoleView}
          availablePermissions={AVAILABLE_PERMISSIONS}
        />
      </div>
    </div>
  )
}

// Role Details Modal Component
function RoleDetailsModal({ 
  role, 
  availablePermissions 
}: { 
  role: RoleData
  availablePermissions: typeof AVAILABLE_PERMISSIONS
}) {
  const getRoleColor = (color: string) => {
    const colors = {
      red: 'text-red-600 bg-red-100 border-red-200',
      blue: 'text-blue-600 bg-blue-100 border-blue-200',
      green: 'text-green-600 bg-green-100 border-green-200',
      yellow: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      gray: 'text-gray-600 bg-gray-100 border-gray-200',
      purple: 'text-purple-600 bg-purple-100 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.gray
  }

  const groupedPermissions = availablePermissions
    .filter(p => role.permissions.includes(p.id))
    .reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, typeof availablePermissions>)

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`p-3 rounded-full border-2 ${getRoleColor(role.color)}`}>
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{role.name}</h2>
            {role.isSystem && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                Rol del Sistema
              </span>
            )}
          </div>
        </div>
        <p className="text-lg text-gray-600 mb-4">{role.description}</p>
        
        <div className="flex justify-center gap-6 text-sm text-gray-600">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{role.userCount}</div>
            <div>Usuarios asignados</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{role.permissions.length}</div>
            <div>Permisos</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Role Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Rol</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Creado:</span>
              <span className="font-medium text-gray-900">
                {new Date(role.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última actualización:</span>
              <span className="font-medium text-gray-900">
                {new Date(role.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Permissions by Category */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Permisos por Categoría</h3>
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, permissions]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-3 bg-white">
                <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {permission.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RolesPage() {
  return (
    <ToastProvider>
      <ModalProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <RoleManagementContent />
            </div>
          </main>
        </div>
      </ModalProvider>
    </ToastProvider>
  )
}