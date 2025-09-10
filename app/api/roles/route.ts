import { NextRequest, NextResponse } from 'next/server'

// Mock roles data - in a real app, this would come from a database
const roles = [
  {
    id: '1',
    name: 'user',
    description: 'Usuario estándar con permisos básicos',
    permissions: ['read_profile', 'update_profile']
  },
  {
    id: '2', 
    name: 'admin',
    description: 'Administrador con permisos completos',
    permissions: ['read_profile', 'update_profile', 'manage_users', 'manage_roles', 'system_admin']
  },
  {
    id: '3',
    name: 'moderator',
    description: 'Moderador con permisos de gestión de contenido',
    permissions: ['read_profile', 'update_profile', 'moderate_content', 'manage_posts']
  }
]

export async function GET(request: NextRequest) {
  try {
    // Simulate a small delay to mimic database query
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return NextResponse.json({
      success: true,
      data: roles
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener los roles'
      },
      { status: 500 }
    )
  }
}
