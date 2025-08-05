import { NextRequest, NextResponse } from 'next/server'
import { impTasksService } from '@/lib/imp-tasks-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const { content, createdBy } = body

    if (!content || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'content and createdBy are required' },
        { status: 400 }
      )
    }

    await impTasksService.addNote(params.id, content, createdBy)

    // Add history entry
    await impTasksService.addHistoryEntry(
      params.id,
      'note_added',
      null,
      null,
      `Nota agregada: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      createdBy
    )

    return NextResponse.json({
      success: true,
      message: 'Note added successfully'
    })

  } catch (error) {
    console.error('Error in IMP task note POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}