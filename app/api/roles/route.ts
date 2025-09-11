import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-with-retry'
import { withAuth } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user - roles can be viewed by authenticated users
    const { user, error } = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: []
    })
    
    if (error) return error
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createClient()
    
    // Get roles from database with user count
    const { data: roles, error: fetchError } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        description,
        permissions,
        color,
        is_system,
        user_count,
        created_at,
        updated_at
      `)
      .order('name')

    if (fetchError) {
      console.error('Error fetching roles:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener los roles' },
        { status: 500 }
      )
    }

    // If no roles exist, create default ones
    if (!roles || roles.length === 0) {
      console.log('No roles found, creating default roles...')
      
      const defaultRoles = [
        {
          name: 'user',
          description: 'Usuario estándar con permisos básicos',
          permissions: ['read_profile', 'update_profile'],
          color: 'green',
          is_system: false
        },
        {
          name: 'moderator',
          description: 'Moderador con permisos de gestión de contenido',
          permissions: ['read_profile', 'update_profile', 'moderate_content', 'manage_posts'],
          color: 'orange',
          is_system: false
        },
        {
          name: 'admin',
          description: 'Administrador con permisos completos',
          permissions: ['read_profile', 'update_profile', 'manage_users', 'manage_roles', 'system_admin'],
          color: 'red',
          is_system: true
        }
      ]

      const { data: createdRoles, error: createError } = await supabase
        .from('roles')
        .insert(defaultRoles)
        .select()

      if (createError) {
        console.error('Error creating default roles:', createError)
        return NextResponse.json(
          { success: false, error: 'Error creating default roles' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: createdRoles
      })
    }

    // Update user counts dynamically
    for (const role of roles) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', role.name)

      // Update role user count if different
      if (count !== role.user_count) {
        await supabase
          .from('roles')
          .update({ 
            user_count: count || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', role.id)
        
        role.user_count = count || 0
      }
    }

    return NextResponse.json({
      success: true,
      data: roles
    })

  } catch (error) {
    console.error('Error in GET /api/roles:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user - only users with manage_roles permission can create roles
    const { user, error } = await withAuth(request, {
      requireAuth: true,
      requiredPermissions: ['manage_roles']
    })
    
    if (error) return error
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, permissions, color } = body

    // Validate required fields
    if (!name || !description || !permissions || !color) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    // Validate permissions array
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe seleccionar al menos un permiso' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if role name already exists
    const { data: existingRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', name.toLowerCase())
      .single()

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Ya existe un rol con ese nombre' },
        { status: 400 }
      )
    }

    // Create new role
    const { data: newRole, error: createError } = await supabase
      .from('roles')
      .insert({
        name: name.toLowerCase(),
        description,
        permissions,
        color,
        is_system: false,
        user_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating role:', createError)
      return NextResponse.json(
        { success: false, error: 'Error al crear el rol' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newRole
    })

  } catch (error) {
    console.error('Error in POST /api/roles:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}