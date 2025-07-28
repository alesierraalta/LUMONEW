import { NextRequest, NextResponse } from 'next/server'
import { projectItemService } from '@/lib/database'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      itemId,
      newStatus,
      userId,
      userName,
      notes,
      costIncurred
    } = body

    if (!itemId || !newStatus || !userId || !userName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const item = await projectItemService.updateStatus(
      itemId,
      newStatus,
      userId,
      userName,
      notes,
      costIncurred
    )

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Error updating item status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update item status' },
      { status: 500 }
    )
  }
} 