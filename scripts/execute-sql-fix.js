const fetch = require('node-fetch')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

async function executeSQLFix() {
  try {
    console.log('🚀 Executing SQL fix for users table...')
    
    const sqlCommands = [
      `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;`,
      `CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);`,
      `UPDATE public.users SET auth_user_id = auth.users.id FROM auth.users WHERE public.users.email = auth.users.email AND public.users.auth_user_id IS NULL;`
    ]
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`\n⚡ Executing command ${i + 1}/${sqlCommands.length}:`)
      console.log(sql.substring(0, 80) + '...')
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: sql })
      })
      
      if (response.ok) {
        console.log(`✅ Command ${i + 1} executed successfully`)
      } else {
        const error = await response.text()
        console.log(`❌ Command ${i + 1} failed:`, error)
      }
    }
    
    console.log('\n🎉 SQL fix execution completed!')
    
  } catch (error) {
    console.error('💥 Error executing SQL fix:', error)
    
    console.log('\n⚠️  Alternative: Execute this SQL manually in Supabase SQL Editor:')
    console.log('\nALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;')
    console.log('CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);')
    console.log('UPDATE public.users SET auth_user_id = auth.users.id FROM auth.users WHERE public.users.email = auth.users.email AND public.users.auth_user_id IS NULL;')
    
    process.exit(1)
  }
}

executeSQLFix()
  .then(() => {
    console.log('\n✨ Fix process completed')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Fix process failed:', error)
    process.exit(1)
  })