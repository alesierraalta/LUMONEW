const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Check if the handle_new_user function exists using raw SQL
    console.log('📋 Checking if handle_new_user function exists...');
    const { data: functions, error: funcError } = await supabase.rpc('sql', {
      query: `
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user' 
        AND routine_schema = 'public'
      `
    });
    
    if (funcError) {
      // Try alternative approach
      console.log('📋 Trying alternative function check...');
      const { data: altCheck, error: altError } = await supabase
        .rpc('sql', {
          query: `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') as function_exists`
        });
      
      if (altError) {
        console.error('❌ Error checking functions:', altError.message);
      } else {
        console.log('📋 Function exists:', altCheck?.[0]?.function_exists ? '✅ Yes' : '❌ No');
      }
    } else {
      console.log('📋 Functions found:', functions?.length || 0);
    }
    
    // Check if triggers exist using raw SQL
    console.log('🔧 Checking if triggers exist...');
    const { data: triggers, error: trigError } = await supabase.rpc('sql', {
      query: `
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_name LIKE '%auth_user%'
      `
    });
    
    if (trigError) {
      console.log('🔧 Trying alternative trigger check...');
      const { data: altTriggers, error: altTrigError } = await supabase
        .rpc('sql', {
          query: `SELECT tgname as trigger_name FROM pg_trigger WHERE tgname LIKE '%auth_user%'`
        });
      
      if (altTrigError) {
        console.error('❌ Error checking triggers:', altTrigError.message);
      } else {
        console.log('🔧 Triggers found:', altTriggers?.length || 0);
        altTriggers?.forEach(trigger => {
          console.log(`  - ${trigger.trigger_name}`);
        });
      }
    } else {
      console.log('🔧 Triggers found:', triggers?.length || 0);
      triggers?.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    }
    
    // Check users table
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
    
    // Check auth.users table
    console.log('🔐 Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    
    if (authError) {
      console.error('❌ Error checking auth.users:', authError.message);
    } else {
      console.log(`🔐 Auth users found: ${authUsers?.[0]?.count || 0}`);
    }
    
    console.log('✅ Migration status check completed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkMigrationStatus().catch(console.error);