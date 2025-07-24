import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '../../../lib/audit'

export async function GET(request: NextRequest) {
  console.log('🔍 Testing Audit Logging System...')
  console.log('================================')
  
  const results = {
    success: true,
    tests: [] as any[],
    environment: {} as any,
    errors: [] as string[]
  }

  try {
    // Environment check
    results.environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    }

    console.log('Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', results.environment.supabaseUrl)
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', results.environment.serviceRoleKey)

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY is not set!')
      results.errors.push('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    // Test 1: Set user context and log a test operation
    console.log('\n1. Testing service role key configuration...')
    
    // Set user context to null for testing (audit system should handle null users)
    auditService.setUserContext(null, 'test-session-456')

    console.log('\n2. Logging a test operation...')
    const testLog = await auditService.logCreate(
      'test_table',
      '00000000-0000-0000-0000-000000000002',
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
      results.tests.push({
        name: 'Log Test Operation',
        status: 'passed',
        details: { 
          logId: testLog.id, 
          userId: testLog.user_id,
          operation: testLog.operation,
          tableName: testLog.table_name
        }
      })
    } else {
      console.log('❌ Failed to log test operation')
      results.tests.push({
        name: 'Log Test Operation',
        status: 'failed',
        details: 'No log entry returned'
      })
      results.success = false
    }

    // Test 2: Retrieve recent logs
    console.log('\n3. Retrieving recent audit logs...')
    const recentLogs = await auditService.getRecentLogs(5)

    if (recentLogs && recentLogs.length > 0) {
      console.log(`✅ Retrieved ${recentLogs.length} recent logs`)
      console.log('   Most recent log:')
      console.log('   - Operation:', recentLogs[0].operation)
      console.log('   - Table:', recentLogs[0].table_name)
      console.log('   - User:', recentLogs[0].user_email || 'Unknown')
      console.log('   - Created:', recentLogs[0].created_at)
      
      results.tests.push({
        name: 'Retrieve Recent Logs',
        status: 'passed',
        details: { 
          count: recentLogs.length,
          mostRecent: {
            operation: recentLogs[0].operation,
            table: recentLogs[0].table_name,
            user: recentLogs[0].user_email,
            created: recentLogs[0].created_at
          }
        }
      })
    } else {
      console.log('❌ No recent logs found or failed to retrieve')
      results.tests.push({
        name: 'Retrieve Recent Logs',
        status: 'failed',
        details: 'No logs retrieved'
      })
      results.success = false
    }

    // Test 3: Get audit statistics
    console.log('\n4. Getting audit statistics...')
    const stats = await auditService.getAuditStats()

    if (stats) {
      console.log('✅ Audit statistics retrieved successfully!')
      console.log('   Total operations:', stats.total_operations)
      console.log('   Operations by type:', Object.keys(stats.operations_by_type).length, 'types')
      console.log('   Operations by table:', Object.keys(stats.operations_by_table).length, 'tables')
      
      results.tests.push({
        name: 'Get Audit Statistics',
        status: 'passed',
        details: {
          totalOperations: stats.total_operations,
          operationTypes: Object.keys(stats.operations_by_type).length,
          tables: Object.keys(stats.operations_by_table).length,
          operationsByType: stats.operations_by_type,
          operationsByTable: stats.operations_by_table
        }
      })
    } else {
      console.log('❌ Failed to retrieve audit statistics')
      results.tests.push({
        name: 'Get Audit Statistics',
        status: 'failed',
        details: 'No statistics retrieved'
      })
    }

    // Test 4: Test different audit operations
    console.log('\n5. Testing different audit operations...')
    
    // Test UPDATE operation
    const updateLog = await auditService.logUpdate(
      'test_table',
      '00000000-0000-0000-0000-000000000002',
      { name: 'Test Item', status: 'active' },
      { name: 'Updated Test Item', status: 'inactive' },
      { action_type: 'test_update', notes: 'Testing update operation' }
    )

    if (updateLog) {
      console.log('✅ Update operation logged successfully!')
      results.tests.push({
        name: 'Log Update Operation',
        status: 'passed',
        details: { logId: updateLog.id, operation: updateLog.operation }
      })
    } else {
      results.tests.push({
        name: 'Log Update Operation',
        status: 'failed',
        details: 'Update log failed'
      })
    }

    console.log('\n================================')
    console.log('🎉 Audit system test completed!')

    // Clean up test data
    console.log('\n6. Cleaning up test data...')
    if (testLog) {
      await auditService.logDelete(
        'test_table',
        '00000000-0000-0000-0000-000000000002',
        { name: 'Updated Test Item', status: 'inactive' },
        { 
          action_type: 'cleanup_test_data',
          notes: 'Removing test data after audit system verification'
        }
      )
      console.log('✅ Test cleanup logged')
    }

    // Final summary
    const passedTests = results.tests.filter(t => t.status === 'passed').length
    const totalTests = results.tests.length
    
    console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} tests passed`)
    
    if (results.errors.length === 0 && passedTests === totalTests) {
      console.log('🎉 All tests passed! Audit system is working correctly with service role key.')
    } else {
      console.log('⚠️  Some tests failed or warnings detected.')
      results.success = false
    }

  } catch (error) {
    console.error('\n❌ Audit system test failed:', error)
    results.success = false
    results.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return NextResponse.json(results, { 
    status: results.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}