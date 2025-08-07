import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const productType = searchParams.get('product_type')
    
    const projectItems = await projectService.getProjectItems(params.id)
    
    // Filter by product type if specified
    const filteredItems = productType 
      ? projectItems.filter((item: any) => item.product_type === productType)
      : projectItems
    
    return NextResponse.json(filteredItems)
  } catch (error) {
    console.error('Error fetching project items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project items' },
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
    const { inventoryId, quantity, unitPrice, notes, createdBy } = body
    
    // Create project item from inventory
    const newItem = await projectService.addInventoryItemToProject({
      projectId: params.id,
      inventoryId,
      quantity,
      unitPrice,
      notes,
      createdBy
    })
    
    return NextResponse.json(newItem)
  } catch (error) {
    console.error('Error adding item to project:', error)
    return NextResponse.json(
      { error: 'Failed to add item to project' },
      { status: 500 }
    )
  }
}