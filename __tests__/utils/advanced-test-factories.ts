import { vi } from 'vitest'
import { faker } from '@faker-js/faker'

// Advanced data generation with realistic constraints and relationships
export class AdvancedDataFactory {
  private static instance: AdvancedDataFactory
  private sequenceCounters: Map<string, number> = new Map()
  private relationshipGraph: Map<string, Set<string>> = new Map()
  private constraints: Map<string, any> = new Map()

  static getInstance(): AdvancedDataFactory {
    if (!AdvancedDataFactory.instance) {
      AdvancedDataFactory.instance = new AdvancedDataFactory()
    }
    return AdvancedDataFactory.instance
  }

  private getNextSequence(type: string): number {
    const current = this.sequenceCounters.get(type) || 0
    const next = current + 1
    this.sequenceCounters.set(type, next)
    return next
  }

  // Advanced inventory item factory with realistic constraints
  createRealisticInventoryItem(overrides: Partial<any> = {}): any {
    const sequence = this.getNextSequence('inventory')
    const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Automotive']
    const category = overrides.category || faker.helpers.arrayElement(categories)
    
    // Generate realistic pricing based on category
    const basePrices = {
      'Electronics': { min: 50, max: 2000 },
      'Clothing': { min: 15, max: 300 },
      'Books': { min: 10, max: 50 },
      'Home & Garden': { min: 20, max: 500 },
      'Sports': { min: 25, max: 800 },
      'Automotive': { min: 30, max: 1500 }
    }
    
    const priceRange = basePrices[category as keyof typeof basePrices] || { min: 10, max: 100 }
    const price = faker.number.float({ min: priceRange.min, max: priceRange.max, fractionDigits: 2 })
    const costMultiplier = faker.number.float({ min: 0.3, max: 0.65, fractionDigits: 3 }) // Use 3 decimal places for more precision
    const cost = price * costMultiplier // Ensure cost is always less than price
    const margin = ((price - cost) / price) * 100
    
    // Generate realistic stock levels
    const stockMultipliers = {
      'Electronics': { min: 5, max: 100 },
      'Clothing': { min: 10, max: 200 },
      'Books': { min: 1, max: 50 },
      'Home & Garden': { min: 5, max: 150 },
      'Sports': { min: 3, max: 80 },
      'Automotive': { min: 2, max: 30 }
    }
    
    const stockRange = stockMultipliers[category as keyof typeof stockMultipliers] || { min: 5, max: 100 }
    const currentStock = faker.number.int({ min: stockRange.min, max: stockRange.max })
    const minimumLevel = Math.max(1, Math.floor(currentStock * 0.2))
    
    return {
      id: `item-${sequence}-${faker.string.alphanumeric(8)}`,
      sku: `${category.substring(0, 3).toUpperCase()}-${sequence.toString().padStart(4, '0')}-${faker.string.alphanumeric(4).toUpperCase()}`,
      name: this.generateRealisticProductName(category),
      description: faker.commerce.productDescription(),
      category,
      price: Number(price.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      margin: Number(margin.toFixed(2)),
      currentStock,
      minimumLevel,
      maximumLevel: currentStock * 3,
      status: faker.helpers.weightedArrayElement([
        { weight: 85, value: 'active' },
        { weight: 10, value: 'inactive' },
        { weight: 5, value: 'discontinued' }
      ]),
      locationId: `location-${faker.number.int({ min: 1, max: 5 })}`,
      supplierId: `supplier-${faker.number.int({ min: 1, max: 10 })}`,
      tags: faker.helpers.arrayElements(['popular', 'seasonal', 'clearance', 'new', 'featured'], { min: 0, max: 3 }),
      images: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.image.url()),
      weight: faker.number.float({ min: 0.1, max: 50, fractionDigits: 1 }),
      dimensions: {
        length: faker.number.float({ min: 1, max: 100, fractionDigits: 1 }),
        width: faker.number.float({ min: 1, max: 100, fractionDigits: 1 }),
        height: faker.number.float({ min: 1, max: 100, fractionDigits: 1 })
      },
      barcode: faker.string.numeric(13),
      lastUpdated: faker.date.recent({ days: 30 }),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 7 }),
      createdBy: `user-${faker.number.int({ min: 1, max: 5 })}`,
      updatedBy: `user-${faker.number.int({ min: 1, max: 5 })}`,
      syncStatus: faker.helpers.weightedArrayElement([
        { weight: 90, value: 'synced' },
        { weight: 8, value: 'pending' },
        { weight: 2, value: 'error' }
      ]),
      autoReorder: faker.datatype.boolean(),
      reorderPoint: minimumLevel + faker.number.int({ min: 5, max: 20 }),
      reorderQuantity: faker.number.int({ min: 50, max: 200 }),
      ...overrides
    }
  }

  private generateRealisticProductName(category: string): string {
    const productNames = {
      'Electronics': () => `${faker.helpers.arrayElement(['Smart', 'Pro', 'Ultra', 'Premium', 'Advanced'])} ${faker.helpers.arrayElement(['Phone', 'Laptop', 'Tablet', 'Camera', 'Speaker', 'Monitor'])}`,
      'Clothing': () => `${faker.helpers.arrayElement(['Classic', 'Modern', 'Vintage', 'Premium', 'Casual'])} ${faker.helpers.arrayElement(['Shirt', 'Jeans', 'Jacket', 'Dress', 'Sweater', 'Shoes'])}`,
      'Books': () => `${faker.helpers.arrayElement(['The Art of', 'Complete Guide to', 'Mastering', 'Introduction to', 'Advanced'])} ${faker.helpers.arrayElement(['Programming', 'Design', 'Business', 'Science', 'History', 'Fiction'])}`,
      'Home & Garden': () => `${faker.helpers.arrayElement(['Deluxe', 'Professional', 'Compact', 'Heavy-Duty', 'Eco-Friendly'])} ${faker.helpers.arrayElement(['Garden Tool', 'Kitchen Set', 'Storage Box', 'Cleaning Kit', 'Organizer'])}`,
      'Sports': () => `${faker.helpers.arrayElement(['Professional', 'Training', 'Competition', 'Beginner', 'Advanced'])} ${faker.helpers.arrayElement(['Basketball', 'Soccer Ball', 'Tennis Racket', 'Gym Equipment', 'Running Shoes'])}`,
      'Automotive': () => `${faker.helpers.arrayElement(['Premium', 'Heavy-Duty', 'Universal', 'Professional', 'High-Performance'])} ${faker.helpers.arrayElement(['Oil Filter', 'Brake Pads', 'Spark Plugs', 'Battery', 'Tire'])}`
    }
    
    const generator = productNames[category as keyof typeof productNames]
    return generator ? generator() : faker.commerce.productName()
  }

  // Advanced user factory with realistic roles and permissions
  createRealisticUser(overrides: Partial<any> = {}): any {
    const sequence = this.getNextSequence('user')
    const roles = ['admin', 'manager', 'staff', 'viewer']
    const role = overrides.role || faker.helpers.weightedArrayElement([
      { weight: 5, value: 'admin' },
      { weight: 15, value: 'manager' },
      { weight: 70, value: 'staff' },
      { weight: 10, value: 'viewer' }
    ])

    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const email = faker.internet.email({ firstName, lastName }).toLowerCase()

    return {
      id: `user-${sequence}-${faker.string.uuid()}`,
      email,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      role,
      status: faker.helpers.weightedArrayElement([
        { weight: 90, value: 'active' },
        { weight: 8, value: 'inactive' },
        { weight: 2, value: 'suspended' }
      ]),
      department: faker.helpers.arrayElement(['Inventory', 'Sales', 'Purchasing', 'Warehouse', 'Management']),
      phoneNumber: faker.phone.number(),
      avatar: faker.image.avatar(),
      lastLogin: faker.date.recent({ days: 7 }),
      loginCount: faker.number.int({ min: 1, max: 500 }),
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr']),
        notifications: {
          email: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          sms: faker.datatype.boolean()
        }
      },
      permissions: this.generateRolePermissions(role),
      created_at: faker.date.past({ years: 3 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: `${firstName} ${lastName}`,
        role,
        department: faker.helpers.arrayElement(['Inventory', 'Sales', 'Purchasing', 'Warehouse', 'Management'])
      },
      aud: 'authenticated',
      ...overrides
    }
  }

  private generateRolePermissions(role: string): string[] {
    const allPermissions = [
      'inventory:read', 'inventory:write', 'inventory:delete',
      'users:read', 'users:write', 'users:delete',
      'reports:read', 'reports:write',
      'settings:read', 'settings:write',
      'audit:read', 'transactions:read', 'transactions:write'
    ]

    const rolePermissions = {
      admin: allPermissions,
      manager: [
        'inventory:read', 'inventory:write', 'inventory:delete',
        'users:read', 'users:write',
        'reports:read', 'reports:write',
        'audit:read', 'transactions:read', 'transactions:write'
      ],
      staff: [
        'inventory:read', 'inventory:write',
        'transactions:read', 'transactions:write'
      ],
      viewer: [
        'inventory:read', 'reports:read', 'audit:read'
      ]
    }

    return rolePermissions[role as keyof typeof rolePermissions] || rolePermissions.viewer
  }

  // Advanced transaction factory with realistic patterns
  createRealisticTransaction(overrides: Partial<any> = {}): any {
    const sequence = this.getNextSequence('transaction')
    const types = ['sale', 'purchase', 'adjustment', 'transfer', 'return']
    const type = overrides.type || faker.helpers.weightedArrayElement([
      { weight: 40, value: 'sale' },
      { weight: 25, value: 'purchase' },
      { weight: 15, value: 'adjustment' },
      { weight: 15, value: 'transfer' },
      { weight: 5, value: 'return' }
    ])

    const quantity = type === 'sale' || type === 'return' 
      ? -faker.number.int({ min: 1, max: 50 })
      : faker.number.int({ min: 1, max: 100 })

    const unitCost = faker.number.float({ min: 5, max: 500, fractionDigits: 2 })
    const totalCost = Math.abs(quantity) * unitCost

    return {
      id: `transaction-${sequence}-${faker.string.uuid()}`,
      type,
      itemId: `item-${faker.number.int({ min: 1, max: 100 })}`,
      quantity,
      unitCost: Number(unitCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      reference: `${type.toUpperCase()}-${sequence.toString().padStart(6, '0')}`,
      notes: faker.lorem.sentence(),
      reason: this.generateTransactionReason(type),
      userId: `user-${faker.number.int({ min: 1, max: 10 })}`,
      locationId: `location-${faker.number.int({ min: 1, max: 5 })}`,
      supplierId: type === 'purchase' ? `supplier-${faker.number.int({ min: 1, max: 10 })}` : null,
      customerId: type === 'sale' ? `customer-${faker.number.int({ min: 1, max: 100 })}` : null,
      batchNumber: faker.string.alphanumeric(10).toUpperCase(),
      expiryDate: type === 'purchase' ? faker.date.future({ years: 2 }) : null,
      timestamp: faker.date.recent({ days: 30 }),
      previousStock: faker.number.int({ min: 0, max: 200 }),
      newStock: faker.number.int({ min: 0, max: 300 }),
      status: faker.helpers.weightedArrayElement([
        { weight: 85, value: 'completed' },
        { weight: 10, value: 'pending' },
        { weight: 5, value: 'cancelled' }
      ]),
      metadata: {
        source: faker.helpers.arrayElement(['web', 'mobile', 'api', 'import']),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent()
      },
      ...overrides
    }
  }

  private generateTransactionReason(type: string): string {
    const reasons = {
      sale: ['Customer purchase', 'Online order', 'Walk-in sale', 'Bulk order'],
      purchase: ['Stock replenishment', 'New product line', 'Seasonal stock', 'Emergency reorder'],
      adjustment: ['Stock count correction', 'Damaged goods', 'Expired items', 'System correction'],
      transfer: ['Location transfer', 'Warehouse redistribution', 'Store allocation'],
      return: ['Customer return', 'Defective product', 'Wrong item', 'Damaged in transit']
    }
    
    const typeReasons = reasons[type as keyof typeof reasons] || ['General transaction']
    return faker.helpers.arrayElement(typeReasons)
  }

  // Advanced audit entry factory
  createRealisticAuditEntry(overrides: Partial<any> = {}): any {
    const sequence = this.getNextSequence('audit')
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT']
    const entityTypes = ['inventory', 'user', 'category', 'location', 'transaction', 'supplier']
    
    const action = overrides.action || faker.helpers.arrayElement(actions)
    const entityType = overrides.entityType || faker.helpers.arrayElement(entityTypes)

    return {
      id: `audit-${sequence}-${faker.string.uuid()}`,
      action,
      entityType,
      entityId: `${entityType}-${faker.number.int({ min: 1, max: 100 })}`,
      userId: `user-${faker.number.int({ min: 1, max: 10 })}`,
      timestamp: faker.date.recent({ days: 30 }),
      changes: this.generateRealisticChanges(action, entityType),
      metadata: {
        userAgent: faker.internet.userAgent(),
        ipAddress: faker.internet.ip(),
        sessionId: faker.string.uuid(),
        source: faker.helpers.arrayElement(['web', 'mobile', 'api']),
        location: faker.location.city()
      },
      severity: faker.helpers.weightedArrayElement([
        { weight: 60, value: 'info' },
        { weight: 25, value: 'warning' },
        { weight: 10, value: 'error' },
        { weight: 5, value: 'critical' }
      ]),
      ...overrides
    }
  }

  private generateRealisticChanges(action: string, entityType: string): any {
    if (action === 'CREATE') {
      return {
        before: null,
        after: this.generateEntitySnapshot(entityType)
      }
    } else if (action === 'DELETE') {
      return {
        before: this.generateEntitySnapshot(entityType),
        after: null
      }
    } else if (action === 'UPDATE') {
      const before = this.generateEntitySnapshot(entityType)
      const after = { ...before }
      
      // Simulate realistic field changes
      if (entityType === 'inventory') {
        after.currentStock = faker.number.int({ min: 0, max: 500 })
        after.price = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })
      } else if (entityType === 'user') {
        after.status = faker.helpers.arrayElement(['active', 'inactive'])
        after.role = faker.helpers.arrayElement(['admin', 'manager', 'staff', 'viewer'])
      }
      
      return { before, after }
    }
    
    return {}
  }

  private generateEntitySnapshot(entityType: string): any {
    switch (entityType) {
      case 'inventory':
        return {
          name: faker.commerce.productName(),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          currentStock: faker.number.int({ min: 0, max: 500 }),
          price: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 })
        }
      case 'user':
        return {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          role: faker.helpers.arrayElement(['admin', 'manager', 'staff', 'viewer']),
          status: faker.helpers.arrayElement(['active', 'inactive'])
        }
      default:
        return {
          name: faker.lorem.words(2),
          status: 'active'
        }
    }
  }

  // Bulk data generation with relationships
  createRelatedDataSet(options: {
    userCount?: number
    categoryCount?: number
    locationCount?: number
    itemCount?: number
    transactionCount?: number
    auditCount?: number
  } = {}): any {
    const {
      userCount = 5,
      categoryCount = 8,
      locationCount = 3,
      itemCount = 50,
      transactionCount = 100,
      auditCount = 200
    } = options

    // Create base entities
    const users = Array.from({ length: userCount }, () => this.createRealisticUser())
    const categories = Array.from({ length: categoryCount }, (_, i) => ({
      id: `category-${i + 1}`,
      name: faker.helpers.arrayElement(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Automotive', 'Health', 'Beauty']),
      description: faker.lorem.sentence(),
      status: 'active',
      created_at: faker.date.past({ years: 2 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString()
    }))
    
    const locations = Array.from({ length: locationCount }, (_, i) => ({
      id: `location-${i + 1}`,
      name: faker.helpers.arrayElement(['Main Warehouse', 'Store Front', 'Distribution Center', 'Overflow Storage', 'Returns Center']),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
      status: 'active',
      created_at: faker.date.past({ years: 2 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString()
    }))

    // Create items with proper relationships
    const items = Array.from({ length: itemCount }, () => {
      const item = this.createRealisticInventoryItem()
      item.categoryId = faker.helpers.arrayElement(categories).id
      item.locationId = faker.helpers.arrayElement(locations).id
      item.createdBy = faker.helpers.arrayElement(users).id
      item.updatedBy = faker.helpers.arrayElement(users).id
      return item
    })

    // Create transactions with proper relationships
    const transactions = Array.from({ length: transactionCount }, () => {
      const transaction = this.createRealisticTransaction()
      transaction.itemId = faker.helpers.arrayElement(items).id
      transaction.userId = faker.helpers.arrayElement(users).id
      transaction.locationId = faker.helpers.arrayElement(locations).id
      return transaction
    })

    // Create audit entries with proper relationships
    const auditEntries = Array.from({ length: auditCount }, () => {
      const audit = this.createRealisticAuditEntry()
      audit.userId = faker.helpers.arrayElement(users).id
      
      // Randomly assign entity references
      const entityType = faker.helpers.arrayElement(['inventory', 'user', 'category', 'location', 'transaction'])
      audit.entityType = entityType
      
      switch (entityType) {
        case 'inventory':
          audit.entityId = faker.helpers.arrayElement(items).id
          break
        case 'user':
          audit.entityId = faker.helpers.arrayElement(users).id
          break
        case 'category':
          audit.entityId = faker.helpers.arrayElement(categories).id
          break
        case 'location':
          audit.entityId = faker.helpers.arrayElement(locations).id
          break
        case 'transaction':
          audit.entityId = faker.helpers.arrayElement(transactions).id
          break
      }
      
      return audit
    })

    return {
      users,
      categories,
      locations,
      items,
      transactions,
      auditEntries,
      summary: {
        totalUsers: users.length,
        totalCategories: categories.length,
        totalLocations: locations.length,
        totalItems: items.length,
        totalTransactions: transactions.length,
        totalAuditEntries: auditEntries.length,
        activeItems: items.filter(item => item.status === 'active').length,
        lowStockItems: items.filter(item => item.currentStock <= item.minimumLevel).length,
        totalInventoryValue: items.reduce((sum, item) => sum + (item.price * item.currentStock), 0)
      }
    }
  }

  // Reset all sequences
  resetSequences(): void {
    this.sequenceCounters.clear()
  }

  // Get current sequence values
  getSequenceValues(): Map<string, number> {
    return new Map(this.sequenceCounters)
  }
}

// Export singleton instance
export const advancedFactory = AdvancedDataFactory.getInstance()

// Convenience functions
export const createRealisticInventoryItem = (overrides?: Partial<any>) => 
  advancedFactory.createRealisticInventoryItem(overrides)

export const createRealisticUser = (overrides?: Partial<any>) => 
  advancedFactory.createRealisticUser(overrides)

export const createRealisticTransaction = (overrides?: Partial<any>) => 
  advancedFactory.createRealisticTransaction(overrides)

export const createRealisticAuditEntry = (overrides?: Partial<any>) => 
  advancedFactory.createRealisticAuditEntry(overrides)

export const createRelatedDataSet = (options?: any) => 
  advancedFactory.createRelatedDataSet(options)

// Specialized factories for testing scenarios
export const createLowStockScenario = (itemCount: number = 10) => {
  return Array.from({ length: itemCount }, () => 
    advancedFactory.createRealisticInventoryItem({
      currentStock: faker.number.int({ min: 1, max: 5 }),
      minimumLevel: faker.number.int({ min: 10, max: 20 }),
      status: 'active'
    })
  )
}

export const createHighValueScenario = (itemCount: number = 5) => {
  return Array.from({ length: itemCount }, () => 
    advancedFactory.createRealisticInventoryItem({
      price: faker.number.float({ min: 1000, max: 5000, fractionDigits: 2 }),
      currentStock: faker.number.int({ min: 50, max: 200 }),
      category: 'Electronics'
    })
  )
}

export const createRecentActivityScenario = (days: number = 7, transactionCount: number = 50) => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  return Array.from({ length: transactionCount }, () => 
    advancedFactory.createRealisticTransaction({
      timestamp: faker.date.between({ from: startDate, to: new Date() })
    })
  )
}