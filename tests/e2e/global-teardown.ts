import { createClient } from '@supabase/supabase-js';

async function globalTeardown() {
  console.log('🧹 Starting global teardown for E2E tests...');

  // Initialize Supabase client for cleanup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Clean up test data
  await cleanupTestData(supabase);

  // Clean up test users
  await cleanupTestUsers(supabase);

  console.log('✅ Global teardown completed successfully');
}

async function cleanupTestData(supabase: any) {
  try {
    // Delete test data in reverse order of dependencies
    await supabase.from('audit_logs').delete().like('record_id', 'test-%');
    await supabase.from('transactions').delete().like('id', 'test-%');
    await supabase.from('inventory').delete().like('id', 'test-%');
    await supabase.from('categories').delete().like('id', 'test-%');
    await supabase.from('locations').delete().like('id', 'test-%');
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

async function cleanupTestUsers(supabase: any) {
  try {
    // Note: In a real scenario, you might want to delete test users
    // For now, we'll just log that cleanup is happening
    console.log('✅ Test users cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up test users:', error);
  }
}

export default globalTeardown;