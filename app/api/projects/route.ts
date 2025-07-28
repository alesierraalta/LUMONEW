import { NextRequest, NextResponse } from 'next/server'
import { projectService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching all projects...')
    const projects = await projectService.getAll()
    console.log(`✅ Found ${projects?.length || 0} projects`)
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error('❌ Error fetching projects:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new project...')
    const body = await request.json()
    console.log('📋 Request body:', JSON.stringify(body, null, 2))
    
    const {
      name,
      description,
      priority,
      startDate,
      expectedEndDate,
      createdBy
    } = body

    // Validate required fields
    if (!name || !priority || !startDate || !createdBy) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!priority) missingFields.push('priority')
      if (!startDate) missingFields.push('startDate')
      if (!createdBy) missingFields.push('createdBy')
      
      console.error('❌ Missing required fields:', missingFields)
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority value
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (!validPriorities.includes(priority)) {
      console.error('❌ Invalid priority value:', priority)
      return NextResponse.json(
        { success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate dates
    const startDateObj = new Date(startDate)
    if (isNaN(startDateObj.getTime())) {
      console.error('❌ Invalid start date:', startDate)
      return NextResponse.json(
        { success: false, error: 'Invalid start date format' },
        { status: 400 }
      )
    }

    let expectedEndDateObj = undefined
    if (expectedEndDate) {
      expectedEndDateObj = new Date(expectedEndDate)
      if (isNaN(expectedEndDateObj.getTime())) {
        console.error('❌ Invalid expected end date:', expectedEndDate)
        return NextResponse.json(
          { success: false, error: 'Invalid expected end date format' },
          { status: 400 }
        )
      }
    }

    console.log('✅ Validation passed, creating project...')
    const project = await projectService.create({
      name,
      description,
      priority,
      start_date: startDateObj,
      expected_end_date: expectedEndDateObj,
      created_by: createdBy
    })

    console.log('✅ Project created successfully:', project.id)
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('❌ Error creating project:', error)
    
    // Handle specific Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as any
      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'A project with this name already exists' },
          { status: 409 }
        )
      }
      if (supabaseError.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID provided' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
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
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Convert date strings to Date objects
    const processedUpdates = {
      ...updates,
      expected_end_date: updates.expectedEndDate ? new Date(updates.expectedEndDate) : undefined,
      actual_end_date: updates.actualEndDate ? new Date(updates.actualEndDate) : undefined
    }

    const project = await projectService.update(id, processedUpdates)
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update project' },
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
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    await projectService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    )
  }
} 