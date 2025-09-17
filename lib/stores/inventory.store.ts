import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { inventoryService } from '../services/inventory/inventory.service'
import type { InventoryItem, InventoryFormData, FilterOptions } from '../types'

interface InventoryState {
  // Data
  items: InventoryItem[]
  selectedItems: string[]
  filters: FilterOptions
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  
  // Cache
  lastFetch: Date | null
  cacheExpiry: number // in milliseconds
  
  // Actions
  fetchItems: (filters?: FilterOptions, forceRefresh?: boolean) => Promise<void>
  fetchItem: (id: string) => Promise<InventoryItem | null>
  createItem: (item: InventoryFormData) => Promise<InventoryItem>
  updateItem: (id: string, updates: Partial<InventoryFormData>) => Promise<InventoryItem>
  deleteItem: (id: string) => Promise<void>
  bulkUpdate: (updates: Array<{ id: string; data: Partial<InventoryFormData> }>) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>
  
  // UI State
  setFilters: (filters: Partial<FilterOptions>) => void
  setSelectedItems: (ids: string[]) => void
  toggleItemSelection: (id: string) => void
  clearSelection: () => void
  setPage: (page: number) => void
  setItemsPerPage: (count: number) => void
  
  // Cache management
  invalidateCache: () => void
  isCacheValid: () => boolean
  
  // Error handling
  clearError: () => void
  setError: (error: string) => void
}

export const useInventoryStore = create<InventoryState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        items: [],
        selectedItems: [],
        filters: {},
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        itemsPerPage: 20,
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes

        // Actions
        fetchItems: async (filters = {}, forceRefresh = false) => {
          const state = get()
          
          // Check cache validity
          if (!forceRefresh && state.isCacheValid() && state.items.length > 0) {
            return
          }

          set({ loading: true, error: null })

          try {
            const mergedFilters = { ...state.filters, ...filters }
            const items = await inventoryService.getAll(mergedFilters)
            
            set({
              items,
              filters: mergedFilters,
              loading: false,
              lastFetch: new Date(),
              totalCount: items.length,
              totalPages: Math.ceil(items.length / state.itemsPerPage)
            })
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch items'
            })
          }
        },

        fetchItem: async (id: string) => {
          set({ loading: true, error: null })

          try {
            const item = await inventoryService.getById(id)
            
            if (item) {
              // Update item in the list if it exists
              set(state => ({
                items: state.items.map(i => i.id === id ? item : i),
                loading: false
              }))
            }
            
            return item
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch item'
            })
            return null
          }
        },

        createItem: async (itemData: InventoryFormData) => {
          set({ loading: true, error: null })

          try {
            const newItem = await inventoryService.create(itemData)
            
            set(state => ({
              items: [newItem, ...state.items],
              loading: false,
              totalCount: state.totalCount + 1,
              totalPages: Math.ceil((state.totalCount + 1) / state.itemsPerPage)
            }))
            
            return newItem
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to create item'
            })
            throw error
          }
        },

        updateItem: async (id: string, updates: Partial<InventoryFormData>) => {
          set({ loading: true, error: null })

          try {
            const updatedItem = await inventoryService.update(id, updates)
            
            set(state => ({
              items: state.items.map(item => 
                item.id === id ? updatedItem : item
              ),
              loading: false
            }))
            
            return updatedItem
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to update item'
            })
            throw error
          }
        },

        deleteItem: async (id: string) => {
          set({ loading: true, error: null })

          try {
            await inventoryService.delete(id)
            
            set(state => ({
              items: state.items.filter(item => item.id !== id),
              selectedItems: state.selectedItems.filter(itemId => itemId !== id),
              loading: false,
              totalCount: state.totalCount - 1,
              totalPages: Math.ceil((state.totalCount - 1) / state.itemsPerPage)
            }))
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to delete item'
            })
            throw error
          }
        },

        bulkUpdate: async (updates: Array<{ id: string; data: Partial<InventoryFormData> }>) => {
          set({ loading: true, error: null })

          try {
            const updatedItems = await inventoryService.bulkUpdate(updates)
            
            set(state => ({
              items: state.items.map(item => {
                const update = updatedItems.find(u => u.id === item.id)
                return update || item
              }),
              loading: false
            }))
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to bulk update items'
            })
            throw error
          }
        },

        bulkDelete: async (ids: string[]) => {
          set({ loading: true, error: null })

          try {
            // Delete items in parallel for better performance
            await Promise.all(ids.map(id => inventoryService.delete(id)))
            
            set(state => ({
              items: state.items.filter(item => !ids.includes(item.id)),
              selectedItems: [],
              loading: false,
              totalCount: state.totalCount - ids.length,
              totalPages: Math.ceil((state.totalCount - ids.length) / state.itemsPerPage)
            }))
          } catch (error) {
            set({
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to bulk delete items'
            })
            throw error
          }
        },

        // UI State actions
        setFilters: (newFilters) => {
          set(state => ({
            filters: { ...state.filters, ...newFilters },
            currentPage: 1 // Reset to first page when filters change
          }))
        },

        setSelectedItems: (ids) => {
          set({ selectedItems: ids })
        },

        toggleItemSelection: (id) => {
          set(state => ({
            selectedItems: state.selectedItems.includes(id)
              ? state.selectedItems.filter(itemId => itemId !== id)
              : [...state.selectedItems, id]
          }))
        },

        clearSelection: () => {
          set({ selectedItems: [] })
        },

        setPage: (page) => {
          set({ currentPage: page })
        },

        setItemsPerPage: (count) => {
          set(state => ({
            itemsPerPage: count,
            currentPage: 1,
            totalPages: Math.ceil(state.totalCount / count)
          }))
        },

        // Cache management
        invalidateCache: () => {
          set({ lastFetch: null })
        },

        isCacheValid: () => {
          const state = get()
          if (!state.lastFetch) return false
          return Date.now() - state.lastFetch.getTime() < state.cacheExpiry
        },

        // Error handling
        clearError: () => {
          set({ error: null })
        },

        setError: (error) => {
          set({ error })
        }
      }),
      {
        name: 'inventory-store',
        partialize: (state) => ({
          filters: state.filters,
          itemsPerPage: state.itemsPerPage,
          cacheExpiry: state.cacheExpiry
        })
      }
    ),
    {
      name: 'inventory-store'
    }
  )
)

// Selectors for better performance
export const inventorySelectors = {
  getItems: (state: InventoryState) => state.items,
  getSelectedItems: (state: InventoryState) => state.selectedItems,
  getFilters: (state: InventoryState) => state.filters,
  getLoading: (state: InventoryState) => state.loading,
  getError: (state: InventoryState) => state.error,
  getPagination: (state: InventoryState) => ({
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalCount: state.totalCount,
    itemsPerPage: state.itemsPerPage
  }),
  getSelectedItemsData: (state: InventoryState) => 
    state.items.filter(item => state.selectedItems.includes(item.id)),
  getLowStockItems: (state: InventoryState) => 
    state.items.filter(item => item.currentStock <= item.minimumLevel),
  getOutOfStockItems: (state: InventoryState) => 
    state.items.filter(item => item.currentStock === 0)
}