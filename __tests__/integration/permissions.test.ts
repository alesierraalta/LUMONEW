import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  APP_ROUTES, 
  generatePermissionsFromRoutes, 
  AVAILABLE_PERMISSIONS,
  routeExists,
  getRoutePermissions,
  validatePermissions,
  type AppRoute,
  type Permission
} from '@/lib/permissions'

describe('Permissions System Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('APP_ROUTES', () => {
    it('should be an array of AppRoute objects', () => {
      expect(Array.isArray(APP_ROUTES)).toBe(true)
      expect(APP_ROUTES.length).toBeGreaterThan(0)
    })

    it('should contain all expected routes', () => {
      const routePaths = APP_ROUTES.map(route => route.path)
      
      expect(routePaths).toContain('dashboard')
      expect(routePaths).toContain('users')
      expect(routePaths).toContain('roles')
      expect(routePaths).toContain('inventory')
      expect(routePaths).toContain('categories')
      expect(routePaths).toContain('locations')
      expect(routePaths).toContain('settings')
    })

    it('should have proper structure for each route', () => {
      APP_ROUTES.forEach(route => {
        expect(route).toHaveProperty('path')
        expect(route).toHaveProperty('name')
        expect(route).toHaveProperty('hasCreate')
        expect(typeof route.path).toBe('string')
        expect(typeof route.name).toBe('string')
        expect(typeof route.hasCreate).toBe('boolean')
        
        if (route.hasEdit !== undefined) {
          expect(typeof route.hasEdit).toBe('boolean')
        }
        
        if (route.hasDelete !== undefined) {
          expect(typeof route.hasDelete).toBe('boolean')
        }
        
        if (route.customPermissions !== undefined) {
          expect(Array.isArray(route.customPermissions)).toBe(true)
        }
      })
    })

    it('should have correct configuration for dashboard route', () => {
      const dashboardRoute = APP_ROUTES.find(route => route.path === 'dashboard')
      expect(dashboardRoute).toBeDefined()
      expect(dashboardRoute?.name).toBe('Dashboard')
      expect(dashboardRoute?.hasCreate).toBe(false)
      expect(dashboardRoute?.hasEdit).toBe(false)
      expect(dashboardRoute?.hasDelete).toBe(false)
    })

    it('should have correct configuration for users route', () => {
      const usersRoute = APP_ROUTES.find(route => route.path === 'users')
      expect(usersRoute).toBeDefined()
      expect(usersRoute?.name).toBe('Usuarios')
      expect(usersRoute?.hasCreate).toBe(true)
      expect(usersRoute?.hasEdit).toBe(true)
      expect(usersRoute?.hasDelete).toBe(true)
    })

    it('should have correct configuration for roles route with custom permissions', () => {
      const rolesRoute = APP_ROUTES.find(route => route.path === 'roles')
      expect(rolesRoute).toBeDefined()
      expect(rolesRoute?.name).toBe('Roles')
      expect(rolesRoute?.hasCreate).toBe(true)
      expect(rolesRoute?.hasEdit).toBe(true)
      expect(rolesRoute?.hasDelete).toBe(true)
      expect(rolesRoute?.customPermissions).toEqual(['assign'])
    })

    it('should have correct configuration for inventory route', () => {
      const inventoryRoute = APP_ROUTES.find(route => route.path === 'inventory')
      expect(inventoryRoute).toBeDefined()
      expect(inventoryRoute?.name).toBe('Inventario')
      expect(inventoryRoute?.hasCreate).toBe(true)
      expect(inventoryRoute?.hasEdit).toBe(true)
      expect(inventoryRoute?.hasDelete).toBe(true)
    })

    it('should have correct configuration for settings route', () => {
      const settingsRoute = APP_ROUTES.find(route => route.path === 'settings')
      expect(settingsRoute).toBeDefined()
      expect(settingsRoute?.name).toBe('Configuración')
      expect(settingsRoute?.hasCreate).toBe(false)
      expect(settingsRoute?.hasEdit).toBe(true)
      expect(settingsRoute?.hasDelete).toBe(false)
    })
  })

  describe('generatePermissionsFromRoutes', () => {
    it('should generate permissions array', () => {
      const permissions = generatePermissionsFromRoutes()
      
      expect(Array.isArray(permissions)).toBe(true)
      expect(permissions.length).toBeGreaterThan(0)
    })

    it('should generate permissions with correct structure', () => {
      const permissions = generatePermissionsFromRoutes()
      
      permissions.forEach(permission => {
        expect(permission).toHaveProperty('id')
        expect(permission).toHaveProperty('name')
        expect(permission).toHaveProperty('category')
        expect(typeof permission.id).toBe('string')
        expect(typeof permission.name).toBe('string')
        expect(typeof permission.category).toBe('string')
      })
    })

    it('should generate view permissions for all routes', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        const viewPermission = permissions.find(p => p.id === `${route.path}.view`)
        expect(viewPermission).toBeDefined()
        expect(viewPermission?.name).toBe(`Ver ${route.name.toLowerCase()}`)
        expect(viewPermission?.category).toBe(route.name)
      })
    })

    it('should generate create permissions for routes that support it', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        const createPermission = permissions.find(p => p.id === `${route.path}.create`)
        
        if (route.hasCreate) {
          expect(createPermission).toBeDefined()
          expect(createPermission?.name).toBe(`Crear ${route.name.toLowerCase()}`)
          expect(createPermission?.category).toBe(route.name)
        } else {
          expect(createPermission).toBeUndefined()
        }
      })
    })

    it('should generate edit permissions for routes that support it', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        const editPermission = permissions.find(p => p.id === `${route.path}.edit`)
        
        if (route.hasEdit) {
          expect(editPermission).toBeDefined()
          expect(editPermission?.name).toBe(`Editar ${route.name.toLowerCase()}`)
          expect(editPermission?.category).toBe(route.name)
        } else {
          expect(editPermission).toBeUndefined()
        }
      })
    })

    it('should generate delete permissions for routes that support it', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        const deletePermission = permissions.find(p => p.id === `${route.path}.delete`)
        
        if (route.hasDelete) {
          expect(deletePermission).toBeDefined()
          expect(deletePermission?.name).toBe(`Eliminar ${route.name.toLowerCase()}`)
          expect(deletePermission?.category).toBe(route.name)
        } else {
          expect(deletePermission).toBeUndefined()
        }
      })
    })

    it('should generate custom permissions for routes that have them', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        if (route.customPermissions) {
          route.customPermissions.forEach(customPerm => {
            const customPermission = permissions.find(p => p.id === `${route.path}.${customPerm}`)
            expect(customPermission).toBeDefined()
            expect(customPermission?.category).toBe(route.name)
          })
        }
      })
    })

    it('should generate sidebar navigation permissions', () => {
      const permissions = generatePermissionsFromRoutes()
      
      APP_ROUTES.forEach(route => {
        const sidebarPermission = permissions.find(p => p.id === `sidebar.${route.path}`)
        expect(sidebarPermission).toBeDefined()
        expect(sidebarPermission?.name).toBe(`Ver sección ${route.name}`)
        expect(sidebarPermission?.category).toBe('Navegación')
      })
    })

    it('should generate system permissions', () => {
      const permissions = generatePermissionsFromRoutes()
      
      const systemAdmin = permissions.find(p => p.id === 'system.admin')
      expect(systemAdmin).toBeDefined()
      expect(systemAdmin?.name).toBe('Administración del sistema')
      expect(systemAdmin?.category).toBe('Sistema')

      const systemBackup = permissions.find(p => p.id === 'system.backup')
      expect(systemBackup).toBeDefined()
      expect(systemBackup?.name).toBe('Respaldos del sistema')
      expect(systemBackup?.category).toBe('Sistema')
    })

    it('should generate profile permissions', () => {
      const permissions = generatePermissionsFromRoutes()
      
      const profileView = permissions.find(p => p.id === 'profile.view')
      expect(profileView).toBeDefined()
      expect(profileView?.name).toBe('Ver perfil propio')
      expect(profileView?.category).toBe('Perfil')

      const profileEdit = permissions.find(p => p.id === 'profile.edit')
      expect(profileEdit).toBeDefined()
      expect(profileEdit?.name).toBe('Editar perfil propio')
      expect(profileEdit?.category).toBe('Perfil')
    })

    it('should generate unique permission IDs', () => {
      const permissions = generatePermissionsFromRoutes()
      const permissionIds = permissions.map(p => p.id)
      const uniqueIds = Array.from(new Set(permissionIds))
      
      expect(permissionIds.length).toBe(uniqueIds.length)
    })
  })

  describe('AVAILABLE_PERMISSIONS', () => {
    it('should be the result of generatePermissionsFromRoutes', () => {
      const generated = generatePermissionsFromRoutes()
      expect(AVAILABLE_PERMISSIONS).toEqual(generated)
    })

    it('should contain expected number of permissions', () => {
      expect(AVAILABLE_PERMISSIONS.length).toBeGreaterThan(20) // Should have many permissions
    })

    it('should contain permissions for all routes', () => {
      APP_ROUTES.forEach(route => {
        const routePermissions = AVAILABLE_PERMISSIONS.filter(p => 
          p.id.startsWith(`${route.path}.`) || p.id === `sidebar.${route.path}`
        )
        expect(routePermissions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('routeExists', () => {
    it('should return true for existing routes', () => {
      expect(routeExists('dashboard')).toBe(true)
      expect(routeExists('users')).toBe(true)
      expect(routeExists('inventory')).toBe(true)
      expect(routeExists('categories')).toBe(true)
      expect(routeExists('locations')).toBe(true)
      expect(routeExists('settings')).toBe(true)
    })

    it('should return false for non-existing routes', () => {
      expect(routeExists('nonexistent')).toBe(false)
      expect(routeExists('fake-route')).toBe(false)
      expect(routeExists('')).toBe(false)
    })

    it('should be case sensitive', () => {
      expect(routeExists('Dashboard')).toBe(false)
      expect(routeExists('USERS')).toBe(false)
    })
  })

  describe('getRoutePermissions', () => {
    it('should return permissions for existing routes', () => {
      const dashboardPermissions = getRoutePermissions('dashboard')
      expect(dashboardPermissions.length).toBeGreaterThan(0)
      
      const hasViewPermission = dashboardPermissions.some(p => p.id === 'dashboard.view')
      const hasSidebarPermission = dashboardPermissions.some(p => p.id === 'sidebar.dashboard')
      
      expect(hasViewPermission).toBe(true)
      expect(hasSidebarPermission).toBe(true)
    })

    it('should return correct permissions for users route', () => {
      const userPermissions = getRoutePermissions('users')
      const permissionIds = userPermissions.map(p => p.id)
      
      expect(permissionIds).toContain('users.view')
      expect(permissionIds).toContain('users.create')
      expect(permissionIds).toContain('users.edit')
      expect(permissionIds).toContain('users.delete')
      expect(permissionIds).toContain('sidebar.users')
    })

    it('should return correct permissions for roles route with custom permissions', () => {
      const rolePermissions = getRoutePermissions('roles')
      const permissionIds = rolePermissions.map(p => p.id)
      
      expect(permissionIds).toContain('roles.view')
      expect(permissionIds).toContain('roles.create')
      expect(permissionIds).toContain('roles.edit')
      expect(permissionIds).toContain('roles.delete')
      expect(permissionIds).toContain('roles.assign')
      expect(permissionIds).toContain('sidebar.roles')
    })

    it('should return empty array for non-existing routes', () => {
      const nonExistentPermissions = getRoutePermissions('nonexistent')
      expect(nonExistentPermissions).toEqual([])
    })

    it('should return different permissions for different routes', () => {
      const dashboardPermissions = getRoutePermissions('dashboard')
      const usersPermissions = getRoutePermissions('users')
      
      expect(dashboardPermissions).not.toEqual(usersPermissions)
    })
  })

  describe('validatePermissions', () => {
    it('should validate existing permissions as valid', () => {
      const testPermissions = ['dashboard.view', 'users.create', 'inventory.edit']
      const result = validatePermissions(testPermissions)
      
      expect(result.valid).toEqual(testPermissions)
      expect(result.invalid).toEqual([])
    })

    it('should identify invalid permissions', () => {
      const testPermissions = ['nonexistent.view', 'fake.create', 'invalid.permission']
      const result = validatePermissions(testPermissions)
      
      expect(result.valid).toEqual([])
      expect(result.invalid).toEqual(testPermissions)
    })

    it('should handle mixed valid and invalid permissions', () => {
      const testPermissions = ['dashboard.view', 'nonexistent.view', 'users.create', 'fake.permission']
      const result = validatePermissions(testPermissions)
      
      expect(result.valid).toContain('dashboard.view')
      expect(result.valid).toContain('users.create')
      expect(result.invalid).toContain('nonexistent.view')
      expect(result.invalid).toContain('fake.permission')
    })

    it('should handle empty permissions array', () => {
      const result = validatePermissions([])
      
      expect(result.valid).toEqual([])
      expect(result.invalid).toEqual([])
    })

    it('should handle system and profile permissions', () => {
      const testPermissions = ['system.admin', 'profile.view', 'system.backup', 'profile.edit']
      const result = validatePermissions(testPermissions)
      
      expect(result.valid).toEqual(testPermissions)
      expect(result.invalid).toEqual([])
    })

    it('should handle sidebar permissions', () => {
      const testPermissions = ['sidebar.dashboard', 'sidebar.users', 'sidebar.inventory']
      const result = validatePermissions(testPermissions)
      
      expect(result.valid).toEqual(testPermissions)
      expect(result.invalid).toEqual([])
    })
  })

  describe('Permission System Integration', () => {
    it('should maintain consistency between routes and permissions', () => {
      APP_ROUTES.forEach(route => {
        // Every route should have at least a view permission
        const viewPermission = AVAILABLE_PERMISSIONS.find(p => p.id === `${route.path}.view`)
        expect(viewPermission).toBeDefined()
        
        // Every route should have a sidebar permission
        const sidebarPermission = AVAILABLE_PERMISSIONS.find(p => p.id === `sidebar.${route.path}`)
        expect(sidebarPermission).toBeDefined()
        
        // Routes with hasCreate should have create permission
        if (route.hasCreate) {
          const createPermission = AVAILABLE_PERMISSIONS.find(p => p.id === `${route.path}.create`)
          expect(createPermission).toBeDefined()
        }
        
        // Routes with hasEdit should have edit permission
        if (route.hasEdit) {
          const editPermission = AVAILABLE_PERMISSIONS.find(p => p.id === `${route.path}.edit`)
          expect(editPermission).toBeDefined()
        }
        
        // Routes with hasDelete should have delete permission
        if (route.hasDelete) {
          const deletePermission = AVAILABLE_PERMISSIONS.find(p => p.id === `${route.path}.delete`)
          expect(deletePermission).toBeDefined()
        }
      })
    })

    it('should have proper permission naming conventions', () => {
      AVAILABLE_PERMISSIONS.forEach(permission => {
        // Permission IDs should follow dot notation
        expect(permission.id).toMatch(/^[a-z]+\.[a-z_]+$/)
        
        // Permission names should not be empty
        expect(permission.name.length).toBeGreaterThan(0)
        
        // Categories should not be empty
        expect(permission.category.length).toBeGreaterThan(0)
      })
    })

    it('should generate deterministic results', () => {
      const permissions1 = generatePermissionsFromRoutes()
      const permissions2 = generatePermissionsFromRoutes()
      
      expect(permissions1).toEqual(permissions2)
    })
  })
})