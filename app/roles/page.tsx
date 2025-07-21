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
import { AVAILABLE_PERMISSIONS } from '@/lib/permissions'
import { roleService } from '@/lib/database'

function RoleManagementContent() {
  const [roles, setRoles] = useState<RoleData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { openModal } = useModal()
  const { addToast } = useToast()

  // Load roles from database
  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true)
      const rolesData = await roleService.getAll()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error loading roles:', error)
      addToast({
        type: 'error',
        title: 'Error al cargar roles',
        description: 'No se pudieron cargar los roles desde la base de datos'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  const handleRoleCreate = useCallback(() => {
    openModal(
      <RoleForm
        onSubmit={async (roleData) => {
          try {
            setIsLoading(true)
            const newRole = await roleService.create(roleData)
            setRoles(prev => [...prev, newRole])
            addToast({
              type: 'success',
              title: 'Rol creado exitosamente',
              description: `El rol "${newRole.name}" ha sido creado`
            })
          } catch (error) {
            console.error('Error creating role:', error)
            addToast({
              type: 'error',
              title: 'Error al crear rol',
              description: 'No se pudo crear el rol'
            })
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
        availablePermissions={AVAILABLE_PERMISSIONS}
      />,
      { size: 'xl' }
    )
  }, [openModal, addToast])

  const handleRoleEdit = useCallback((role: RoleData) => {
    openModal(
      <RoleForm
        role={role}
        onSubmit={async (roleData) => {
          try {
            setIsLoading(true)
            const updatedRole = await roleService.update(role.id, roleData)
            setRoles(prev => prev.map(r => r.id === role.id ? updatedRole : r))
            addToast({
              type: 'success',
              title: 'Rol actualizado exitosamente',
              description: `El rol "${updatedRole.name}" ha sido actualizado`
            })
          } catch (error) {
            console.error('Error updating role:', error)
            addToast({
              type: 'error',
              title: 'Error al actualizar rol',
              description: 'No se pudo actualizar el rol'
            })
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
        availablePermissions={AVAILABLE_PERMISSIONS}
      />,
      { size: 'xl' }
    )
  }, [openModal, addToast])

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

    try {
      setIsLoading(true)
      await roleService.delete(roleId)
      setRoles(prev => prev.filter(r => r.id !== roleId))
      addToast({
        type: 'success',
        title: 'Rol eliminado exitosamente',
        description: 'El rol ha sido eliminado'
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      addToast({
        type: 'error',
        title: 'Error al eliminar rol',
        description: 'No se pudo eliminar el rol'
      })
    } finally {
      setIsLoading(false)
    }
  }, [roles, addToast])

  const handleRoleView = useCallback((role: RoleData) => {
    openModal(
      <RoleDetailsModal role={role} availablePermissions={AVAILABLE_PERMISSIONS} />,
      { size: 'lg' }
    )
  }, [openModal])

  // Handle client-side hydration and load roles
  useEffect(() => {
    setIsClient(true)
    loadRoles()
  }, [loadRoles])

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
                {role.createdAt ? new Date(role.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No disponible'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última actualización:</span>
              <span className="font-medium text-gray-900">
                {role.updatedAt ? new Date(role.updatedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No disponible'}
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