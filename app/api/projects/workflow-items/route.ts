import { NextRequest, NextResponse } from 'next/server'
import { workflowItemService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    const items = await workflowItemService.getAll(projectId || undefined)
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Error fetching workflow items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      projectId,
      productType,
      productName,
      currentStep,
      stepData,
      createdBy
    } = body

    if (!projectId || !productType || !productName || !currentStep || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate product type
    if (!['CL', 'IMP'].includes(productType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product type. Must be CL or IMP' },
        { status: 400 }
      )
    }

    const item = await workflowItemService.create({
      project_id: projectId,
      product_type: productType,
      product_name: productName,
      current_step: currentStep,
      step_data: stepData || {},
      created_by: createdBy
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error creating workflow item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow item' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, currentStep, stepData, ...otherUpdates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Workflow item ID is required' },
        { status: 400 }
      )
    }

    const updates: any = { ...otherUpdates }
    
    if (currentStep) {
      updates.current_step = currentStep
    }
    
    if (stepData) {
      updates.step_data = stepData
    }

    const item = await workflowItemService.update(id, updates)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error updating workflow item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workflow item' },
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
        { success: false, error: 'Workflow item ID is required' },
        { status: 400 }
      )
    }

    await workflowItemService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow item' },
      { status: 500 }
    )
  }
} 