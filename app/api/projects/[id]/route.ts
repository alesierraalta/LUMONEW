import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await projectService.getById(params.id)
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
} 