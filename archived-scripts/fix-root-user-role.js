const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRootUserRole() {
  try {
    console.log('🔍 Verificando usuarios y roles...')
    
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError)
      return
    }
    
    console.log(`📊 Total de usuarios encontrados: ${authUsers.users.length}`)
    
    // Find root user (assuming it's the first admin or has 'root' in email)
    let rootUser = null
    
    // Look for user with 'root' in email or the first user (likely admin)
    rootUser = authUsers.users.find(user => 
      user.email?.includes('root') || 
      user.email?.includes('admin') ||
      user.user_metadata?.role === 'admin'
    )
    
    // If no obvious root user, take the first user
    if (!rootUser && authUsers.users.length > 0) {
      rootUser = authUsers.users[0]
      console.log('⚠️  No se encontró usuario root obvio, usando el primer usuario')
    }
    
    if (!rootUser) {
      console.log('❌ No se encontró ningún usuario para asignar como root')
      return
    }
    
    console.log(`👤 Usuario encontrado: ${rootUser.email} (ID: ${rootUser.id})`)
    console.log(`📋 Rol actual: ${rootUser.user_metadata?.role || 'sin rol'}`)
    
    // Update user metadata to admin role
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      rootUser.id,
      {
        user_metadata: {
          ...rootUser.user_metadata,
          role: 'admin',
          full_name: rootUser.user_metadata?.full_name || rootUser.email?.split('@')[0] || 'Admin'
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error actualizando usuario:', updateError)
      return
    }
    
    console.log('✅ Usuario actualizado exitosamente')
    console.log(`📋 Nuevo rol: ${updatedUser.user.user_metadata?.role}`)
    
    // Also check/update users table if it exists
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', rootUser.id)
      .single()
    
    if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('⚠️  Error verificando tabla users:', userError.message)
    } else if (userRecord) {
      console.log('📊 Registro en tabla users encontrado')
      
      // Update users table record
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          full_name: updatedUser.user.user_metadata?.full_name,
          role: 'admin'
        })
        .eq('id', rootUser.id)
      
      if (updateUserError) {
        console.log('⚠️  Error actualizando tabla users:', updateUserError.message)
      } else {
        console.log('✅ Tabla users actualizada')
      }
    } else {
      console.log('📝 Creando registro en tabla users...')
      
      // Create record in users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: rootUser.id,
          email: rootUser.email,
          full_name: updatedUser.user.user_metadata?.full_name,
          role: 'admin'
        })
      
      if (insertError) {
        console.log('⚠️  Error creando registro en users:', insertError.message)
      } else {
        console.log('✅ Registro creado en tabla users')
      }
    }
    
    console.log('\n🎉 Proceso completado. El usuario debería poder crear usuarios ahora.')
    console.log('💡 Intenta cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Run the fix
fixRootUserRole()
  .then(() => {
    console.log('\n✅ Script ejecutado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })