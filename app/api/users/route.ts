import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/database'
import { auditedUserService } from '@/lib/database-with-audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    let data = await userService.getAll()
    
    // Apply filters
    if (data && role) {
      data = data.filter(user => user.role === role)
    }
    
    if (data && status) {
      const isActive = status === 'active'
      data = data.filter(user => user.is_active === isActive)
    }
    
    if (data && search) {
      const searchLower = search.toLowerCase()
      data = data.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'role']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          message: `Required fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    // Use audited service for creation
    const newUser = await auditedUserService.create({
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status || 'active'
    })

    return NextResponse.json({
      success: true,
      data: newUser
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
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
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updates.email)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email format'
          },
          { status: 400 }
        )
      }
    }

    // Use audited service for updates
    const updatedUser = await auditedUserService.update(id, updates)

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
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
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Use audited service for deletion
    await auditedUserService.delete(id)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}