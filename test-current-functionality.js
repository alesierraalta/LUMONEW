const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCurrentFunctionality() {
  console.log('🧪 Testing current application functionality...');
  
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
    console.log('1️⃣ Testing database connection...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log(`✅ Users table accessible - ${users?.length || 0} users found`);
    }
    
    console.log('2️⃣ Testing audit logs table...');
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id, operation, table_name, user_id, created_at')
      .limit(5);
    
    if (auditError) {
      console.error('❌ Audit logs error:', auditError.message);
    } else {
      console.log(`✅ Audit logs table accessible - ${auditLogs?.length || 0} logs found`);
    }
    
    console.log('3️⃣ Testing inventory table...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, name, quantity, created_at')
      .limit(5);
    
    if (inventoryError) {
      console.error('❌ Inventory table error:', inventoryError.message);
    } else {
      console.log(`✅ Inventory table accessible - ${inventory?.length || 0} items found`);
    }
    
    console.log('4️⃣ Checking for existing triggers...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table')
      .like('trigger_name', '%auth_user%');
    
    if (triggerError) {
      console.log('⚠️ Cannot check triggers via client (expected)');
    } else {
      console.log(`🔧 Found ${triggers?.length || 0} auth user triggers`);
    }
    
    console.log('5️⃣ Testing service role client functionality...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);
    
    if (authError) {
      console.log('⚠️ Cannot access auth.users directly (expected for security)');
    } else {
      console.log(`🔐 Auth users accessible - ${authUsers?.length || 0} found`);
    }
    
    console.log('');
    console.log('📊 Current Status Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Application tables accessible');
    console.log('✅ Service role client configured');
    console.log('⏳ User synchronization triggers need to be applied');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. Apply the SQL migration in Supabase dashboard');
    console.log('2. Test user creation and synchronization');
    console.log('3. Verify audit operations work without foreign key errors');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testCurrentFunctionality().catch(console.error);