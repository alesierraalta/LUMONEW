import { NextRequest, NextResponse } from 'next/server'
import { locationService, inventoryService } from '@/lib/database'
import { auditedLocationService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const search = searchParams.get('search')
    
    let data = await locationService.getAll()
    
    // Apply filters
    if (data && search) {
      const searchLower = search.toLowerCase()
      data = data.filter(location => 
        location.name.toLowerCase().includes(searchLower) ||
        (location.address && location.address.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Locations API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch locations',
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
    const requiredFields = ['name']
    const missingFields = requiredFields.filter(field => !body[field])
    
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

    // Validate name length
    if (body.name.length < 2 || body.name.length > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Location name must be between 2 and 100 characters'
        },
        { status: 400 }
      )
    }

    // Use audited service for creation
    const newLocation = await auditedLocationService.create({
      name: body.name,
      address: body.address || null
    })

    return NextResponse.json({
      success: true,
      data: newLocation
    })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create location',
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
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Validate name length if provided
    if (updates.name && (updates.name.length < 2 || updates.name.length > 100)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Location name must be between 2 and 100 characters'
        },
        { status: 400 }
      )
    }

    // Use audited service for updates
    const updatedLocation = await auditedLocationService.update(id, updates)

    return NextResponse.json({
      success: true,
      data: updatedLocation
    })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update location',
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
        { success: false, error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Check if location is in use by inventory items
    const inventoryItems = await inventoryService.getByLocation(id)
    if (inventoryItems && inventoryItems.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete location that is in use by inventory items',
          message: `Location is used by ${inventoryItems.length} inventory item(s)`
        },
        { status: 400 }
      )
    }

    // Use audited service for deletion
    await auditedLocationService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete location',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}