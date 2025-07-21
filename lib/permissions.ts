// Automated permission system - Dynamically generates permissions based on existing app routes
// This file should be updated whenever new routes/functionalities are added to the app

export interface AppRoute {
  path: string
  name: string
  hasCreate: boolean
  hasEdit?: boolean
  hasDelete?: boolean
  customPermissions?: string[]
}

// Define the actual existing routes in the app
// Update this array when adding new pages/functionalities
export const APP_ROUTES: AppRoute[] = [
  { 
    path: 'dashboard', 
    name: 'Dashboard', 
    hasCreate: false,
    hasEdit: false,
    hasDelete: false
  },
  { 
    path: 'users', 
    name: 'Usuarios', 
    hasCreate: true,
    hasEdit: true,
    hasDelete: true
  },
  { 
    path: 'roles', 
    name: 'Roles', 
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    customPermissions: ['assign'] // roles.assign
  },
  { 
    path: 'inventory', 
    name: 'Inventario', 
    hasCreate: true,
    hasEdit: true,
    hasDelete: true
  },
  { 
    path: 'categories', 
    name: 'Categorías', 
    hasCreate: true,
    hasEdit: true,
    hasDelete: true
  },
  { 
    path: 'locations', 
    name: 'Ubicaciones', 
    hasCreate: true,
    hasEdit: true,
    hasDelete: true
  },
  { 
    path: 'settings', 
    name: 'Configuración', 
    hasCreate: false,
    hasEdit: true,
    hasDelete: false
  }
]

export interface Permission {
  id: string
  name: string
  category: string
}

// Generate permissions automatically from routes
export const generatePermissionsFromRoutes = (): Permission[] => {
  const permissions: Permission[] = []

  // Generate CRUD permissions for each route
  APP_ROUTES.forEach(route => {
    const category = route.name
    
    // Always add view permission
    permissions.push({
      id: `${route.path}.view`,
      name: `Ver ${route.name.toLowerCase()}`,
      category
    })

    // Add create permission if supported
    if (route.hasCreate) {
      permissions.push({
        id: `${route.path}.create`,
        name: `Crear ${route.name.toLowerCase()}`,
        category
      })
    }

    // Add edit permission if supported
    if (route.hasEdit) {
      permissions.push({
        id: `${route.path}.edit`,
        name: `Editar ${route.name.toLowerCase()}`,
        category
      })
    }

    // Add delete permission if supported
    if (route.hasDelete) {
      permissions.push({
        id: `${route.path}.delete`,
        name: `Eliminar ${route.name.toLowerCase()}`,
        category
      })
    }

    // Add custom permissions
    if (route.customPermissions) {
      route.customPermissions.forEach(customPerm => {
        permissions.push({
          id: `${route.path}.${customPerm}`,
          name: `${getCustomPermissionName(customPerm)} ${route.name.toLowerCase()}`,
          category
        })
      })
    }

    // Add navigation permission for each route
    permissions.push({
      id: `sidebar.${route.path}`,
      name: `Ver sección ${route.name}`,
      category: 'Navegación'
    })
  })

  // Add special system permissions
  permissions.push(
    // System administration
    {
      id: 'system.admin',
      name: 'Administración del sistema',
      category: 'Sistema'
    },
    {
      id: 'system.backup',
      name: 'Respaldos del sistema',
      category: 'Sistema'
    },
    // Profile management
    {
      id: 'profile.view',
      name: 'Ver perfil propio',
      category: 'Perfil'
    },
    {
      id: 'profile.edit',
      name: 'Editar perfil propio',
      category: 'Perfil'
    }
  )

  return permissions
}

// Helper function to get custom permission names
const getCustomPermissionName = (permission: string): string => {
  const permissionNames: Record<string, string> = {
    'assign': 'Asignar',
    'export': 'Exportar',
    'import': 'Importar',
    'manage': 'Gestionar'
  }
  
  return permissionNames[permission] || permission
}

// Available permissions in the system - Automatically generated from existing routes
export const AVAILABLE_PERMISSIONS = generatePermissionsFromRoutes()

// Helper function to check if a route exists
export const routeExists = (path: string): boolean => {
  return APP_ROUTES.some(route => route.path === path)
}

// Helper function to get permissions for a specific route
export const getRoutePermissions = (path: string): Permission[] => {
  return AVAILABLE_PERMISSIONS.filter(permission => 
    permission.id.startsWith(`${path}.`) || permission.id === `sidebar.${path}`
  )
}

// Helper function to validate permissions against existing routes
export const validatePermissions = (permissions: string[]): { valid: string[], invalid: string[] } => {
  const valid: string[] = []
  const invalid: string[] = []
  
  const availablePermissionIds = AVAILABLE_PERMISSIONS.map(p => p.id)
  
  permissions.forEach(permission => {
    if (availablePermissionIds.includes(permission)) {
      valid.push(permission)
    } else {
      invalid.push(permission)
    }
  })
  
  return { valid, invalid }
}