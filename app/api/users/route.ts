import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-with-retry'
import { createAdminClient, isAdminAvailable } from '@/lib/supabase/admin-client'
import { withAuth, isAdmin, hasPermission } from '@/lib/auth/middleware'
import rateLimit from '@/lib/utils/rate-limit'
import { withCSRFProtection } from '@/lib/security/csrf'
import validator from 'validator'
import DOMPurify from 'isomorphic-dompurify'

// Rate limiter for user creation (5 requests per hour per IP)
const createUserLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per hour
  tokensPerInterval: 5, // 5 requests per IP per hour
})

// GET method to fetch users - requires authentication
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: ['manage_users']
    })
    
    if (error) return error
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = createClient()
    
    // Get users from auth.users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name')
      .order('email')
    
    if (fetchError) {
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
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
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


// Apply CSRF protection to POST requests
const protectedPOST = withCSRFProtection(async (request: NextRequest) => {
  try {
    // Apply rate limiting
    const identifier = request.ip || 'anonymous'
    const { success: rateLimitSuccess } = await createUserLimiter.check(identifier)
    
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Authenticate user and check permissions
    const { user: currentUser, error } = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: ['users.create']
    })
    
    if (error) return error
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json(
        { success: false, error: 'Admin privileges required to create users' },
        { status: 403 }
      )
    }

    // Check if admin operations are available
    if (!isAdminAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Admin operations not configured. Missing SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      )
    }
    
    const supabase = createClient()
    const body = await request.json()
    
    const { name, email, password, role } = body
    
    // Enhanced validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }
    
    // Sanitize inputs
    const sanitizedName = name.trim().replace(/[<>"'&]/g, '')
    const sanitizedEmail = email.trim().toLowerCase()
    
    if (sanitizedName.length < 2 || sanitizedName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 50 characters' },
        { status: 400 }
      )
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }
    
    // Enhanced password validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }
    
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      )
    }
    
    // Validate role
    const validRoles = ['user', 'moderator', 'admin']
    const userRole = role && validRoles.includes(role) ? role : 'user'
    
    // Only admins can create admin users
    if (userRole === 'admin' && !hasPermission(currentUser, 'roles.manage')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create admin users' },
        { status: 403 }
      )
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', sanitizedEmail)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      )
    }
    
    // Create admin client for user creation
    const adminClient = createAdminClient()
    
    // Create user in Supabase Auth with auto-confirm email
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      user_metadata: {
        full_name: sanitizedName,
        role: userRole
      },
      email_confirm: true // Auto-confirm email for admin-created users
    })
    
    if (authError) {
      console.error('Auth user creation error:', authError)
      
      // Handle specific error cases
      if (authError.message?.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'A user with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: `Failed to create user: ${authError.message}` },
        { status: 400 }
      )
    }
    
    // Insert user into public.users table
    try {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          auth_user_id: authData.user.id,
          email: sanitizedEmail,
          name: sanitizedName,
          role: userRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('Error inserting user into public.users table:', insertError)
        
        // If we can't insert into users table, clean up the auth user
        try {
          await adminClient.auth.admin.deleteUser(authData.user.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user after database error:', cleanupError)
        }
        
        return NextResponse.json(
          { success: false, error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    } catch (insertError) {
      console.error('Exception inserting user into public.users table:', insertError)
      
      // Cleanup auth user
      try {
        await adminClient.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user after exception:', cleanupError)
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }
    
    // Log the user creation for audit purposes
    console.log(`User created successfully by admin ${currentUser.email}:`, {
      userId: authData.user.id,
      email: sanitizedEmail,
      role: userRole,
      createdBy: currentUser.id
    })
    
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: sanitizedName,
        role: userRole
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
})

export { protectedPOST as POST }
