import { NextRequest, NextResponse } from 'next/server'
import { categoryService, inventoryService } from '@/lib/database'
import { auditedCategoryService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    let data = await categoryService.getAll()
    
    // Apply filters
    if (data && !includeInactive) {
      data = data.filter((category: any) => category.is_active !== false)
    }
    
    if (data && search) {
      const searchLower = search.toLowerCase()
      data = data.filter((category: any) => 
        category.name.toLowerCase().includes(searchLower) ||
        (category.description && category.description.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
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
          error: 'Category name must be between 2 and 100 characters'
        },
        { status: 400 }
      )
    }

    // Use audited service for creation
    const newCategory = await auditedCategoryService.create({
      name: body.name,
      description: body.description || null,
      color: body.color || null
    })

    return NextResponse.json({
      success: true,
      data: newCategory
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
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
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Validate name length if provided
    if (updates.name && (updates.name.length < 2 || updates.name.length > 100)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category name must be between 2 and 100 characters'
        },
        { status: 400 }
      )
    }

    // Use audited service for updates
    const updatedCategory = await auditedCategoryService.update(id, updates)

    return NextResponse.json({
      success: true,
      data: updatedCategory
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category',
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
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category is in use by inventory items
    const inventoryItems = await inventoryService.getByCategory(id)
    if (inventoryItems && inventoryItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category that is in use by inventory items',
          message: `Category is used by ${inventoryItems.length} inventory item(s)`
        },
        { status: 400 }
      )
    }

    // Use audited service for deletion
    await auditedCategoryService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}