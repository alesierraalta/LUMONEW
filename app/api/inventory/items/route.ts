import { NextRequest, NextResponse } from 'next/server'
import { auditedInventoryService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const withStock = searchParams.get('withStock') === 'true'
    
    // Get all inventory items
    const items = await auditedInventoryService.getAll()
    
    // Filter items with stock > 0 if requested
    const filteredItems = withStock 
      ? items.filter((item: any) => item.quantity > 0)
      : items
    
    return NextResponse.json(filteredItems)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.sku || !body.name) {
      return NextResponse.json(
        { error: 'SKU and name are required' },
        { status: 400 }
      )
    }
    
    // Create new inventory item
    const newItem = await auditedInventoryService.create({
      sku: body.sku,
      name: body.name,
      category_id: body.category_id || null,
      location_id: body.location_id || null,
      unit_price: body.unit_price || 0,
      quantity: body.quantity || 0,
      min_stock: body.min_stock || 0,
      max_stock: body.max_stock || 0,
      status: body.status || 'active'
    })
    
    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}