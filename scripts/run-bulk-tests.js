#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Bulk Operations Tests Suite');
console.log('=====================================\n');

const tests = [
  {
    name: 'Unit Tests - Bulk Operations API',
    command: 'npm test -- tests/api/bulk-operations.test.ts',
    description: 'Validates bulk operations API endpoint functionality'
  },
  {
    name: 'Unit Tests - Cache API Manager',
    command: 'npm test -- tests/lib/cache-api-manager.test.ts',
    description: 'Validates cache invalidation functionality'
  },
  {
    name: 'E2E Tests - Bulk Operations Refresh',
    command: 'npx playwright test tests/e2e/bulk-operations-refresh.spec.ts',
    description: 'Validates complete user flow for bulk operations'
  },
  {
    name: 'Debug Tests - Cache Synchronization',
    command: 'npx playwright test tests/debug/cache-synchronization.test.ts',
    description: 'Debugs cache and synchronization issues'
  },
  {
    name: 'Integration Tests - Cache Integration',
    command: 'npx playwright test tests/integration/cache-integration.test.ts',
    description: 'Validates cache integration across multiple operations'
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
        cwd: process.cwd()
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
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (failed === 0) {
    console.log('  🎉 All tests passed! The bulk operations refresh issue appears to be resolved.');
  } else {
    console.log('  🔧 Some tests failed. Review the errors above and:');
    console.log('     1. Check if the cache invalidation is working correctly');
    console.log('     2. Verify the API endpoints are responding as expected');
    console.log('     3. Ensure the frontend state management is properly synchronized');
    console.log('     4. Check for timing issues in the cache invalidation process');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. If tests pass: Deploy the changes to production');
  console.log('  2. If tests fail: Review the specific error messages and fix the issues');
  console.log('  3. Run the tests again to verify the fixes');
  console.log('  4. Monitor the application in production for any cache-related issues');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/run-bulk-tests.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show verbose output
  --quick, -q    Run only critical tests

Examples:
  node scripts/run-bulk-tests.js
  node scripts/run-bulk-tests.js --verbose
  node scripts/run-bulk-tests.js --quick
  `);
  process.exit(0);
}

if (args.includes('--quick') || args.includes('-q')) {
  console.log('⚡ Running quick test suite (critical tests only)...\n');
  // Run only the most critical tests
  const quickTests = tests.filter(test => 
    test.name.includes('E2E') || test.name.includes('Integration')
  );
  tests.splice(0, tests.length, ...quickTests);
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
