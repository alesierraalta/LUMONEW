import { NextRequest, NextResponse } from 'next/server'
import { clTasksService } from '@/lib/cl-tasks-service'

// POST /api/cl-tasks/[id]/work-data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      executionDate,
      executedBy,
      executedById,
      notes,
      attachments,
      specificData
    } = body

    if (!executionDate || !executedById) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: executionDate and executedById' },
        { status: 400 }
      )
    }

    // Save work data to the task
    const workData = await clTasksService.saveWorkData(params.id, {
      executionDate: new Date(executionDate),
      executedBy,
      executedById,
      notes,
      attachments: attachments || [],
      specificData: specificData || {}
    })

    return NextResponse.json({
      success: true,
      data: workData
    })
  } catch (error) {
    console.error('Error saving CL task work data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save work data' },
      { status: 500 }
    )
  }
}

// GET /api/cl-tasks/[id]/work-data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workData = await clTasksService.getWorkData(params.id)

    return NextResponse.json({
      success: true,
      data: workData
    })
  } catch (error) {
    console.error('Error fetching CL task work data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work data' },
      { status: 500 }
    )
  }
}