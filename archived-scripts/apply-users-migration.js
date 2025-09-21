const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyUsersMigration() {
  try {
    console.log('🚀 Starting users table migration...')
    
    // First, let's check if the users table exists and its structure
    console.log('\n🔍 Checking current table structure...')
    
    const { data: existingTable, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.log('❌ Users table does not exist or has issues:', tableError.message)
      console.log('📝 Need to create the users table...')
    } else {
      console.log('✅ Users table exists, checking columns...')
    }
    
    // Try to check if auth_user_id column exists by attempting a simple query
    const { data: columnTest, error: columnError } = await supabase
      .from('users')
      .select('auth_user_id')
      .limit(1)
    
    if (columnError && columnError.message.includes('auth_user_id')) {
      console.log('❌ auth_user_id column is missing!')
      console.log('📝 Need to add auth_user_id column...')
      
      // Try to add the missing column
      console.log('\n⚡ Adding auth_user_id column...')
      
      // Since we can't use raw SQL, let's try a different approach
      // We'll need to use the Supabase dashboard or direct database connection
      console.log('\n⚠️  Manual intervention required:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to the SQL Editor')
      console.log('3. Execute the following SQL:')
      console.log('\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;')
      console.log('CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);')
      
    } else {
      console.log('✅ auth_user_id column exists!')
    }
    
    // Let's also check what columns actually exist
    console.log('\n📋 Attempting to describe table structure...')
    const { data: sampleData, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(0)
    
    if (!sampleError) {
      console.log('✅ Table query successful')
    } else {
      console.log('❌ Table query failed:', sampleError.message)
    }
    
  } catch (error) {
    console.error('💥 Migration check failed:', error)
  }
}

applyUsersMigration()
  .then(() => {
    console.log('\n✨ Migration check completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Migration check failed:', error)
    process.exit(1)
  })