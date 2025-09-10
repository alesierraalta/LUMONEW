import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get users from auth.users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .order('email')
    
    if (error) {
      // If users table doesn't exist or has no data, get from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('Error fetching users:', authError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      const formattedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
      }))

      return NextResponse.json({
        success: true,
        data: formattedUsers
      })
    }

    return NextResponse.json({
      success: true,
      data: users
    })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { name, email, password, role } = body
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, email, password, role' },
        { status: 400 }
      )
    }
    
    // Validate email format with improved regex and logging
    console.log('Validating email:', email)
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!email || typeof email !== 'string') {
      console.error('Email validation failed: email is not a valid string', { email, type: typeof email })
      return NextResponse.json(
        { success: false, error: 'Email must be a valid string' },
        { status: 400 }
      )
    }
    
    if (!emailRegex.test(email.trim())) {
      console.error('Email validation failed: invalid format', { 
        email: email, 
        trimmed: email.trim(),
        length: email.length,
        hasSpaces: email.includes(' '),
        hasAt: email.includes('@'),
        hasDot: email.includes('.')
      })
      return NextResponse.json(
        { success: false, error: 'Invalid email format. Please use a valid email address (e.g., user@example.com)' },
        { status: 400 }
      )
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: name,
        role: role
      },
      email_confirm: true // Auto-confirm email for admin-created users
    })
    
    if (authError) {
      console.error('Error creating user in auth:', authError)
      
      // Handle specific auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'A user with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: authError.message || 'Failed to create user' },
        { status: 500 }
      )
    }
    
    // Try to create user in public.users table if it exists
    try {
      const { error: publicUserError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          auth_user_id: authData.user.id,
          email: email,
          full_name: name,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (publicUserError) {
        console.warn('Could not create user in public.users table:', publicUserError)
        // Don't fail the request if public.users table doesn't exist or has issues
      }
    } catch (publicError) {
      console.warn('Public users table might not exist:', publicError)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: name,
        role: role
      },
      message: 'User created successfully'
    })
    
  } catch (error) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
