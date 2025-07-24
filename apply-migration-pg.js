const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Starting user sync migration with PostgreSQL client...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables');
    return;
  }
  
  // Extract database connection details from Supabase URL
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0];
  
  // Construct PostgreSQL connection string
  const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    console.log('📋 Step 1: Creating handle_new_user function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert new user into public.users table
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
    `;
    
    await client.query(createFunctionSQL);
    console.log('✅ Function created successfully');
    
    console.log('🔧 Step 2: Creating triggers...');
    
    const createTriggersSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      
      DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
      CREATE TRIGGER on_auth_user_updated
        AFTER UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    await client.query(createTriggersSQL);
    console.log('✅ Triggers created successfully');
    
    console.log('🔄 Step 3: Creating sync function...');
    
    const createSyncFunctionSQL = `
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
    `;
    
    await client.query(createSyncFunctionSQL);
    console.log('✅ Sync function created successfully');
    
    console.log('🔐 Step 4: Granting permissions...');
    
    const grantPermissionsSQL = `
      GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
      GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO authenticated;
    `;
    
    await client.query(grantPermissionsSQL);
    console.log('✅ Permissions granted successfully');
    
    console.log('🔄 Step 5: Syncing existing users...');
    
    const syncResult = await client.query('SELECT public.sync_existing_auth_users() as count');
    const syncedCount = syncResult.rows[0]?.count || 0;
    console.log(`✅ Synced ${syncedCount} existing users`);
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test creating a user in Supabase Auth dashboard');
    console.log('2. Verify the user appears in public.users table');
    console.log('3. Test inventory operations to ensure audit logs work');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

applyMigration().catch(console.error);