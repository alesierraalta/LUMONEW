import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple UUID generator function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const itemId = formData.get('itemId') as string

    console.log('Image upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      itemId
    })

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${generateUUID()}.${fileExtension}`
    const filePath = `inventory/${itemId || 'temp'}/${fileName}`

    console.log('Attempting to upload to Supabase:', {
      bucket: 'inventory-images',
      filePath,
      fileName
    })

    // Upload to Supabase Storage
    const supabase = createClient()
    
    // First, try to create the bucket if it doesn't exist
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === 'inventory-images')
      
      if (!bucketExists) {
        console.log('Creating inventory-images bucket...')
        const { error: createError } = await supabase.storage.createBucket('inventory-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.error('Error creating bucket:', createError)
          // Continue anyway, the bucket might already exist
        } else {
          console.log('Bucket created successfully')
        }
      }
    } catch (bucketError) {
      console.warn('Bucket creation check failed:', bucketError)
      // Continue with upload attempt
    }

    const { data, error } = await supabase.storage
      .from('inventory-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to upload image',
          details: error.message,
          code: error.statusCode
        },
        { status: 500 }
      )
    }

    console.log('Upload successful:', data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('inventory-images')
      .getPublicUrl(filePath)

    console.log('Public URL generated:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName: fileName,
      filePath: filePath
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { error } = await supabase.storage
      .from('inventory-images')
      .remove([filePath])

    if (error) {
      console.error('Supabase storage delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })

  } catch (error) {
    console.error('Image delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}