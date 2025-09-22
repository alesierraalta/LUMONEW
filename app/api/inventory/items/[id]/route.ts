import { NextRequest, NextResponse } from 'next/server'
import { auditedInventoryService } from '@/lib/database-with-audit'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server-with-retry'
import { auditService } from '@/lib/audit'

async function setAuditUserFromRequest() {
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) {
      console.log('Setting audit user context:', data.user.email)
      auditService.setUserContext(data.user)
      return data.user
    } else {
      console.warn('No user found for audit context:', error)
      return null
    }
  } catch (error) {
    console.error('Error setting audit user context:', error)
    return null
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await auditedInventoryService.getById(params.id)
    
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
    // Set up audit user context first
    const user = await setAuditUserFromRequest()
    
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

    // Debug logging
    console.log('🔍 Authentication Debug (PUT):')
    console.log('  - User:', user ? `${user.email} (${user.id})` : 'No user found')
    console.log('  - Request headers:', Object.fromEntries(request.headers.entries()))
    
    if (!user) {
      console.warn('⚠️ No authenticated user found - audit will show "Sistema automático"')
    } else {
      console.log('✅ User authenticated successfully for audit:', user.email)
    }

    const updatedItem = await auditedInventoryService.update(params.id, {
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
    })
    
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
    // Set up audit user context first
    const user = await setAuditUserFromRequest()
    
    // Debug logging
    console.log('🔍 Authentication Debug (DELETE):')
    console.log('  - User:', user ? `${user.email} (${user.id})` : 'No user found')
    console.log('  - Request headers:', Object.fromEntries(request.headers.entries()))
    
    if (!user) {
      console.warn('⚠️ No authenticated user found - audit will show "Sistema automático"')
    } else {
      console.log('✅ User authenticated successfully for audit:', user.email)
    }

    await auditedInventoryService.delete(params.id)
    
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