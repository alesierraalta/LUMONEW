import { NextRequest, NextResponse } from 'next/server'
import { auditedCategoryService } from '@/lib/database-with-audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category name is required' 
        },
        { status: 400 }
      )
    }

    // Get all categories
    const categories = await auditedCategoryService.getAll()
    
    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: true,
        category: null
      })
    }

    // Search for exact match first
    let foundCategory = categories.find((cat: any) => 
      cat.name.toLowerCase() === name.toLowerCase()
    )

    // If no exact match, search for partial match
    if (!foundCategory) {
      foundCategory = categories.find((cat: any) => 
        cat.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(cat.name.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      category: foundCategory || null
    })

  } catch (error) {
    console.error('Categories search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}