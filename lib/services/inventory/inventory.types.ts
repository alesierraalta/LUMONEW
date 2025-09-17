import type { InventoryItem, InventoryFormData, FilterOptions } from '../../types'

/**
 * Inventory-specific types and interfaces
 */

export interface InventoryFilters extends FilterOptions {
  // Additional inventory-specific filters
  priceRange?: {
    min: number
    max: number
  }
  stockStatus?: 'good_stock' | 'low_stock' | 'out_of_stock'
  hasImages?: boolean
  autoReorder?: boolean
}

export interface InventoryMetrics {
  totalItems: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  averagePrice: number
  totalQuantity: number
}

export interface InventoryAnalytics {
  categoryDistribution: Array<{
    category: string
    count: number
    value: number
    percentage: number
  }>
  locationDistribution: Array<{
    location: string
    count: number
    value: number
    percentage: number
  }>
  stockLevels: {
    inStock: number
    lowStock: number
    outOfStock: number
  }
  priceDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
}

export interface BulkOperationResult {
  success: boolean
  processed: number
  successful: number
  failed: number
  errors: Array<{
    itemId: string
    error: string
  }>
  results: InventoryItem[]
}

export interface InventorySearchResult {
  items: InventoryItem[]
  totalCount: number
  hasMore: boolean
  searchTime: number
}

export interface InventoryServiceConfig {
  cacheEnabled: boolean
  cacheTTL: number
  batchSize: number
  maxRetries: number
  enableAnalytics: boolean
}

export interface InventoryValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
  }>
}

/**
 * Service method signatures for type safety
 */
export interface IInventoryService {
  getAll(filters?: InventoryFilters): Promise<InventoryItem[]>
  getById(id: string): Promise<InventoryItem | null>
  create(item: InventoryFormData): Promise<InventoryItem>
  update(id: string, updates: Partial<InventoryFormData>): Promise<InventoryItem>
  delete(id: string): Promise<void>
  getLowStock(): Promise<InventoryItem[]>
  getByCategory(categoryId: string): Promise<InventoryItem[]>
  getByLocation(locationId: string): Promise<InventoryItem[]>
  search(query: string, filters?: InventoryFilters): Promise<InventorySearchResult>
  bulkCreate(items: InventoryFormData[]): Promise<BulkOperationResult>
  bulkUpdate(updates: Array<{ id: string; data: Partial<InventoryFormData> }>): Promise<BulkOperationResult>
  getMetrics(): Promise<InventoryMetrics>
  getAnalytics(): Promise<InventoryAnalytics>
  validateItem(item: InventoryFormData): Promise<InventoryValidationResult>
}

export interface IInventoryRepository {
  findMany(filters?: InventoryFilters): Promise<InventoryItem[]>
  findById(id: string): Promise<InventoryItem | null>
  create(item: InventoryFormData): Promise<InventoryItem>
  update(id: string, updates: Partial<InventoryFormData>): Promise<InventoryItem>
  delete(id: string): Promise<void>
  findByCriteria(criteria: any): Promise<InventoryItem[]>
  count(filters?: InventoryFilters): Promise<number>
  search(searchTerm: string, filters?: InventoryFilters): Promise<InventoryItem[]>
  bulkCreate(items: InventoryFormData[]): Promise<InventoryItem[]>
  bulkUpdate(updates: Array<{ id: string; data: Partial<InventoryFormData> }>): Promise<InventoryItem[]>
}

/**
 * Event types for inventory operations
 */
export interface InventoryEvent {
  type: 'created' | 'updated' | 'deleted' | 'stock_adjusted'
  itemId: string
  item: InventoryItem
  timestamp: Date
  userId: string
  metadata?: Record<string, any>
}

export interface InventoryEventHandler {
  (event: InventoryEvent): Promise<void>
}

/**
 * Cache configuration for inventory data
 */
export interface InventoryCacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  keyPrefix: string
}

/**
 * Performance metrics for inventory operations
 */
export interface InventoryPerformanceMetrics {
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}