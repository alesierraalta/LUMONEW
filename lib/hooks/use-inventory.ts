import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '../services/inventory/inventory.service'
import type { InventoryItem, InventoryFormData, FilterOptions } from '../types'

// Query keys for consistent caching
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: FilterOptions) => [...inventoryKeys.lists(), filters] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  lowStock: () => [...inventoryKeys.all, 'lowStock'] as const,
  byCategory: (categoryId: string) => [...inventoryKeys.all, 'category', categoryId] as const,
  byLocation: (locationId: string) => [...inventoryKeys.all, 'location', locationId] as const,
  search: (query: string, filters?: FilterOptions) => [...inventoryKeys.all, 'search', query, filters] as const
}

/**
 * Hook to fetch all inventory items with caching
 */
export function useInventory(filters: FilterOptions = {}) {
  return useQuery({
    queryKey: inventoryKeys.list(filters),
    queryFn: () => inventoryService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

/**
 * Hook to fetch a single inventory item
 */
export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => inventoryService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to fetch low stock items
 */
export function useLowStockItems() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => inventoryService.getLowStock(),
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for critical data)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  })
}

/**
 * Hook to fetch items by category
 */
export function useInventoryByCategory(categoryId: string) {
  return useQuery({
    queryKey: inventoryKeys.byCategory(categoryId),
    queryFn: () => inventoryService.getByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Hook to fetch items by location
 */
export function useInventoryByLocation(locationId: string) {
  return useQuery({
    queryKey: inventoryKeys.byLocation(locationId),
    queryFn: () => inventoryService.getByLocation(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

/**
 * Hook to search inventory items
 */
export function useInventorySearch(query: string, filters: FilterOptions = {}) {
  return useQuery({
    queryKey: inventoryKeys.search(query, filters),
    queryFn: () => inventoryService.search(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1
  })
}

/**
 * Hook to create a new inventory item
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemData: InventoryFormData) => inventoryService.create(itemData),
    onSuccess: (newItem) => {
      // Invalidate and refetch inventory lists
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      
      // Add the new item to the cache
      queryClient.setQueryData(inventoryKeys.detail(newItem.id), newItem)
      
      // Update low stock cache if applicable
      if (newItem.currentStock <= newItem.minimumLevel) {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
      }
    },
    onError: (error) => {
      console.error('Failed to create inventory item:', error)
    }
  })
}

/**
 * Hook to update an inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InventoryFormData> }) =>
      inventoryService.update(id, updates),
    onSuccess: (updatedItem, { id }) => {
      // Update the specific item in cache
      queryClient.setQueryData(inventoryKeys.detail(id), updatedItem)
      
      // Invalidate lists to refetch with updated data
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      
      // Update low stock cache if stock level changed
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
    },
    onError: (error) => {
      console.error('Failed to update inventory item:', error)
    }
  })
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => inventoryService.delete(id),
    onSuccess: (_, id) => {
      // Remove the item from cache
      queryClient.removeQueries({ queryKey: inventoryKeys.detail(id) })
      
      // Invalidate lists to refetch without the deleted item
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
    },
    onError: (error) => {
      console.error('Failed to delete inventory item:', error)
    }
  })
}

/**
 * Hook to bulk update inventory items
 */
export function useBulkUpdateInventoryItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: Partial<InventoryFormData> }>) =>
      inventoryService.bulkUpdate(updates),
    onSuccess: (updatedItems) => {
      // Update each item in cache
      updatedItems.forEach(item => {
        queryClient.setQueryData(inventoryKeys.detail(item.id), item)
      })
      
      // Invalidate lists and low stock cache
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
    },
    onError: (error) => {
      console.error('Failed to bulk update inventory items:', error)
    }
  })
}

/**
 * Hook to bulk delete inventory items
 */
export function useBulkDeleteInventoryItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => inventoryService.delete(id))),
    onSuccess: (_, ids) => {
      // Remove all deleted items from cache
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: inventoryKeys.detail(id) })
      })
      
      // Invalidate lists and low stock cache
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
    },
    onError: (error) => {
      console.error('Failed to bulk delete inventory items:', error)
    }
  })
}

/**
 * Hook to prefetch inventory data
 */
export function usePrefetchInventory() {
  const queryClient = useQueryClient()

  const prefetchItem = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.detail(id),
      queryFn: () => inventoryService.getById(id),
      staleTime: 5 * 60 * 1000
    })
  }

  const prefetchLowStock = () => {
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.lowStock(),
      queryFn: () => inventoryService.getLowStock(),
      staleTime: 2 * 60 * 1000
    })
  }

  return {
    prefetchItem,
    prefetchLowStock
  }
}

/**
 * Hook to get inventory metrics with caching
 */
export function useInventoryMetrics() {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'metrics'],
    queryFn: () => inventoryService.getAll({}),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to get inventory analytics with caching
 */
export function useInventoryAnalytics() {
  return useQuery({
    queryKey: [...inventoryKeys.all, 'analytics'],
    queryFn: () => inventoryService.getAll({}),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false
  })
}