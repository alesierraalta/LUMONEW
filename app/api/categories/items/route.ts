import { NextRequest, NextResponse } from 'next/server'
import { serverCategoryService } from '@/lib/services/server-category-service'

export async function GET(request: NextRequest) {
  try {
    const categories = await serverCategoryService.getAll()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}