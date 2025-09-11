const { Client } = require('pg')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

// Extract database connection details from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const databaseUrl = process.env.DATABASE_URL

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Parse Supabase URL to get database connection info
const url = new URL(supabaseUrl)
const host = url.hostname
const database = 'postgres' // Default Supabase database name

// Create PostgreSQL client
const client = new Client({
  host: host,
  port: 5432,
  database: database,
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'your-db-password',
  ssl: {
    rejectUnauthorized: false
  }
})

async function fixUsersTable() {
  try {
    console.log('🚀 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')
    
    // Check current table structure
    console.log('\n🔍 Checking current table structure...')
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Current table structure:')
    console.table(tableCheck.rows)
    
    // Check if auth_user_id column exists
    const authUserIdExists = tableCheck.rows.some(row => row.column_name === 'auth_user_id')
    
    if (authUserIdExists) {
      console.log('✅ auth_user_id column already exists!')
    } else {
      console.log('❌ auth_user_id column is missing, adding it...')
      
      // Add the missing column
      await client.query(`
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS auth_user_id UUID 
        REFERENCES auth.users(id) ON DELETE CASCADE
      `)
      console.log('✅ Added auth_user_id column')
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
        ON public.users(auth_user_id)
      `)
      console.log('✅ Created index on auth_user_id')
      
      // Update existing users to link with auth.users if possible
      console.log('\n🔄 Attempting to link existing users with auth.users...')
      const updateResult = await client.query(`
        UPDATE public.users 
        SET auth_user_id = auth.users.id 
        FROM auth.users 
        WHERE public.users.email = auth.users.email 
        AND public.users.auth_user_id IS NULL
      `)
      console.log(`✅ Updated ${updateResult.rowCount} existing users`)
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying table structure after changes...')
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Final table structure:')
    console.table(finalCheck.rows)
    
    console.log('\n🎉 Users table fix completed successfully!')
    
  } catch (error) {
    console.error('💥 Error fixing users table:', error)
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n⚠️  Database connection failed. Please:')
      console.log('1. Check your database password in .env.local')
      console.log('2. Or use the Supabase SQL Editor to run:')
      console.log('\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;')
      console.log('CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);')
    }
    
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

fixUsersTable()
  .then(() => {
    console.log('\n✨ Fix process completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fix process failed:', error)
    process.exit(1)
  })