const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load env
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function apply() {
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '010_fix_workflow_tasks_fk.sql')
  const sql = fs.readFileSync(migrationPath, 'utf8')
  const statements = sql.split(';').map(s => s.trim()).filter(Boolean)
  console.log(`Applying FK fix migration: ${statements.length} statements`)
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';'
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt })
      if (error) {
        console.warn(`RPC failed for statement ${i + 1}, continuing. First 100 chars:`, stmt.slice(0, 100))
      } else {
        console.log(`OK ${i + 1}/${statements.length}`)
      }
    } catch (e) {
      console.warn(`Error executing statement ${i + 1}, continuing. First 100 chars:`, stmt.slice(0, 100))
    }
  }
  console.log('Done.')
}

apply().catch(err => {
  console.error(err)
  process.exit(1)
})


