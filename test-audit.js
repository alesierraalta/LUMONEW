// Test script to verify audit logging system with service role key
const { auditService } = require('./lib/audit.ts')

async function testAuditSystem() {
  console.log('🔍 Testing Audit Logging System...')
  console.log('================================')
  
  try {
    // Test 1: Check if service role key is properly configured
    console.log('\n1. Testing service role key configuration...')
    
    // Set a test user context
    auditService.setUserContext({
      id: 'test-user-123',
      email: 'test@example.com'
    }, 'test-session-456')
    
    // Test 2: Log a test operation
    console.log('\n2. Logging a test operation...')
    const testLog = await auditService.logCreate(
      'test_table',
      'test-record-789',
      { name: 'Test Item', status: 'active' },
      { 
        action_type: 'test_operation',
        notes: 'Testing audit system configuration'
      }
    )
    
    if (testLog) {
      console.log('✅ Test operation logged successfully!')
      console.log('   Log ID:', testLog.id)
      console.log('   User ID:', testLog.user_id)
      console.log('   Operation:', testLog.operation)
    } else {
      console.log('❌ Failed to log test operation')
    }
    
    // Test 3: Retrieve recent logs
    console.log('\n3. Retrieving recent audit logs...')
    const recentLogs = await auditService.getRecentLogs(5)
    
    if (recentLogs && recentLogs.length > 0) {
      console.log(`✅ Retrieved ${recentLogs.length} recent logs`)
      console.log('   Most recent log:')
      console.log('   - Operation:', recentLogs[0].operation)
      console.log('   - Table:', recentLogs[0].table_name)
      console.log('   - User:', recentLogs[0].user_email || 'Unknown')
      console.log('   - Created:', recentLogs[0].created_at)
    } else {
      console.log('❌ No recent logs found or failed to retrieve')
    }
    
    // Test 4: Get audit statistics
    console.log('\n4. Getting audit statistics...')
    const stats = await auditService.getAuditStats()
    
    if (stats) {
      console.log('✅ Audit statistics retrieved successfully!')
      console.log('   Total operations:', stats.total_operations)
      console.log('   Operations by type:', Object.keys(stats.operations_by_type).length, 'types')
      console.log('   Operations by table:', Object.keys(stats.operations_by_table).length, 'tables')
    } else {
      console.log('❌ Failed to retrieve audit statistics')
    }
    
    console.log('\n================================')
    console.log('🎉 Audit system test completed!')
    
    // Clean up test data
    console.log('\n5. Cleaning up test data...')
    if (testLog) {
      await auditService.logDelete(
        'test_table',
        'test-record-789',
        { name: 'Test Item', status: 'active' },
        { 
          action_type: 'cleanup_test_data',
          notes: 'Removing test data after audit system verification'
        }
      )
      console.log('✅ Test cleanup logged')
    }
    
  } catch (error) {
    console.error('\n❌ Audit system test failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// Check if service role key is available
console.log('Environment check:')
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!')
  console.log('   The audit system will fall back to anonymous client.')
  console.log('   This may cause permission issues with audit operations.')
}

// Run the test
testAuditSystem()