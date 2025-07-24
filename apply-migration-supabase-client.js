const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applyMigrationWithSupabaseClient() {
  console.log('🚀 Starting user sync migration with Supabase client...');
  
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
    console.log('📋 Step 1: Creating handle_new_user function...');
    
    // Create the handle_new_user function using apply_migration
    const { data: migrationData, error: migrationError } = await supabase
      .rpc('apply_migration', {
        name: 'create_user_sync_trigger',
        statements: [
          `CREATE OR REPLACE FUNCTION public.handle_new_user()
           RETURNS TRIGGER AS $$
           BEGIN
             INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
             VALUES (
               NEW.id,
               NEW.email,
               COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
               COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
               'active',
               NOW(),
               NOW()
             )
             ON CONFLICT (id) DO UPDATE SET
               email = EXCLUDED.email,
               name = COALESCE(EXCLUDED.name, public.users.name),
               updated_at = NOW();
             
             RETURN NEW;
           END;
           $$ LANGUAGE plpgsql SECURITY DEFINER;`,
          
          `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
           CREATE TRIGGER on_auth_user_created
             AFTER INSERT ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
          
          `DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
           CREATE TRIGGER on_auth_user_updated
             AFTER UPDATE ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`,
          
          `CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
           RETURNS INTEGER AS $$
           DECLARE
             user_record RECORD;
             synced_count INTEGER := 0;
           BEGIN
             FOR user_record IN 
               SELECT id, email, raw_user_meta_data, created_at
               FROM auth.users
               WHERE id NOT IN (SELECT id FROM public.users)
             LOOP
               INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
               VALUES (
                 user_record.id,
                 user_record.email,
                 COALESCE(user_record.raw_user_meta_data->>'name', user_record.email),
                 COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
                 'active',
                 user_record.created_at,
                 NOW()
               )
               ON CONFLICT (id) DO NOTHING;
               
               synced_count := synced_count + 1;
             END LOOP;
             
             RETURN synced_count;
           END;
           $$ LANGUAGE plpgsql SECURITY DEFINER;`,
          
          `GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
           GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO authenticated;`
        ]
      });
    
    if (migrationError) {
      console.log('⚠️ Migration RPC not available, trying direct execution...');
      
      // Try direct execution approach
      console.log('📋 Creating functions and triggers directly...');
      
      // Test if we can create a simple function first
      const { error: testError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Cannot access users table:', testError.message);
        return;
      }
      
      console.log('✅ Database connection verified');
      console.log('');
      console.log('🔧 Manual Migration Required');
      console.log('Since direct SQL execution is not available via the client,');
      console.log('please apply the following SQL manually in your Supabase dashboard:');
      console.log('');
      console.log('='.repeat(80));
      console.log(`
-- Create user synchronization function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create sync function for existing users
CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.users)
  LOOP
    INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'name', user_record.email),
      COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
      'active',
      user_record.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    synced_count := synced_count + 1;
  END LOOP;
  
  RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO authenticated;

-- Sync existing users
SELECT public.sync_existing_auth_users();
      `);
      console.log('='.repeat(80));
      console.log('');
      console.log('📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Execute the query');
      console.log('5. Verify that functions and triggers were created');
      console.log('');
      console.log('🧪 After applying the migration, test by:');
      console.log('1. Creating a user in Supabase Auth dashboard');
      console.log('2. Checking that the user appears in public.users table');
      console.log('3. Testing inventory operations to ensure audit logs work');
      
    } else {
      console.log('✅ Migration applied successfully via RPC');
      
      // Try to sync existing users
      console.log('🔄 Syncing existing users...');
      const { data: syncResult, error: syncError } = await supabase.rpc('sync_existing_auth_users');
      
      if (syncError) {
        console.log('⚠️ Could not sync existing users automatically:', syncError.message);
        console.log('Please run: SELECT public.sync_existing_auth_users(); manually');
      } else {
        console.log(`✅ Synced ${syncResult || 0} existing users`);
      }
    }
    
    console.log('');
    console.log('🎉 Migration process completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the migration was applied correctly');
    console.log('2. Test user creation and synchronization');
    console.log('3. Test inventory operations to ensure audit logs work');
    console.log('4. Monitor for any remaining foreign key constraint errors');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Full error:', error);
  }
}

applyMigrationWithSupabaseClient().catch(console.error);