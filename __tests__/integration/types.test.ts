import { describe, it, expect } from 'vitest'
import type {
  SpanishFieldLabels,
  InventoryItem,
  Category,
  Location,
  User,
  InventoryMovement,
  QuickStockOperation,
  BulkOperation,
  SyncStatus,
  DashboardMetrics,
  ActivityLog,
  InventoryFormData,
  CategoryFormData,
  LocationFormData,
  UserFormData,
  FilterOptions,
  ImportOperation,
  ExportOperation,
  ChartData,
  TableColumn,
  PaginationInfo,
  ApiResponse,
  ValidationError,
  ApiError,
  SystemConfig,
  InfoCard,
  StatCard,
  NotificationCard,
  ActionCard,
  ActivityCard,
  MetricCard,
  TipCard,
  ChartCard,
  ListCard,
  CardContext,
  CardFilters,
  CardSettings,
  CardFactory,
  PageCardConfig
} from '@/lib/types'

describe('Types Library Integration Tests', () => {
  describe('SpanishFieldLabels', () => {
    it('should have correct Spanish field labels structure', () => {
      const labels: SpanishFieldLabels = {
        sku: 'SKU',
        producto: 'Producto',
        descripcion: 'Descripción',
        categoria: 'Categoría',
        precio: 'Precio',
        costo: 'Costo',
        margen: 'Margen',
        stockActual: 'Stock Actual',
        nivelMinimo: 'Nivel Mínimo',
        estado: 'Estado',
        ubicacion: 'Ubicación',
        ultimaActualizacion: 'Última Actualización',
        acciones: 'Acciones'
      }

      expect(labels.sku).toBe('SKU')
      expect(labels.producto).toBe('Producto')
      expect(labels.descripcion).toBe('Descripción')
      expect(labels.categoria).toBe('Categoría')
      expect(labels.precio).toBe('Precio')
      expect(labels.costo).toBe('Costo')
      expect(labels.margen).toBe('Margen')
      expect(labels.stockActual).toBe('Stock Actual')
      expect(labels.nivelMinimo).toBe('Nivel Mínimo')
      expect(labels.estado).toBe('Estado')
      expect(labels.ubicacion).toBe('Ubicación')
      expect(labels.ultimaActualizacion).toBe('Última Actualización')
      expect(labels.acciones).toBe('Acciones')
    })
  })

  describe('InventoryItem', () => {
    it('should create valid inventory item with all required fields', () => {
      const item: InventoryItem = {
        id: 'item-1',
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        categoryId: 'cat-1',
        price: 100,
        cost: 50,
        margin: 50,
        currentStock: 25,
        minimumLevel: 10,
        status: 'active',
        locationId: 'loc-1',
        tags: ['electronics', 'mobile'],
        images: ['image1.jpg', 'image2.jpg'],
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced',
        autoReorder: true
      }

      expect(item.id).toBe('item-1')
      expect(item.sku).toBe('SKU-001')
      expect(item.name).toBe('Test Product')
      expect(item.status).toBe('active')
      expect(item.tags).toHaveLength(2)
      expect(item.autoReorder).toBe(true)
    })

    it('should support optional fields', () => {
      const item: InventoryItem = {
        id: 'item-1',
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        categoryId: 'cat-1',
        price: 100,
        cost: 50,
        margin: 50,
        currentStock: 25,
        minimumLevel: 10,
        status: 'active',
        locationId: 'loc-1',
        tags: [],
        images: [],
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced',
        autoReorder: false,
        maximumLevel: 100,
        reorderPoint: 15,
        dimensions: {
          length: 10,
          width: 5,
          height: 2,
          weight: 0.5,
          unit: 'cm',
          weightUnit: 'kg'
        },
        supplier: {
          id: 'sup-1',
          name: 'Test Supplier',
          contactInfo: 'supplier@test.com'
        },
        barcode: '1234567890123',
        lastSyncAt: new Date(),
        autoReorderQuantity: 50,
        seasonalDemand: {
          season: 'summer',
          demandMultiplier: 1.5
        }
      }

      expect(item.maximumLevel).toBe(100)
      expect(item.dimensions?.unit).toBe('cm')
      expect(item.supplier?.name).toBe('Test Supplier')
      expect(item.seasonalDemand?.season).toBe('summer')
    })

    it('should enforce status enum values', () => {
      const validStatuses: InventoryItem['status'][] = ['active', 'inactive', 'discontinued', 'pending']
      
      validStatuses.forEach(status => {
        const item: Partial<InventoryItem> = { status }
        expect(item.status).toBe(status)
      })
    })

    it('should enforce syncStatus enum values', () => {
      const validSyncStatuses: InventoryItem['syncStatus'][] = ['synced', 'pending', 'error']
      
      validSyncStatuses.forEach(syncStatus => {
        const item: Partial<InventoryItem> = { syncStatus }
        expect(item.syncStatus).toBe(syncStatus)
      })
    })
  })

  describe('Category', () => {
    it('should create valid category with hierarchical structure', () => {
      const category: Category = {
        id: 'cat-1',
        name: 'Electronics',
        description: 'Electronic devices',
        color: '#3B82F6',
        icon: 'laptop',
        parentId: 'parent-cat',
        level: 1,
        path: ['parent-cat'],
        itemCount: 25,
        totalValue: 50000,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced'
      }

      expect(category.id).toBe('cat-1')
      expect(category.name).toBe('Electronics')
      expect(category.level).toBe(1)
      expect(category.path).toEqual(['parent-cat'])
      expect(category.itemCount).toBe(25)
      expect(category.isActive).toBe(true)
    })

    it('should support optional parent-child relationships', () => {
      const parentCategory: Category = {
        id: 'parent-1',
        name: 'Parent Category',
        level: 0,
        path: [],
        itemCount: 0,
        totalValue: 0,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced',
        children: [
          {
            id: 'child-1',
            name: 'Child Category',
            parentId: 'parent-1',
            level: 1,
            path: ['parent-1'],
            itemCount: 5,
            totalValue: 1000,
            isActive: true,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'user-1',
            updatedBy: 'user-1',
            syncStatus: 'synced'
          }
        ]
      }

      expect(parentCategory.children).toHaveLength(1)
      expect(parentCategory.children?.[0].parentId).toBe('parent-1')
    })
  })

  describe('Location', () => {
    it('should create valid location with simplified structure', () => {
      const location: Location = {
        id: 'loc-1',
        name: 'Warehouse A - Shelf 1',
        description: 'Main storage shelf for electronics',
        itemQuantity: 150
      }

      expect(location.id).toBe('loc-1')
      expect(location.name).toBe('Warehouse A - Shelf 1')
      expect(location.itemQuantity).toBe(150)
    })

    it('should support optional description', () => {
      const location: Location = {
        id: 'loc-2',
        name: 'Shelf 2',
        itemQuantity: 75
      }

      expect(location.description).toBeUndefined()
      expect(location.itemQuantity).toBe(75)
    })
  })

  describe('User', () => {
    it('should create valid user with all permissions and preferences', () => {
      const user: User = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        avatar: 'avatar.jpg',
        isActive: true,
        lastLogin: new Date(),
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
        accessibleLocations: ['loc-1', 'loc-2'],
        defaultLocation: 'loc-1',
        preferences: {
          language: 'es',
          theme: 'dark',
          dateFormat: 'DD/MM/YYYY',
          currency: 'USD',
          notifications: {
            email: true,
            push: false,
            lowStock: true,
            bulkOperations: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin'
      }

      expect(user.role).toBe('admin')
      expect(user.permissions.canManageUsers).toBe(true)
      expect(user.preferences.language).toBe('es')
      expect(user.accessibleLocations).toHaveLength(2)
    })

    it('should enforce role enum values', () => {
      const validRoles: User['role'][] = ['admin', 'manager', 'employee', 'viewer', 'auditor']
      
      validRoles.forEach(role => {
        const user: Partial<User> = { role }
        expect(user.role).toBe(role)
      })
    })
  })

  describe('InventoryMovement', () => {
    it('should create valid inventory movement', () => {
      const movement: InventoryMovement = {
        id: 'mov-1',
        itemId: 'item-1',
        itemName: 'Test Product',
        itemSku: 'SKU-001',
        type: 'in',
        quantity: 10,
        unitCost: 50,
        totalCost: 500,
        fromLocationId: 'loc-1',
        fromLocationName: 'Warehouse A',
        toLocationId: 'loc-2',
        toLocationName: 'Warehouse B',
        referenceType: 'purchase_order',
        referenceId: 'po-123',
        referenceNumber: 'PO-2023-001',
        userId: 'user-1',
        userName: 'John Doe',
        approvedBy: 'manager-1',
        approvedAt: new Date(),
        status: 'completed',
        notes: 'Regular stock replenishment',
        batchNumber: 'BATCH-001',
        serialNumbers: ['SN001', 'SN002'],
        expirationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      }

      expect(movement.type).toBe('in')
      expect(movement.quantity).toBe(10)
      expect(movement.status).toBe('completed')
      expect(movement.serialNumbers).toHaveLength(2)
    })

    it('should enforce movement type enum values', () => {
      const validTypes: InventoryMovement['type'][] = ['in', 'out', 'transfer', 'adjustment', 'return', 'damaged', 'expired']
      
      validTypes.forEach(type => {
        const movement: Partial<InventoryMovement> = { type }
        expect(movement.type).toBe(type)
      })
    })
  })

  describe('QuickStockOperation', () => {
    it('should create valid quick stock operation', () => {
      const operation: QuickStockOperation = {
        id: 'qso-1',
        itemId: 'item-1',
        itemName: 'Test Product',
        itemSku: 'SKU-001',
        locationId: 'loc-1',
        locationName: 'Warehouse A',
        operation: 'add',
        quantity: 5,
        reason: 'received',
        notes: 'New shipment arrived',
        previousStock: 20,
        newStock: 25,
        userId: 'user-1',
        userName: 'John Doe',
        requiresApproval: false,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      }

      expect(operation.operation).toBe('add')
      expect(operation.reason).toBe('received')
      expect(operation.newStock).toBe(25)
      expect(operation.requiresApproval).toBe(false)
    })

    it('should enforce operation enum values', () => {
      const validOperations: QuickStockOperation['operation'][] = ['add', 'subtract']
      
      validOperations.forEach(operation => {
        const qso: Partial<QuickStockOperation> = { operation }
        expect(qso.operation).toBe(operation)
      })
    })

    it('should enforce reason enum values', () => {
      const validReasons: QuickStockOperation['reason'][] = ['received', 'sold', 'damaged', 'expired', 'found', 'lost', 'adjustment', 'other']
      
      validReasons.forEach(reason => {
        const qso: Partial<QuickStockOperation> = { reason }
        expect(qso.reason).toBe(reason)
      })
    })
  })

  describe('BulkOperation', () => {
    it('should create valid bulk operation', () => {
      const bulkOp: BulkOperation = {
        id: 'bulk-1',
        type: 'update',
        entityType: 'items',
        targetIds: ['item-1', 'item-2', 'item-3'],
        totalTargets: 3,
        parameters: { status: 'active', price: 100 },
        status: 'completed',
        processedCount: 3,
        successCount: 3,
        failedCount: 0,
        errors: [],
        userId: 'user-1',
        userName: 'John Doe',
        startedAt: new Date(),
        completedAt: new Date(),
        estimatedDuration: 30000,
        requiresApproval: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(bulkOp.type).toBe('update')
      expect(bulkOp.entityType).toBe('items')
      expect(bulkOp.targetIds).toHaveLength(3)
      expect(bulkOp.successCount).toBe(3)
      expect(bulkOp.errors).toHaveLength(0)
    })

    it('should enforce bulk operation type enum values', () => {
      const validTypes: BulkOperation['type'][] = ['update', 'delete', 'archive', 'transfer', 'price_update', 'category_change', 'status_change']
      
      validTypes.forEach(type => {
        const bulkOp: Partial<BulkOperation> = { type }
        expect(bulkOp.type).toBe(type)
      })
    })
  })

  describe('FilterOptions', () => {
    it('should create valid filter options with all possible filters', () => {
      const filters: FilterOptions = {
        search: 'test product',
        category: 'electronics',
        location: 'warehouse-a',
        status: 'active',
        stockStatus: 'low_stock',
        lowStock: true,
        outOfStock: false,
        overStock: false,
        stockRange: { min: 0, max: 100 },
        priceRange: { min: 10, max: 1000 },
        dateRange: { start: new Date('2023-01-01'), end: new Date('2023-12-31') },
        createdDateRange: { start: new Date('2023-01-01'), end: new Date('2023-12-31') },
        updatedDateRange: { start: new Date('2023-01-01'), end: new Date('2023-12-31') },
        tags: ['electronics', 'mobile'],
        supplier: 'supplier-1',
        hasImages: true,
        autoReorder: false,
        requiresApproval: true,
        categoryPath: ['parent', 'child'],
        locationPath: ['warehouse', 'shelf'],
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        limit: 50
      }

      expect(filters.search).toBe('test product')
      expect(filters.stockStatus).toBe('low_stock')
      expect(filters.tags).toHaveLength(2)
      expect(filters.sortOrder).toBe('asc')
      expect(filters.page).toBe(1)
    })

    it('should support partial filter options', () => {
      const filters: FilterOptions = {
        search: 'test',
        status: 'active'
      }

      expect(filters.search).toBe('test')
      expect(filters.status).toBe('active')
      expect(filters.category).toBeUndefined()
    })
  })

  describe('ApiResponse', () => {
    it('should create valid API response with data', () => {
      const response: ApiResponse<InventoryItem[]> = {
        data: [],
        success: true,
        message: 'Items retrieved successfully',
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
          hasNext: true,
          hasPrev: false
        },
        metadata: { queryTime: 150 }
      }

      expect(response.success).toBe(true)
      expect(response.pagination?.totalPages).toBe(2)
      expect(response.metadata?.queryTime).toBe(150)
    })

    it('should support different data types', () => {
      const stringResponse: ApiResponse<string> = {
        data: 'success',
        success: true
      }

      const numberResponse: ApiResponse<number> = {
        data: 42,
        success: true
      }

      const objectResponse: ApiResponse<{ count: number }> = {
        data: { count: 10 },
        success: true
      }

      expect(stringResponse.data).toBe('success')
      expect(numberResponse.data).toBe(42)
      expect(objectResponse.data.count).toBe(10)
    })
  })

  describe('InfoCard and Card Types', () => {
    it('should create valid StatCard', () => {
      const statCard: StatCard = {
        id: 'stat-1',
        type: 'stat',
        title: 'Total Items',
        subtitle: 'In inventory',
        icon: 'package',
        iconColor: 'blue',
        priority: 'medium',
        size: 'medium',
        variant: 'default',
        color: 'blue',
        pageContext: ['dashboard'],
        userRoles: ['admin', 'manager'],
        createdAt: new Date(),
        value: 1250,
        previousValue: 1200,
        change: {
          value: 50,
          percentage: 4.17,
          trend: 'up'
        },
        format: 'number',
        unit: 'items'
      }

      expect(statCard.type).toBe('stat')
      expect(statCard.value).toBe(1250)
      expect(statCard.change?.trend).toBe('up')
      expect(statCard.format).toBe('number')
    })

    it('should create valid NotificationCard', () => {
      const notificationCard: NotificationCard = {
        id: 'notif-1',
        type: 'notification',
        title: 'Low Stock Alert',
        priority: 'high',
        size: 'medium',
        variant: 'filled',
        color: 'red',
        pageContext: ['inventory'],
        userRoles: ['admin', 'manager'],
        createdAt: new Date(),
        message: '5 items are running low on stock',
        severity: 'warning',
        actions: [
          {
            label: 'View Items',
            action: () => {},
            variant: 'primary'
          },
          {
            label: 'Dismiss',
            action: () => {},
            variant: 'secondary'
          }
        ],
        autoHide: true,
        hideAfter: 5000
      }

      expect(notificationCard.type).toBe('notification')
      expect(notificationCard.severity).toBe('warning')
      expect(notificationCard.actions).toHaveLength(2)
      expect(notificationCard.autoHide).toBe(true)
    })

    it('should create valid ChartCard', () => {
      const chartCard: ChartCard = {
        id: 'chart-1',
        type: 'chart',
        title: 'Stock Levels Over Time',
        priority: 'medium',
        size: 'large',
        variant: 'default',
        pageContext: ['dashboard'],
        userRoles: ['admin', 'manager'],
        createdAt: new Date(),
        chartType: 'line',
        chartData: [
          { date: '2023-01-01', value: 100 },
          { date: '2023-01-02', value: 120 },
          { date: '2023-01-03', value: 90 }
        ],
        chartConfig: {
          xAxisKey: 'date',
          yAxisKey: 'value',
          colors: ['#3B82F6'],
          showLegend: true,
          showGrid: true,
          showTooltip: true
        },
        timeRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31'),
          granularity: 'day'
        }
      }

      expect(chartCard.type).toBe('chart')
      expect(chartCard.chartType).toBe('line')
      expect(chartCard.chartData).toHaveLength(3)
      expect(chartCard.timeRange?.granularity).toBe('day')
    })
  })

  describe('SystemConfig', () => {
    it('should create valid system configuration', () => {
      const config: SystemConfig = {
        companyName: 'LUMO Inventory',
        currency: 'USD',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'America/Caracas',
        language: 'es',
        allowNegativeStock: false,
        autoCalculateMargin: true,
        defaultMinimumLevel: 10,
        lowStockThreshold: 5,
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        auditRetentionDays: 365,
        detailedAuditLogging: true,
        autoSync: true,
        syncInterval: 300000,
        maxRetries: 3,
        sessionTimeout: 3600000,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        }
      }

      expect(config.companyName).toBe('LUMO Inventory')
      expect(config.language).toBe('es')
      expect(config.allowNegativeStock).toBe(false)
      expect(config.passwordPolicy.minLength).toBe(8)
    })
  })

  describe('Type Safety and Validation', () => {
    it('should enforce enum constraints', () => {
      // This test ensures TypeScript compilation catches invalid enum values
      const validStatus: InventoryItem['status'] = 'active'
      const validRole: User['role'] = 'admin'
      const validMovementType: InventoryMovement['type'] = 'in'
      const validOperation: QuickStockOperation['operation'] = 'add'

      expect(validStatus).toBe('active')
      expect(validRole).toBe('admin')
      expect(validMovementType).toBe('in')
      expect(validOperation).toBe('add')
    })

    it('should support optional fields correctly', () => {
      const minimalItem: Pick<InventoryItem, 'id' | 'sku' | 'name' | 'description' | 'categoryId' | 'price' | 'cost' | 'margin' | 'currentStock' | 'minimumLevel' | 'status' | 'locationId' | 'tags' | 'images' | 'lastUpdated' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'syncStatus' | 'autoReorder'> = {
        id: 'item-1',
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        categoryId: 'cat-1',
        price: 100,
        cost: 50,
        margin: 50,
        currentStock: 25,
        minimumLevel: 10,
        status: 'active',
        locationId: 'loc-1',
        tags: [],
        images: [],
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced',
        autoReorder: false
      }

      expect(minimalItem.id).toBe('item-1')
      expect(minimalItem.autoReorder).toBe(false)
    })

    it('should support complex nested types', () => {
      const complexItem: InventoryItem = {
        id: 'item-1',
        sku: 'SKU-001',
        name: 'Complex Product',
        description: 'Complex Description',
        categoryId: 'cat-1',
        category: {
          id: 'cat-1',
          name: 'Electronics',
          level: 0,
          path: [],
          itemCount: 1,
          totalValue: 100,
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user-1',
          updatedBy: 'user-1',
          syncStatus: 'synced'
        },
        price: 100,
        cost: 50,
        margin: 50,
        currentStock: 25,
        minimumLevel: 10,
        status: 'active',
        locationId: 'loc-1',
        location: {
          id: 'loc-1',
          name: 'Warehouse A',
          itemQuantity: 100
        },
        dimensions: {
          length: 10,
          width: 5,
          height: 2,
          weight: 0.5,
          unit: 'cm',
          weightUnit: 'kg'
        },
        supplier: {
          id: 'sup-1',
          name: 'Test Supplier',
          contactInfo: 'supplier@test.com'
        },
        tags: ['electronics'],
        images: ['image1.jpg'],
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-1',
        updatedBy: 'user-1',
        syncStatus: 'synced',
        autoReorder: true,
        seasonalDemand: {
          season: 'summer',
          demandMultiplier: 1.2
        }
      }

      expect(complexItem.category?.name).toBe('Electronics')
      expect(complexItem.location?.name).toBe('Warehouse A')
      expect(complexItem.dimensions?.unit).toBe('cm')
      expect(complexItem.supplier?.name).toBe('Test Supplier')
      expect(complexItem.seasonalDemand?.season).toBe('summer')
    })
  })

  describe('Form Data Types', () => {
    it('should create valid InventoryFormData', () => {
      const formData: InventoryFormData = {
        sku: 'SKU-001',
        name: 'Test Product',
        description: 'Test Description',
        categoryId: 'cat-1',
        price: 100,
        cost: 50,
        currentStock: 25,
        minimumLevel: 10,
        status: 'active',
        locationId: 'loc-1',
        tags: ['electronics'],
        autoReorder: true
      }

      expect(formData.sku).toBe('SKU-001')
      expect(formData.autoReorder).toBe(true)
      expect(formData.tags).toHaveLength(1)
    })

    it('should create valid UserFormData', () => {
      const userFormData: UserFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'manager',
        isActive: true,
        permissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canViewReports: true,
          canManageUsers: false,
          canBulkOperations: true,
          canQuickStock: true,
          canViewAuditLogs: false
        },
        accessibleLocations: ['loc-1', 'loc-2'],
        defaultLocation: 'loc-1',
        preferences: {
          language: 'es',
          theme: 'dark',
          dateFormat: 'DD/MM/YYYY',
          currency: 'USD',
          notifications: {
            email: true,
            push: false,
            lowStock: true,
            bulkOperations: false
          }
        }
      }

      expect(userFormData.name).toBe('John Doe')
      expect(userFormData.role).toBe('manager')
      expect(userFormData.permissions.canCreate).toBe(true)
      expect(userFormData.preferences.language).toBe('es')
    })
  })

  describe('Integration with Real-World Scenarios', () => {
    it('should support complete inventory management workflow', () => {
      // Create category
      const category: Category = {
        id: 'cat-electronics',
        name: 'Electronics',
        level: 0,
        path: [],
        itemCount: 0,
        totalValue: 0,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
        syncStatus: 'synced'
      }

      // Create location
      const location: Location = {
        id: 'loc-warehouse-a',
        name: 'Warehouse A - Electronics Section',
        description: 'Main storage for electronic items',
        itemQuantity: 0
      }

      // Create inventory item
      const item: InventoryItem = {
        id: 'item-laptop-001',
        sku: 'LAPTOP-001',
        name: 'Gaming Laptop',
        description: 'High-performance gaming laptop',
        categoryId: category.id,
        category: category,
        price: 1500,
        cost: 1000,
        margin: 500,
        currentStock: 10,
        minimumLevel: 5,
        status: 'active',
        locationId: location.id,
        location: location,
        tags: ['electronics', 'gaming', 'laptop'],
        images: ['laptop1.jpg', 'laptop2.jpg'],
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        updatedBy: 'admin',
        syncStatus: 'synced',
        autoReorder: true,
        autoReorderQuantity: 20
      }

      // Create inventory movement
      const movement: InventoryMovement = {
        id: 'mov-001',
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        type: 'in',
        quantity: 5,
        unitCost: item.cost,
        totalCost: item.cost * 5,
        toLocationId: location.id,
        toLocationName: location.name,
        referenceType: 'purchase_order',
        referenceId: 'po-001',
        userId: 'admin',
        userName: 'Administrator',
        status: 'completed',
        notes: 'Initial stock',
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date()
      }

      expect(category.name).toBe('Electronics')
      expect(location.name).toBe('Warehouse A - Electronics Section')
      expect(item.name).toBe('Gaming Laptop')
      expect(item.category?.name).toBe('Electronics')
      expect(item.location?.name).toBe('Warehouse A - Electronics Section')
      expect(movement.type).toBe('in')
      expect(movement.quantity).toBe(5)
    })

    it('should support dashboard metrics aggregation', () => {
      const metrics: DashboardMetrics = {
        totalItems: 150,
        totalValue: 75000,
        lowStockItems: 12,
        outOfStockItems: 3,
        categoriesCount: 8,
        locationsCount: 5,
        totalMovements: 245,
        pendingOperations: 2,
        activeAlerts: 5,
        syncErrors: 0,
        topSellingItems: [
          {
            itemId: 'item-1',
            itemName: 'Gaming Laptop',
            quantity: 25,
            value: 37500
          },
          {
            itemId: 'item-2',
            itemName: 'Wireless Mouse',
            quantity: 150,
            value: 7500
          }
        ],
        lowPerformingItems: [
          {
            itemId: 'item-3',
            itemName: 'Old Keyboard',
            daysWithoutMovement: 90
          }
        ],
        locationUtilization: [
          {
            locationId: 'loc-1',
            locationName: 'Warehouse A',
            utilizationPercentage: 85,
            capacity: 1000,
            currentStock: 850
          }
        ],
        recentActivity: [
          {
            id: 'activity-1',
            action: 'created',
            entityType: 'item',
            entityId: 'item-new',
            entityName: 'New Product',
            userId: 'admin',
            userName: 'Administrator',
            timestamp: new Date(),
            status: 'success'
          }
        ],
        stockTrends: [
          {
            date: '2023-01-01',
            totalStock: 1000,
            totalValue: 50000
          },
          {
            date: '2023-01-02',
            totalStock: 1050,
            totalValue: 52500
          }
        ]
      }

      expect(metrics.totalItems).toBe(150)
      expect(metrics.topSellingItems).toHaveLength(2)
      expect(metrics.locationUtilization[0].utilizationPercentage).toBe(85)
      expect(metrics.stockTrends).toHaveLength(2)
    })
  })
})