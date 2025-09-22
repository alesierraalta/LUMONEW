#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Running Inventory Status Update Tests')
console.log('==========================================\n')

const testFiles = [
  'tests/unit/inventory-status-logic.test.ts',
  'tests/api/inventory-status-api.test.ts',
  'tests/e2e/inventory-status-update.test.ts',
  'tests/e2e/dashboard-inventory-sync.test.ts'
]

const testTypes = {
  'tests/unit/inventory-status-logic.test.ts': 'Unit Tests - Inventory Status Logic',
  'tests/api/inventory-status-api.test.ts': 'API Tests - Inventory Status API',
  'tests/e2e/inventory-status-update.test.ts': 'E2E Tests - Inventory Status Updates',
  'tests/e2e/dashboard-inventory-sync.test.ts': 'E2E Tests - Dashboard Inventory Sync'
}

let totalTests = 0
let passedTests = 0
let failedTests = 0

for (const testFile of testFiles) {
  const testType = testTypes[testFile]
  console.log(`\n📋 Running ${testType}`)
  console.log('─'.repeat(50))
  
  try {
    const command = `npx playwright test ${testFile} --reporter=list --project=chromium`
    console.log(`Command: ${command}`)
    
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    })
    
    console.log(output)
    passedTests++
    
    // Count test results from output
    const testMatches = output.match(/(\d+) passed|(\d+) failed/g)
    if (testMatches) {
      testMatches.forEach(match => {
        const passed = match.match(/(\d+) passed/)
        const failed = match.match(/(\d+) failed/)
        if (passed) totalTests += parseInt(passed[1])
        if (failed) totalTests += parseInt(failed[1])
      })
    }
    
  } catch (error) {
    console.error(`❌ ${testType} failed:`)
    console.error(error.stdout || error.message)
    failedTests++
  }
}

console.log('\n🎯 Test Summary')
console.log('================')
console.log(`Total test files: ${testFiles.length}`)
console.log(`Passed test files: ${passedTests}`)
console.log(`Failed test files: ${failedTests}`)
console.log(`Total individual tests: ${totalTests}`)

if (failedTests === 0) {
  console.log('\n✅ All inventory status tests passed!')
  console.log('The inventory status summary should update correctly after bulk operations.')
} else {
  console.log('\n❌ Some tests failed. Check the output above for details.')
  console.log('The inventory status summary may not be updating correctly.')
}

console.log('\n📝 Test Coverage:')
console.log('• Unit tests for inventory status calculation logic')
console.log('• API tests for inventory status endpoints')
console.log('• E2E tests for inventory status UI updates')
console.log('• E2E tests for dashboard-inventory synchronization')
console.log('• Validation of bulk operations impact on status')
console.log('• Cache invalidation verification')

process.exit(failedTests > 0 ? 1 : 0)
