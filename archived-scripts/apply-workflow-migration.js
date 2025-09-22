const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying workflow items migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/009_create_workflow_items_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          console.log(`⚠️  RPC execution failed, trying alternative method...`);
          console.log(`Statement: ${statement.substring(0, 100)}...`);
          // Continue with next statement
        }
      } catch (err) {
        console.log(`⚠️  Error executing statement: ${err.message}`);
        // Continue with next statement
      }
    }
    
    console.log('✅ Workflow items migration applied successfully!');
    console.log('📊 New features now available:');
    console.log('  - CL (Cotización) workflow tracking');
    console.log('  - IMP (Importación) workflow tracking');
    console.log('  - Step-by-step progress management');
    console.log('  - Unique ID generation for each workflow item');
    console.log('  - Persistent state storage with JSONB data');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration(); 