const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Check if the handle_new_user function exists
    console.log('📋 Checking if handle_new_user function exists...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_name', 'handle_new_user')
      .eq('routine_schema', 'public');
    
    if (funcError) {
      console.error('❌ Error checking functions:', funcError.message);
    } else {
      console.log('📋 Functions found:', functions?.length || 0);
      if (functions && functions.length > 0) {
        console.log('✅ handle_new_user function exists');
      } else {
        console.log('⏳ handle_new_user function not found - migration may still be running');
      }
    }
    
    // Check if triggers exist
    console.log('🔧 Checking if triggers exist...');
    const { data: triggers, error: trigError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .like('trigger_name', '%auth_user%');
    
    if (trigError) {
      console.error('❌ Error checking triggers:', trigError.message);
    } else {
      console.log('🔧 Triggers found:', triggers?.length || 0);
      triggers?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    }
    
    // Check users table structure
    console.log('👥 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error checking users table:', usersError.message);
    } else {
      console.log(`👥 Users table accessible, ${users?.length || 0} users found`);
    }
    
    console.log('✅ Migration status check completed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkMigrationStatus().catch(console.error);