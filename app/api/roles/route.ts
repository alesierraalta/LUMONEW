import { NextRequest, NextResponse } from 'next/server'
import { roleService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const roles = await roleService.getAll()
    
    return NextResponse.json({
      success: true,
      data: roles
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch roles'
      },
      { status: 500 }
    )
  }
}