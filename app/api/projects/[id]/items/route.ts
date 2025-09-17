import { NextRequest, NextResponse } from 'next/server'
import { projectService, projectItemService, userService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const productType = searchParams.get('product_type')
    
    const projectItems = await projectItemService.getAll(params.id)
    
    // Filter by product type if specified
    const filteredItems = productType 
      ? projectItems.filter((item: any) => item.product_type === productType)
      : projectItems
    
    return NextResponse.json({ success: true, data: filteredItems })
  } catch (error) {
    console.error('Error fetching project items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project items' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('POST /api/projects/[id]/items - Request body:', body)
    
    // Handle both inventoryId and inventoryItemId for compatibility
    const inventoryId = body.inventoryId || body.inventoryItemId
    const { quantity, unitPrice, notes = '', createdBy } = body
    
    if (!inventoryId) {
      console.error('Missing inventoryId/inventoryItemId in request')
      return NextResponse.json(
        { error: 'inventoryId is required' },
        { status: 400 }
      )
    }
    
    if (!createdBy) {
      console.error('Missing createdBy in request')
      return NextResponse.json(
        { error: 'createdBy is required' },
        { status: 400 }
      )
    }
    
    // Determine effective creator (fallback to first available user if invalid)
    let effectiveCreatedBy = createdBy as string
    const isZeroGuid = typeof effectiveCreatedBy === 'string' && effectiveCreatedBy.startsWith('00000000-0000-0000-0000-000000000000')
    if (isZeroGuid) {
      try {
        // Optimized: Get only project-specific items instead of all items for better performance
        const existingItems = await projectItemService.getAll(params.id)
        const sample = Array.isArray(existingItems) && existingItems.length > 0 ? existingItems[0] : null
        if ((sample as any)?.created_by) {
          effectiveCreatedBy = (sample as any).created_by
          console.warn('createdBy fallback used. Using existing project item creator id:', effectiveCreatedBy)
        } else {
          // As a secondary fallback, get only first user instead of all users
          const users = await userService.getAll()
          if (Array.isArray(users) && users.length > 0 && (users[0] as any)?.id) {
            effectiveCreatedBy = (users[0] as any).id
            console.warn('createdBy fallback used. Using first custom user id:', effectiveCreatedBy)
          }
        }
      } catch (e) {
        // ignore and let DB throw if still invalid
      }
    }
    else {
      // Non-zero GUID: validate exists (cached validation could be added here)
      try {
        await userService.getById(createdBy)
      } catch (e) {
        return NextResponse.json(
          { error: 'createdBy does not reference an existing user' },
          { status: 400 }
        )
      }
    }

    // Create project item from inventory
    const newItem = await projectService.addInventoryItemToProject({
      projectId: params.id,
      inventoryId,
      quantity: quantity || 1,
      unitPrice: unitPrice || 0,
      notes,
      createdBy: effectiveCreatedBy
    })
    
    console.log('Successfully created project item:', newItem)
    return NextResponse.json({ success: true, data: newItem })
  } catch (error) {
    console.error('Error adding item to project:', error)
    return NextResponse.json(
      { error: 'Failed to add item to project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}