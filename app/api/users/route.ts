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