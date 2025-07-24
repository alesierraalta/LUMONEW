const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Starting user sync migration...');
  
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
    
    // Create the handle_new_user function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert new user into public.users table
        INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), -- Use name from metadata or fallback to email
          COALESCE(NEW.raw_user_meta_data->>'role', 'user'), -- Default role is 'user'
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
    `;
    
    const { error: funcError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (funcError) {
      console.error('❌ Error creating function:', funcError.message);
      return;
    }
    console.log('✅ Function created successfully');
    
    console.log('🔧 Step 2: Creating triggers...');
    
    // Create triggers
    const createTriggersSQL = `
      -- Create trigger to automatically sync users
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      
      -- Also handle updates to auth.users
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggersSQL });
    if (triggerError) {
      console.error('❌ Error creating triggers:', triggerError.message);
      return;
    }
    console.log('✅ Triggers created successfully');
    
    console.log('🔄 Step 3: Creating sync function...');
    
    // Create sync function
    const createSyncFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
      RETURNS INTEGER AS $$
      DECLARE
        user_record RECORD;
        synced_count INTEGER := 0;
      BEGIN
        -- Loop through all auth users and sync them
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
    `;
    
    const { error: syncFuncError } = await supabase.rpc('exec_sql', { sql: createSyncFunctionSQL });
    if (syncFuncError) {
      console.error('❌ Error creating sync function:', syncFuncError.message);
      return;
    }
    console.log('✅ Sync function created successfully');
    
    console.log('🔐 Step 4: Granting permissions...');
    
    // Grant permissions
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO authenticated;
    `;
    
    const { error: permError } = await supabase.rpc('exec_sql', { sql: grantPermissionsSQL });
    if (permError) {
      console.error('❌ Error granting permissions:', permError.message);
      return;
    }
    console.log('✅ Permissions granted successfully');
    
    console.log('🔄 Step 5: Syncing existing users...');
    
    // Run sync function
    const { data: syncResult, error: syncError } = await supabase.rpc('sync_existing_auth_users');
    if (syncError) {
      console.error('❌ Error syncing existing users:', syncError.message);
      return;
    }
    console.log(`✅ Synced ${syncResult || 0} existing users`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test creating a user in Supabase Auth dashboard');
    console.log('2. Verify the user appears in public.users table');
    console.log('3. Test inventory operations to ensure audit logs work');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

applyMigration().catch(console.error);