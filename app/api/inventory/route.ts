import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/lib/database'
import { auditedInventoryService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const status = searchParams.get('status')
    const lowStock = searchParams.get('lowStock') === 'true'
    const search = searchParams.get('search')
    
    let data
    
    if (lowStock) {
      data = await inventoryService.getLowStock()
    } else if (category) {
      data = await inventoryService.getByCategory(category)
    } else if (location) {
      data = await inventoryService.getByLocation(location)
    } else {
      data = await inventoryService.getAll()
    }
    
    // Apply additional filters
    if (data && status) {
      data = data.filter((item: any) => item.status === status)
    }
    
    if (data && search) {
      const searchLower = search.toLowerCase()
      data = data.filter((item: any) => 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Inventory API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'sku', 'category_id', 'location_id', 'quantity', 'min_stock', 'max_stock', 'unit_price']
    const missingFields = requiredFields.filter(field => !body[field] && body[field] !== 0)
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          message: `Required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Use audited service for creation
    const newItem = await auditedInventoryService.create({
      name: body.name,
      sku: body.sku,
      category_id: body.category_id,
      location_id: body.location_id,
      quantity: body.quantity,
      min_stock: body.min_stock,
      max_stock: body.max_stock,
      unit_price: body.unit_price,
      status: body.status || 'active'
    })

    return NextResponse.json({
      success: true,
      data: newItem
    })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Use audited service for updates
    const updatedItem = await auditedInventoryService.update(id, updates)

    return NextResponse.json({
      success: true,
      data: updatedItem
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Use audited service for deletion
    await auditedInventoryService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Inventory item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}