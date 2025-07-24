/**
 * LUMO2 Inventory System Fixes Testing Script
 * 
 * This script tests the following fixes:
 * 1. Database schema fix - unit_of_measure column added to inventory table
 * 2. TypeScript interfaces updated to match database schema
 * 3. Audit logging authentication fixes with service role support
 * 
 * Run this script to verify all fixes are working correctly.
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hnbtninlyzpdemyudaqg.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI3OTQsImV4cCI6MjA2ODY2ODc5NH0.IxnwffD8nkbj85aQR1MLzme5snaD711hnWGH7LOkYHE'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Test results tracking
const testResults = {
  databaseSchema: { passed: false, details: [] },
  auditLogging: { passed: false, details: [] },
  inventoryOperations: { passed: false, details: [] },
  environmentSetup: { passed: false, details: [] }
}

// Create clients
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
let serviceClient = null

if (SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) {
  serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Utility functions
function logTest(category, test, status, details) {
  const symbol = status ? '✅' : '❌'
  console.log(`${symbol} ${category}: ${test}`)
  if (details) {
    console.log(`   Details: ${details}`)
  }
  testResults[category].details.push({ test, status, details })
}

function updateCategoryStatus(category) {
  const allPassed = testResults[category].details.every(test => test.status)
  testResults[category].passed = allPassed
}

// Test 1: Database Schema Verification
async function testDatabaseSchema() {
  console.log('\n🔍 Testing Database Schema Fixes...')
  
  try {
    // Test 1.1: Check if unit_of_measure column exists in inventory table
    const { data: inventoryColumns, error: schemaError } = await anonClient
      .from('inventory')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      logTest('databaseSchema', 'Inventory table access', false, schemaError.message)
    } else {
      logTest('databaseSchema', 'Inventory table access', true, 'Table accessible')
      
      // Check if we can query unit_of_measure specifically
      const { data: unitTest, error: unitError } = await anonClient
        .from('inventory')
        .select('unit_of_measure')
        .limit(1)
      
      if (unitError) {
        logTest('databaseSchema', 'unit_of_measure column exists', false, unitError.message)
      } else {
        logTest('databaseSchema', 'unit_of_measure column exists', true, 'Column accessible in queries')
      }
    }
    
    // Test 1.2: Check migration was applied
    const { data: migrationData, error: migrationError } = await anonClient
      .from('audit_logs')
      .select('*')
      .eq('record_id', 'migration_006')
      .eq('operation', 'SCHEMA_CHANGE')
      .single()
    
    if (migrationError) {
      logTest('databaseSchema', 'Migration 006 audit log', false, 'Migration audit log not found')
    } else {
      logTest('databaseSchema', 'Migration 006 audit log', true, 'Migration properly logged')
    }
    
  } catch (error) {
    logTest('databaseSchema', 'Schema test execution', false, error.message)
  }
  
  updateCategoryStatus('databaseSchema')
}

// Test 2: Environment Setup Verification
async function testEnvironmentSetup() {
  console.log('\n🔧 Testing Environment Setup...')
  
  // Test 2.1: Check required environment variables
  const hasSupabaseUrl = !!SUPABASE_URL
  logTest('environmentSetup', 'SUPABASE_URL configured', hasSupabaseUrl, SUPABASE_URL ? 'Present' : 'Missing')
  
  const hasAnonKey = !!SUPABASE_ANON_KEY
  logTest('environmentSetup', 'SUPABASE_ANON_KEY configured', hasAnonKey, hasAnonKey ? 'Present' : 'Missing')
  
  const hasServiceKey = !!SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  logTest('environmentSetup', 'SUPABASE_SERVICE_ROLE_KEY configured', hasServiceKey, 
    hasServiceKey ? 'Present and valid' : 'Missing or placeholder value')
  
  // Test 2.2: Test client connections
  try {
    const { data: anonTest, error: anonError } = await anonClient.from('inventory').select('id').limit(1)
    logTest('environmentSetup', 'Anonymous client connection', !anonError, 
      anonError ? anonError.message : 'Connection successful')
  } catch (error) {
    logTest('environmentSetup', 'Anonymous client connection', false, error.message)
  }
  
  if (serviceClient) {
    try {
      const { data: serviceTest, error: serviceError } = await serviceClient.from('audit_logs').select('id').limit(1)
      logTest('environmentSetup', 'Service role client connection', !serviceError, 
        serviceError ? serviceError.message : 'Connection successful')
    } catch (error) {
      logTest('environmentSetup', 'Service role client connection', false, error.message)
    }
  } else {
    logTest('environmentSetup', 'Service role client connection', false, 'Service client not available')
  }
  
  updateCategoryStatus('environmentSetup')
}

// Test 3: Audit Logging Authentication
async function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging Authentication...')
  
  if (!serviceClient) {
    logTest('auditLogging', 'Service client availability', false, 'Service role key not configured properly')
    updateCategoryStatus('auditLogging')
    return
  }
  
  try {
    // Test 3.1: Test audit log creation with service client
    const testAuditEntry = {
      user_id: 'test-user',
      user_email: 'test@example.com',
      operation: 'INSERT',
      table_name: 'test_table',
      record_id: `test-${Date.now()}`,
      new_values: { test: 'data' },
      metadata: {
        action_type: 'test_operation',
        reason: 'Testing audit logging fix'
      }
    }
    
    const { data: auditData, error: auditError } = await serviceClient
      .from('audit_logs')
      .insert([testAuditEntry])
      .select()
      .single()
    
    if (auditError) {
      logTest('auditLogging', 'Audit log creation with service client', false, auditError.message)
    } else {
      logTest('auditLogging', 'Audit log creation with service client', true, 'Audit entry created successfully')
      
      // Clean up test entry
      await serviceClient.from('audit_logs').delete().eq('id', auditData.id)
    }
    
    // Test 3.2: Test RLS bypass with service client
    const { data: allAuditLogs, error: rlsError } = await serviceClient
      .from('audit_logs')
      .select('id')
      .limit(5)
    
    if (rlsError) {
      logTest('auditLogging', 'RLS bypass with service client', false, rlsError.message)
    } else {
      logTest('auditLogging', 'RLS bypass with service client', true, `Retrieved ${allAuditLogs.length} audit logs`)
    }
    
  } catch (error) {
    logTest('auditLogging', 'Audit logging test execution', false, error.message)
  }
  
  updateCategoryStatus('auditLogging')
}

// Test 4: Inventory Operations
async function testInventoryOperations() {
  console.log('\n📦 Testing Inventory Operations...')
  
  try {
    // Test 4.1: Test inventory item creation with unit_of_measure
    const testItem = {
      sku: `TEST-${Date.now()}`,
      name: 'Test Item for Fix Verification',
      description: 'Testing unit_of_measure column fix',
      category_id: null, // Will be set if categories exist
      location_id: null, // Will be set if locations exist
      unit_price: 10.99,
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_of_measure: 'kg',
      supplier: 'Test Supplier',
      barcode: '1234567890123',
      status: 'active'
    }
    
    // Get a category and location for the test
    const { data: categories } = await anonClient.from('categories').select('id').limit(1)
    const { data: locations } = await anonClient.from('locations').select('id').limit(1)
    
    if (categories && categories.length > 0) {
      testItem.category_id = categories[0].id
    }
    if (locations && locations.length > 0) {
      testItem.location_id = locations[0].id
    }
    
    // Test creation
    const { data: createdItem, error: createError } = await anonClient
      .from('inventory')
      .insert([testItem])
      .select()
      .single()
    
    if (createError) {
      logTest('inventoryOperations', 'Create item with unit_of_measure', false, createError.message)
    } else {
      logTest('inventoryOperations', 'Create item with unit_of_measure', true, 'Item created successfully')
      
      // Test 4.2: Test inventory item update with unit_of_measure
      const updateData = {
        unit_of_measure: 'g',
        quantity: 150,
        unit_price: 12.99
      }
      
      const { data: updatedItem, error: updateError } = await anonClient
        .from('inventory')
        .update(updateData)
        .eq('id', createdItem.id)
        .select()
        .single()
      
      if (updateError) {
        logTest('inventoryOperations', 'Update item with unit_of_measure', false, updateError.message)
      } else {
        logTest('inventoryOperations', 'Update item with unit_of_measure', true, 
          `Updated unit_of_measure from ${createdItem.unit_of_measure} to ${updatedItem.unit_of_measure}`)
      }
      
      // Test 4.3: Test specific failing page scenario
      const specificTestId = '5b74fdaa-a8f1-4c60-ac79-3b73b281a853'
      const { data: specificItem, error: specificError } = await anonClient
        .from('inventory')
        .select('*')
        .eq('id', specificTestId)
        .single()
      
      if (specificError && specificError.code !== 'PGRST116') {
        logTest('inventoryOperations', 'Access specific failing item', false, specificError.message)
      } else if (specificItem) {
        logTest('inventoryOperations', 'Access specific failing item', true, 'Item accessible')
        
        // Test update on specific item
        const { error: specificUpdateError } = await anonClient
          .from('inventory')
          .update({ unit_of_measure: specificItem.unit_of_measure || 'unidad' })
          .eq('id', specificTestId)
        
        if (specificUpdateError) {
          logTest('inventoryOperations', 'Update specific failing item', false, specificUpdateError.message)
        } else {
          logTest('inventoryOperations', 'Update specific failing item', true, 'Update successful')
        }
      } else {
        logTest('inventoryOperations', 'Access specific failing item', false, 'Item not found (expected if not in database)')
      }
      
      // Clean up test item
      await anonClient.from('inventory').delete().eq('id', createdItem.id)
    }
    
  } catch (error) {
    logTest('inventoryOperations', 'Inventory operations test execution', false, error.message)
  }
  
  updateCategoryStatus('inventoryOperations')
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting LUMO2 Inventory System Fixes Testing...')
  console.log('=' .repeat(60))
  
  await testEnvironmentSetup()
  await testDatabaseSchema()
  await testAuditLogging()
  await testInventoryOperations()
  
  // Generate final report
  console.log('\n' + '=' .repeat(60))
  console.log('📊 FINAL TEST RESULTS SUMMARY')
  console.log('=' .repeat(60))
  
  const categories = Object.keys(testResults)
  let totalPassed = 0
  let totalTests = 0
  
  categories.forEach(category => {
    const result = testResults[category]
    const passed = result.details.filter(test => test.status).length
    const total = result.details.length
    const status = result.passed ? '✅ PASSED' : '❌ FAILED'
    
    console.log(`\n${category.toUpperCase()}: ${status} (${passed}/${total})`)
    
    result.details.forEach(test => {
      const symbol = test.status ? '  ✅' : '  ❌'
      console.log(`${symbol} ${test.test}`)
      if (test.details && !test.status) {
        console.log(`     → ${test.details}`)
      }
    })
    
    totalPassed += passed
    totalTests += total
  })
  
  console.log('\n' + '=' .repeat(60))
  console.log(`OVERALL RESULT: ${totalPassed}/${totalTests} tests passed`)
  
  if (totalPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED! The inventory system fixes are working correctly.')
  } else {
    console.log('⚠️  SOME TESTS FAILED. Please review the issues above.')
    
    // Provide specific recommendations
    console.log('\n📋 RECOMMENDATIONS:')
    
    if (!testResults.environmentSetup.passed) {
      console.log('• Configure the SUPABASE_SERVICE_ROLE_KEY in .env.local with the actual service role key from Supabase Dashboard')
    }
    
    if (!testResults.databaseSchema.passed) {
      console.log('• Run the database migration: npx supabase db push or apply migration 006 manually')
    }
    
    if (!testResults.auditLogging.passed) {
      console.log('• Verify RLS policies on audit_logs table allow service role access')
    }
    
    if (!testResults.inventoryOperations.passed) {
      console.log('• Check that inventory table has unit_of_measure column and proper constraints')
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  
  return {
    totalTests,
    totalPassed,
    allPassed: totalPassed === totalTests,
    results: testResults
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error)
}