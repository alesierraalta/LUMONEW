import { NextRequest, NextResponse } from 'next/server'
import { projectItemService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    
    const items = await projectItemService.getAll(projectId || undefined)
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Error fetching project items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project items' },
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
      productDescription,
      quantity,
      unitPrice,
      inventoryItemId,
      supplierName,
      supplierContactInfo,
      supplierEmail,
      supplierPhone,
      expectedDelivery,
      notes,
      createdBy
    } = body

    if (!projectId || !productType || !productName || !quantity || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const totalPrice = unitPrice ? unitPrice * quantity : undefined

    const item = await projectItemService.create({
      project_id: projectId,
      product_type: productType,
      product_name: productName,
      product_description: productDescription,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      inventory_item_id: inventoryItemId,
      supplier_name: supplierName,
      supplier_contact_info: supplierContactInfo,
      supplier_email: supplierEmail,
      supplier_phone: supplierPhone,
      expected_delivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
      notes,
      created_by: createdBy
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error creating project item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create project item' },
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

    // Convert date fields
    const processedUpdates = {
      ...updates,
      expected_delivery: updates.expectedDelivery ? new Date(updates.expectedDelivery) : undefined,
      actual_delivery: updates.actualDelivery ? new Date(updates.actualDelivery) : undefined,
      quotation_paid: updates.quotationPaid ? new Date(updates.quotationPaid) : undefined,
      supplier_pi_paid: updates.supplierPIPaid ? new Date(updates.supplierPIPaid) : undefined,
      customs_duty_paid: updates.customsDutyPaid ? new Date(updates.customsDutyPaid) : undefined
    }

    const item = await projectItemService.update(id, processedUpdates)
    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error updating project item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project item' },
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

    await projectItemService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project item' },
      { status: 500 }
    )
  }
} 