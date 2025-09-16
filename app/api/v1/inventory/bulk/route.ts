import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/services/inventory/inventory.service'
import { middlewareUtils } from '@/lib/middleware/api-middleware'

/**
 * Bulk Operations API for Inventory
 * Handles bulk create, update, and delete operations with optimized performance
 */

// POST /api/v1/inventory/bulk - Bulk create inventory items
export const POST = middlewareUtils.withAuth(
  async (request: NextRequest, context) => {
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
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }

      let result: any

      switch (operation) {
        case 'create':
          result = await inventoryService.bulkCreate(items)
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
          result = await inventoryService.bulkUpdate(items)
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

      // Log the bulk operation
      console.log(`[${context.requestId}] Bulk inventory operation:`, {
        operation,
        itemCount: items.length,
        successCount: result.successful,
        failureCount: result.failed,
        userId: context.user?.id
      })

      return NextResponse.json(
        {
          success: true,
          data: result,
          message: `Bulk ${operation} operation completed`,
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      console.error('Bulk inventory API error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Bulk operation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)

// DELETE /api/v1/inventory/bulk - Bulk delete inventory items
export const DELETE = middlewareUtils.withAuth(
  async (request: NextRequest, context) => {
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

      // Validate all IDs exist
      const existingItems = await Promise.all(
        ids.map(async (id: string) => {
          const item = await inventoryService.getById(id)
          return { id, exists: !!item }
        })
      )

      const nonExistentIds = existingItems.filter(item => !item.exists).map(item => item.id)
      if (nonExistentIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Some items not found',
            message: 'The following items do not exist',
            details: nonExistentIds,
            timestamp: new Date().toISOString()
          },
          { status: 404 }
        )
      }

      // Perform bulk delete
      const result = await inventoryService.bulkDelete(ids)

      // Log the bulk deletion
      console.log(`[${context.requestId}] Bulk inventory deletion:`, {
        itemCount: ids.length,
        successCount: result.successful,
        failureCount: result.failed,
        userId: context.user?.id
      })

      return NextResponse.json(
        {
          success: true,
          data: result,
          message: 'Bulk delete operation completed',
          timestamp: new Date().toISOString()
        }
      )

    } catch (error) {
      console.error('Bulk delete inventory API error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Bulk delete operation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
)