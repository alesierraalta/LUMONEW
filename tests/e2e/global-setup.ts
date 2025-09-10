import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Initialize Supabase client for test data setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI3OTQsImV4cCI6MjA2ODY2ODc5NH0.IxnwffD8nkbj85aQR1MLzme5snaD711hnWGH7LOkYHE';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Create test database state
  await setupTestData(supabase);

  // Create admin user for tests if needed
  await createTestUsers(supabase);

  console.log('✅ Global setup completed successfully');
}

async function setupTestData(supabase: any) {
  try {
    // Clean up any existing test data
    await cleanupTestData(supabase);

    // Create test categories
    const { data: categories } = await supabase
      .from('categories')
      .insert([
        {
          id: 'test-cat-1',
          name: 'Test Electronics',
          description: 'Test category for electronics',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-cat-2',
          name: 'Test Clothing',
          description: 'Test category for clothing',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    // Create test locations
    const { data: locations } = await supabase
      .from('locations')
      .insert([
        {
          id: 'test-loc-1',
          name: 'Test Warehouse A',
          address: '123 Test Street',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-loc-2',
          name: 'Test Warehouse B',
          address: '456 Test Avenue',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    // Create test inventory items
    const { data: inventory } = await supabase
      .from('inventory')
      .insert([
        {
          id: 'test-item-1',
          name: 'Test Laptop',
          description: 'Test laptop for E2E testing',
          sku: 'TEST-LAP-001',
          quantity: 10,
          price: 999.99,
          category_id: 'test-cat-1',
          location_id: 'test-loc-1',
          created_at: new Date().toISOString()
        },
        {
          id: 'test-item-2',
          name: 'Test T-Shirt',
          description: 'Test t-shirt for E2E testing',
          sku: 'TEST-TSH-001',
          quantity: 50,
          price: 19.99,
          category_id: 'test-cat-2',
          location_id: 'test-loc-2',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  }
}

async function createTestUsers(supabase: any) {
  try {
    // Create test admin user
    const { data: adminUser, error: adminError } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: 'TestPassword123!',
      options: {
        data: {
          role: 'admin',
          full_name: 'Test Admin'
        }
      }
    });

    // Create test regular user
    const { data: regularUser, error: userError } = await supabase.auth.signUp({
      email: 'user@test.com',
      password: 'TestPassword123!',
      options: {
        data: {
          role: 'user',
          full_name: 'Test User'
        }
      }
    });

    console.log('✅ Test users created successfully');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
}

async function cleanupTestData(supabase: any) {
  try {
    // Delete test data in reverse order of dependencies
    await supabase.from('transactions').delete().like('id', 'test-%');
    await supabase.from('inventory').delete().like('id', 'test-%');
    await supabase.from('categories').delete().like('id', 'test-%');
    await supabase.from('locations').delete().like('id', 'test-%');
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

export default globalSetup;