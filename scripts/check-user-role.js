// Script para verificar el rol actual del usuario
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://hnbtninlyzpdemyudaqg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mjc5NCwiZXhwIjoyMDY4NjY4Nzk0fQ.Cgbmm19Uvfk-R_-QhUs-E-YasSYRGpsWXPuSYhODbpk'
);

async function checkUserRole() {
  try {
    console.log('🔍 Verificando rol del usuario alesierraalta@gmail.com...');
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError);
      return;
    }
    
    console.log('\n📋 Usuarios en auth.users:');
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`);
      console.log(`   App Metadata: ${JSON.stringify(user.app_metadata, null, 2)}`);
      console.log('---');
    });
    
    // Find specific user
    const targetUser = authUsers.users.find(user => user.email === 'alesierraalta@gmail.com');
    
    if (!targetUser) {
      console.log('❌ Usuario alesierraalta@gmail.com no encontrado en auth.users');
      return;
    }
    
    console.log('\n✅ Usuario encontrado:');
    console.log(`Email: ${targetUser.email}`);
    console.log(`ID: ${targetUser.id}`);
    console.log(`Role en user_metadata: ${targetUser.user_metadata?.role || 'No definido'}`);
    console.log(`Role en app_metadata: ${targetUser.app_metadata?.role || 'No definido'}`);
    
    // Check public.users table if exists
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com');
    
    if (publicError) {
      console.log('⚠️  Error consultando tabla public.users:', publicError.message);
    } else {
      console.log('\n📋 Usuario en public.users:');
      console.log(JSON.stringify(publicUsers, null, 2));
    }
    
    // Check if user has admin role in either metadata
    const hasAdminRole = targetUser.user_metadata?.role === 'admin' || 
                        targetUser.app_metadata?.role === 'admin';
    
    if (hasAdminRole) {
      console.log('\n✅ El usuario tiene rol de admin');
    } else {
      console.log('\n❌ El usuario NO tiene rol de admin');
      console.log('🔧 Actualizando rol a admin...');
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        {
          user_metadata: { 
            ...targetUser.user_metadata,
            role: 'admin' 
          },
          app_metadata: {
            ...targetUser.app_metadata,
            role: 'admin'
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error actualizando usuario:', updateError);
      } else {
        console.log('✅ Usuario actualizado exitosamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserRole();