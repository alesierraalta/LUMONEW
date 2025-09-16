import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/services/inventory/inventory.service'
import { withMiddleware, middlewareUtils } from '@/lib/middleware/api-middleware'
import type { InventoryFilters } from '@/lib/services/inventory/inventory.types'

/**
 * Enhanced Inventory API with microservice architecture
 * Implements caching, rate limiting, validation, and error handling
 */

// GET /api/v1/inventory - Fetch inventory items with advanced filtering
export const GET = middlewareUtils.withCache(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      
      // Parse and validate query parameters
      const filters: InventoryFilters = {
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        location: searchParams.get('location') || undefined,
        status: searchParams.get('status') as any || undefined,
        lowStock: searchParams.get('lowStock') === 'true',
        outOfStock: searchParams.get('outOfStock') === 'true',
        stockStatus: searchParams.get('stockStatus') as any || undefined,
        priceRange: searchParams.get('priceMin') && searchParams.get('priceMax') ? {
          min: parseFloat(searchParams.get('priceMin')!),
          max: parseFloat(searchParams.get('priceMax')!)
        } : undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
        sortBy: searchParams.get('sortBy') || 'created_at',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
      }

      // Remove undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )

      // Get inventory items with caching
      const items = await inventoryService.getAll(cleanFilters)
      
      // Get total count for pagination
      const totalCount = await inventoryService.count?.(cleanFilters) || items.length
      
      // Calculate pagination info
      const page = filters.page || 1
      const limit = filters.limit || 20
      const totalPages = Math.ceil(totalCount / limit)
      
      return NextResponse.json({
        success: true,
        data: {
          items,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          filters: cleanFilters,
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Inventory API GET error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch inventory items',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  },
  5 * 60 * 1000 // 5 minutes cache
)

// POST /api/v1/inventory - Create new inventory item
export const POST = middlewareUtils.withAuth(
  async (request: NextRequest, context) => {
    try {
      const body = await request.json()
      
      // Validate required fields
      const requiredFields = ['name', 'sku', 'categoryId', 'locationId', 'currentStock', 'minimumLevel', 'price']
      const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0)
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields',
            message: `Required fields: ${missingFields.join(', ')}`,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Validate item data
      const validationResult = await inventoryService.validateItem(body)
      if (!validationResult.isValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            message: 'Invalid item data',
            details: validationResult.errors,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Create inventory item
      const newItem = await inventoryService.create(body)

      // Log the creation
      console.log(`[${context.requestId}] Inventory item created:`, {
        itemId: newItem.id,
        sku: newItem.sku,
        name: newItem.name,
        userId: context.user?.id
      })

      return NextResponse.json(
        {
          success: true,
          data: newItem,
          message: 'Inventory item created successfully',
          timestamp: new Date().toISOString()
        },
        { status: 201 }
      )

    } catch (error) {
      console.error('Inventory API POST error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create inventory item',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)

// PUT /api/v1/inventory - Update inventory item
export const PUT = middlewareUtils.withAuth(
  async (request: NextRequest, context) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing ID parameter',
            message: 'Item ID is required for updates',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      const body = await request.json()
      
      // Validate item data if provided
      if (Object.keys(body).length > 0) {
        const validationResult = await inventoryService.validateItem(body)
        if (!validationResult.isValid) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              message: 'Invalid item data',
              details: validationResult.errors,
              timestamp: new Date().toISOString()
            },
            { status: 400 }
          )
        }
      }

      // Update inventory item
      const updatedItem = await inventoryService.update(id, body)

      // Log the update
      console.log(`[${context.requestId}] Inventory item updated:`, {
        itemId: id,
        sku: updatedItem.sku,
        name: updatedItem.name,
        userId: context.user?.id,
        changes: Object.keys(body)
      })

      return NextResponse.json(
        {
          success: true,
          data: updatedItem,
          message: 'Inventory item updated successfully',
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      console.error('Inventory API PUT error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update inventory item',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)

// DELETE /api/v1/inventory - Delete inventory item
export const DELETE = middlewareUtils.withAuth(
  async (request: NextRequest, context) => {
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing ID parameter',
            message: 'Item ID is required for deletion',
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      // Get item details before deletion for logging
      const item = await inventoryService.getById(id)
      
      // Delete inventory item
      await inventoryService.delete(id)

      // Log the deletion
      console.log(`[${context.requestId}] Inventory item deleted:`, {
        itemId: id,
        sku: item?.sku,
        name: item?.name,
        userId: context.user?.id
      })

      return NextResponse.json(
        {
          success: true,
          message: 'Inventory item deleted successfully',
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      console.error('Inventory API DELETE error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete inventory item',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)