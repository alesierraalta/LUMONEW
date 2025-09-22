#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Bulk Operations Database Tests Suite');
console.log('===============================================\n');

const tests = [
  {
    name: 'Unit Tests - Bulk Operations Database',
    command: 'npx playwright test tests/unit/bulk-operations-db.test.ts',
    description: 'Validates bulk operations with real database operations'
  },
  {
    name: 'Integration Tests - Bulk Operations Database',
    command: 'npx playwright test tests/integration/bulk-operations-integration-db.test.ts',
    description: 'Validates integration between UI and database for bulk operations'
  },
  {
    name: 'E2E Tests - Bulk Operations Database',
    command: 'npx playwright test tests/e2e/bulk-operations-e2e-db.test.ts',
    description: 'Validates complete user workflow with database verification'
  },
  {
    name: 'Cache Invalidation Tests - Database',
    command: 'npx playwright test tests/api/cache-invalidation-db.test.ts',
    description: 'Validates cache invalidation with real database operations'
  }
];

async function runTests() {
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔍 Running: ${test.name}`);
    console.log(`📝 Description: ${test.description}`);
    console.log(`⚡ Command: ${test.command}`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      execSync(test.command, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${test.name} - PASSED (${duration}ms)`);
      results.push({ name: test.name, status: 'PASSED', duration });
      
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      console.log(`Error: ${error.message}`);
      results.push({ name: test.name, status: 'FAILED', error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🔍 Failed Tests:');
    results.filter(r => r.status === 'FAILED').forEach(result => {
      console.log(`  - ${result.name}: ${result.error}`);
    });
  }
  
  // Database cleanup reminder
  console.log('\n🧹 Database Cleanup:');
  console.log('  - Test data is automatically cleaned up after each test');
  console.log('  - All test items use SKU patterns: TEST-UNIT-%, TEST-INTEGRATION-%, TEST-E2E-%, TEST-CACHE-%');
  console.log('  - If tests fail, you may need to manually clean up test data');
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (failed === 0) {
    console.log('  🎉 All database tests passed! The bulk operations are working correctly with the database.');
    console.log('  📋 Key validations completed:');
    console.log('     - Items are created correctly in the database');
    console.log('     - Cache invalidation works with real database operations');
    console.log('     - UI updates reflect database changes');
    console.log('     - Audit logs are created for all operations');
    console.log('     - Soft deletes work correctly');
  } else {
    console.log('  🔧 Some tests failed. Review the errors above and:');
    console.log('     1. Check if the database connection is working');
    console.log('     2. Verify the .env.test file has correct Supabase credentials');
    console.log('     3. Ensure the database schema is up to date');
    console.log('     4. Check if there are any database constraints causing issues');
    console.log('     5. Verify the cache invalidation is working correctly');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. If tests pass: The bulk operations are ready for production');
  console.log('  2. If tests fail: Fix the issues and run the tests again');
  console.log('  3. Monitor the application in production for any database-related issues');
  console.log('  4. Consider adding more test scenarios as the application grows');
  
  // Database statistics
  console.log('\n📊 Database Test Statistics:');
  console.log('  - Tests use real Supabase database');
  console.log('  - Automatic cleanup after each test');
  console.log('  - Tests cover: CREATE, UPDATE, DELETE operations');
  console.log('  - Tests validate: Cache invalidation, Audit logs, UI synchronization');
  console.log('  - Tests verify: Database transactions, Error handling, Data integrity');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/run-database-bulk-tests.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show verbose output
  --quick, -q    Run only critical tests

Examples:
  node scripts/run-database-bulk-tests.js
  node scripts/run-database-bulk-tests.js --verbose
  node scripts/run-database-bulk-tests.js --quick
  `);
  process.exit(0);
}

if (args.includes('--quick') || args.includes('-q')) {
  console.log('⚡ Running quick database test suite (critical tests only)...\n');
  // Run only the most critical tests
  const quickTests = tests.filter(test => 
    test.name.includes('E2E') || test.name.includes('Integration')
  );
  tests.splice(0, tests.length, ...quickTests);
}

runTests().catch(error => {
  console.error('❌ Database test suite failed:', error);
  process.exit(1);
});
