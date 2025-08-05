import { NextRequest, NextResponse } from 'next/server'
import { clTaskNotesService } from '@/lib/cl-tasks-service'

// GET /api/cl-tasks/[id]/notes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await clTaskNotesService.getNotesByTask(params.id)

    return NextResponse.json({
      success: true,
      data: notes
    })
  } catch (error) {
    console.error('Error fetching CL task notes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CL task notes' },
      { status: 500 }
    )
  }
}

// POST /api/cl-tasks/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content, createdBy, createdByName } = body

    if (!content || !createdBy || !createdByName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const note = await clTaskNotesService.addNote({
      taskId: params.id,
      content,
      createdBy,
      createdByName
    })

    return NextResponse.json({
      success: true,
      data: note
    })
  } catch (error) {
    console.error('Error creating CL task note:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create CL task note' },
      { status: 500 }
    )
  }
}