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
      ? items.filter(item => item.quantity > 0)
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