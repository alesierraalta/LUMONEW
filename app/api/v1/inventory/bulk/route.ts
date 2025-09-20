import { NextRequest, NextResponse } from 'next/server'
import { Logger } from '@/lib/utils/logger'
import { handleAPIError } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server-with-retry'

/**
 * Bulk Operations API for Inventory
 * Handles bulk create, update, and delete operations with optimized performance
 */

// POST /api/v1/inventory/bulk - Bulk create inventory items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, operation } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'Items array is required and must not be empty',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (items.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request too large',
          message: 'Maximum 100 items allowed per bulk operation',
          status: 400
        }
      )
    }

    // Get authenticated user information
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.warn('Could not get authenticated user for audit:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required for bulk operations',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    let result: any

    switch (operation) {
      case 'create':
        // Real bulk create using optimized inventory service
        try {
          const itemsToCreate = items.map((item: any) => ({
            name: item.name,
            sku: item.sku,
            category_id: item.category_id || item.categoryId,
            location_id: item.location_id || item.locationId,
            unit_price: parseFloat(item.unit_price || item.price || 0),
            quantity: parseInt(item.quantity || item.currentStock || 0),
            min_stock: parseInt(item.min_stock || item.minimumLevel || 0),
            max_stock: parseInt(item.max_stock || item.maximumLevel || item.quantity * 2 || 0),
            status: item.status || 'active',
            images: item.images || []
          }))

          // Validate required fields for each item
          const invalidItems = itemsToCreate.filter((item, index) => !item.sku || !item.name)
          if (invalidItems.length > 0) {
            return NextResponse.json(
              { 
                success: false,
                error: 'Some items are missing required fields (SKU and name)',
                invalidItems: invalidItems.length,
                timestamp: new Date().toISOString()
              },
              { status: 400 }
            )
          }

          // Import the optimized inventory service
          const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
          
          // Create items in database
          const createdItems = await optimizedInventoryService.createMany(itemsToCreate, user)
          
          result = {
            successful: createdItems.length,
            failed: 0,
            items: createdItems
          }
        } catch (error) {
          console.error('Error in bulk create:', error)
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to create items',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            },
            { status: 500 }
          )
        }
        break

      case 'update':
        if (!items.every((item: any) => item.id)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid update data',
              message: 'All items must have an ID for bulk update',
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
        
        // Real bulk update using optimized inventory service
        try {
          const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
          
          const updatePromises = items.map(async (item: any) => {
            try {
              const updatedItem = await optimizedInventoryService.update(item.id, {
                name: item.name,
                sku: item.sku,
                category_id: item.category_id || item.categoryId,
                location_id: item.location_id || item.locationId,
                unit_price: parseFloat(item.unit_price || item.price || 0),
                quantity: parseInt(item.quantity || item.currentStock || 0),
                min_stock: parseInt(item.min_stock || item.minimumLevel || 0),
                max_stock: parseInt(item.max_stock || item.maximumLevel || 0),
                status: item.status || 'active',
                images: item.images || []
              }, user)
              return { success: true, item: updatedItem }
            } catch (error) {
              return { success: false, error: error instanceof Error ? error.message : 'Unknown error', item }
            }
          })

          const updateResults = await Promise.all(updatePromises)
          const successful = updateResults.filter(r => r.success)
          const failed = updateResults.filter(r => !r.success)

          result = {
            successful: successful.length,
            failed: failed.length,
            items: successful.map(r => r.item),
            errors: failed.map(r => ({ item: r.item, error: r.error }))
          }
        } catch (error) {
          console.error('Error in bulk update:', error)
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to update items',
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            },
            { status: 500 }
          )
        }
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid operation',
            message: 'Operation must be "create" or "update"',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
    }

    Logger.apiRequest('POST', '/api/v1/inventory/bulk', { operation, itemCount: items.length })

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Bulk ${operation} operation completed`,
        timestamp: new Date().toISOString()
      }
    )

  } catch (error) {
    Logger.error('Bulk inventory API error:', error)
    return handleAPIError(error)
  }
}

// DELETE /api/v1/inventory/bulk - Bulk delete inventory items
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          message: 'IDs array is required and must not be empty',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (ids.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request too large',
          message: 'Maximum 50 items allowed per bulk delete operation',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Get authenticated user information
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.warn('Could not get authenticated user for audit:', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required for bulk operations',
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      )
    }

    // Real bulk delete using optimized inventory service
    try {
      const { optimizedInventoryService } = await import('@/lib/services/optimized-inventory-service')
      
      const deletePromises = ids.map(async (id: string) => {
        try {
          await optimizedInventoryService.delete(id, user)
          return { success: true, id }
        } catch (error) {
          return { success: false, id, error: error instanceof Error ? error.message : 'Unknown error' }
        }
      })

      const deleteResults = await Promise.all(deletePromises)
      const successful = deleteResults.filter(r => r.success)
      const failed = deleteResults.filter(r => !r.success)

      const result = {
        successful: successful.length,
        failed: failed.length,
        deletedIds: successful.map(r => r.id),
        errors: failed.map(r => ({ id: r.id, error: r.error }))
      }

      Logger.apiRequest('DELETE', '/api/v1/inventory/bulk', { itemCount: ids.length })

      return NextResponse.json(
        {
          success: true,
          data: result,
          message: 'Bulk delete operation completed',
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      console.error('Error in bulk delete:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete items',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

  } catch (error) {
    Logger.error('Bulk delete inventory API error:', error)
    return handleAPIError(error)
  }
}