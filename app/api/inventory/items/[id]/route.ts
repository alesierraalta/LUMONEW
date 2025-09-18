import { NextRequest, NextResponse } from 'next/server'
import { optimizedInventoryService } from '@/lib/services/optimized-inventory-service'
import { createClient } from '@/lib/supabase/server-with-retry'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await optimizedInventoryService.getById(params.id)
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.sku || !body.name) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['sku', 'name'],
          received: Object.keys(body)
        },
        { status: 400 }
      )
    }

    // Get authenticated user information
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Debug logging
    console.log('🔍 Authentication Debug (PUT):')
    console.log('  - User:', user ? `${user.email} (${user.id})` : 'No user found')
    console.log('  - Auth Error:', authError)
    console.log('  - Request headers:', Object.fromEntries(request.headers.entries()))
    
    if (authError) {
      console.warn('❌ Could not get authenticated user for audit:', authError)
    } else if (!user) {
      console.warn('⚠️ No authenticated user found - audit will show "Sistema automático"')
    } else {
      console.log('✅ User authenticated successfully for audit:', user.email)
    }

    const updatedItem = await optimizedInventoryService.update(params.id, {
      sku: body.sku,
      name: body.name,
      category_id: body.category_id || body.categoryId,
      location_id: body.location_id || body.locationId,
      unit_price: parseFloat(body.unit_price || body.price || 0),
      quantity: parseInt(body.quantity || body.currentStock || 0),
      min_stock: parseInt(body.min_stock || body.minimumLevel || 0),
      max_stock: parseInt(body.max_stock || body.maximumLevel || body.quantity * 2 || 0),
      status: body.status || 'active',
      images: body.images || []
    }, user) // Pass user context for audit
    
    return NextResponse.json({
      success: true,
      item: updatedItem
    })
  } catch (error) {
    console.error('Error updating inventory item:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { 
            error: 'SKU already exists',
            message: 'An item with this SKU already exists in the system'
          },
          { status: 409 }
        )
      }
      
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { 
            error: 'Invalid category or location',
            message: 'The specified category or location does not exist'
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user information
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Debug logging
    console.log('🔍 Authentication Debug (DELETE):')
    console.log('  - User:', user ? `${user.email} (${user.id})` : 'No user found')
    console.log('  - Auth Error:', authError)
    console.log('  - Request headers:', Object.fromEntries(request.headers.entries()))
    
    if (authError) {
      console.warn('❌ Could not get authenticated user for audit:', authError)
    } else if (!user) {
      console.warn('⚠️ No authenticated user found - audit will show "Sistema automático"')
    } else {
      console.log('✅ User authenticated successfully for audit:', user.email)
    }

    await optimizedInventoryService.delete(params.id, user) // Pass user context for audit
    
    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete inventory item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}