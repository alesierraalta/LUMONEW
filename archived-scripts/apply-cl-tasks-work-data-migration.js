const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createCLTaskWorkDataTable() {
  console.log('Creating cl_task_work_data table...')
  
  const { error } = await supabase.rpc('create_cl_task_work_data_table', {
    sql_query: `
      -- Create cl_task_work_data table
      CREATE TABLE IF NOT EXISTS cl_task_work_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        task_id UUID NOT NULL REFERENCES cl_tasks(id) ON DELETE CASCADE,
        execution_date DATE NOT NULL,
        executed_by TEXT NOT NULL,
        executed_by_id UUID NOT NULL,
        notes TEXT,
        attachments JSONB DEFAULT '[]'::jsonb,
        specific_data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(task_id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_cl_task_work_data_task_id ON cl_task_work_data(task_id);
      CREATE INDEX IF NOT EXISTS idx_cl_task_work_data_executed_by_id ON cl_task_work_data(executed_by_id);
      CREATE INDEX IF NOT EXISTS idx_cl_task_work_data_execution_date ON cl_task_work_data(execution_date);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION update_cl_task_work_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_cl_task_work_data_updated_at ON cl_task_work_data;
      CREATE TRIGGER update_cl_task_work_data_updated_at
        BEFORE UPDATE ON cl_task_work_data
        FOR EACH ROW
        EXECUTE FUNCTION update_cl_task_work_data_updated_at();

      -- Enable RLS
      ALTER TABLE cl_task_work_data ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      DROP POLICY IF EXISTS "Users can view all cl_task_work_data" ON cl_task_work_data;
      CREATE POLICY "Users can view all cl_task_work_data" ON cl_task_work_data
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Users can insert cl_task_work_data" ON cl_task_work_data;
      CREATE POLICY "Users can insert cl_task_work_data" ON cl_task_work_data
        FOR INSERT WITH CHECK (true);

      DROP POLICY IF EXISTS "Users can update cl_task_work_data" ON cl_task_work_data;
      CREATE POLICY "Users can update cl_task_work_data" ON cl_task_work_data
        FOR UPDATE USING (true);

      DROP POLICY IF EXISTS "Users can delete cl_task_work_data" ON cl_task_work_data;
      CREATE POLICY "Users can delete cl_task_work_data" ON cl_task_work_data
        FOR DELETE USING (true);
    `
  })

  if (error) {
    console.error('Error creating cl_task_work_data table:', error)
    return false
  }

  console.log('✅ cl_task_work_data table created successfully')
  return true
}

async function createRPCFunction() {
  console.log('Creating RPC function for SQL execution...')
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE OR REPLACE FUNCTION create_cl_task_work_data_table(sql_query TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  })

  if (error) {
    console.error('Error creating RPC function:', error)
    return false
  }

  console.log('✅ RPC function created successfully')
  return true
}

async function main() {
  console.log('🚀 Starting CL Tasks Work Data migration...')
  
  try {
    // First create the RPC function
    const rpcSuccess = await createRPCFunction()
    if (!rpcSuccess) {
      process.exit(1)
    }

    // Then create the table
    const tableSuccess = await createCLTaskWorkDataTable()
    if (!tableSuccess) {
      process.exit(1)
    }

    console.log('🎉 CL Tasks Work Data migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

main()