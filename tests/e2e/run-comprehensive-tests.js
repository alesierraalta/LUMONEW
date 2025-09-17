#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Inventory System
 * 
 * This script runs all comprehensive inventory tests to verify system functionality.
 * It includes realistic scenarios, edge cases, performance tests, and integration tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  // Test files to run
  testFiles: [
    'tests/e2e/workflows/comprehensive-inventory-scenarios.spec.ts',
    'tests/e2e/workflows/bulk-operations-comprehensive.spec.ts',
    'tests/e2e/workflows/inventory-stress-testing.spec.ts',
    'tests/e2e/workflows/bulk-create-validation.spec.ts'
  ],
  
  // Test categories
  categories: {
    'Realistic Scenarios': [
      'Complete inventory cycle: Receive shipment → Process sales → Stock adjustment',
      'Multi-location inventory management',
      'Seasonal inventory management with bulk operations'
    ],
    'Edge Cases': [
      'Handle zero and negative stock scenarios',
      'Handle maximum stock level scenarios',
      'Handle duplicate SKU creation attempts',
      'Handle very long item names and descriptions',
      'Handle special characters in SKU and names'
    ],
    'Data Validation': [
      'Validate all required fields',
      'Validate numeric field formats',
      'Validate price and quantity ranges',
      'Handle network errors gracefully'
    ],
    'Performance': [
      'Handle large inventory datasets efficiently',
      'Handle concurrent operations',
      'Memory usage with large datasets',
      'Long-running operations stability'
    ],
    'Bulk Operations': [
      'Bulk create with valid data - all fields filled',
      'Bulk create with partial data - some fields empty',
      'Bulk create validation - empty required fields',
      'Bulk create with duplicate SKUs',
      'Bulk update 500 items simultaneously',
      'Bulk delete with confirmation'
    ],
    'Translation Validation': [
      'Verify Spanish translation keys are working',
      'Verify English translation keys are working',
      'Verify translation keys work with mixed language content'
    ],
    'API Integration': [
      'Verify POST method works for bulk create',
      'Handle API errors gracefully',
      'Handle network timeout'
    ]
  },
  
  // Performance thresholds
  performanceThresholds: {
    pageLoadTime: 5000, // 5 seconds
    searchTime: 2000,   // 2 seconds
    bulkCreateTime: 60000, // 60 seconds for 1000 items
    memoryIncrease: 100 * 1024 * 1024 // 100MB
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logSection(message) {
  log(`\n${colors.bright}${colors.blue}${message}${colors.reset}`);
  log(`${colors.blue}${'-'.repeat(message.length)}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  log(`${colors.magenta}ℹ️  ${message}${colors.reset}`);
}

// Test runner functions
function checkPrerequisites() {
  logSection('Checking Prerequisites');
  
  try {
    // Check if Playwright is installed
    execSync('npx playwright --version', { stdio: 'pipe' });
    logSuccess('Playwright is installed');
  } catch (error) {
    logError('Playwright is not installed. Please run: npm install @playwright/test');
    process.exit(1);
  }
  
  try {
    // Check if test files exist
    for (const testFile of testConfig.testFiles) {
      if (!fs.existsSync(testFile)) {
        logError(`Test file not found: ${testFile}`);
        process.exit(1);
      }
    }
    logSuccess('All test files exist');
  } catch (error) {
    logError('Error checking test files');
    process.exit(1);
  }
  
  // Check if application is running
  try {
    execSync('curl -s http://localhost:3001 > /dev/null', { stdio: 'pipe' });
    logSuccess('Application is running on localhost:3001');
  } catch (error) {
    logWarning('Application may not be running on localhost:3001');
    logInfo('Please ensure the application is running before executing tests');
  }
}

function runTestSuite(testFile, options = {}) {
  const { timeout = 300000, retries = 2, workers = 1 } = options;
  
  logSection(`Running Test Suite: ${path.basename(testFile)}`);
  
  try {
    const command = [
      'npx playwright test',
      testFile,
      `--timeout=${timeout}`,
      `--retries=${retries}`,
      `--workers=${workers}`,
      '--reporter=line'
    ].join(' ');
    
    logInfo(`Command: ${command}`);
    
    const startTime = Date.now();
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    logSuccess(`Test suite completed in ${duration}ms`);
    
    return {
      success: true,
      duration,
      output
    };
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr
    };
  }
}

function runAllTests() {
  logHeader('Comprehensive Inventory System Test Suite');
  
  const results = [];
  let totalDuration = 0;
  let successCount = 0;
  let failureCount = 0;
  
  // Run each test suite
  for (const testFile of testConfig.testFiles) {
    const result = runTestSuite(testFile, {
      timeout: 600000, // 10 minutes for comprehensive tests
      retries: 1,
      workers: 1 // Run sequentially to avoid conflicts
    });
    
    results.push({
      file: testFile,
      ...result
    });
    
    totalDuration += result.duration || 0;
    
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  // Generate report
  generateReport(results, totalDuration, successCount, failureCount);
  
  return {
    success: failureCount === 0,
    results,
    totalDuration,
    successCount,
    failureCount
  };
}

function generateReport(results, totalDuration, successCount, failureCount) {
  logHeader('Test Execution Report');
  
  // Summary
  logSection('Summary');
  log(`Total Test Suites: ${results.length}`);
  log(`Successful: ${colors.green}${successCount}${colors.reset}`);
  log(`Failed: ${colors.red}${failureCount}${colors.reset}`);
  log(`Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
  
  // Detailed results
  logSection('Detailed Results');
  for (const result of results) {
    const status = result.success ? 
      `${colors.green}PASSED${colors.reset}` : 
      `${colors.red}FAILED${colors.reset}`;
    
    log(`${status} ${path.basename(result.file)} (${result.duration || 0}ms)`);
    
    if (!result.success && result.error) {
      log(`  Error: ${colors.red}${result.error}${colors.reset}`);
    }
  }
  
  // Performance analysis
  logSection('Performance Analysis');
  const avgDuration = totalDuration / results.length;
  log(`Average test suite duration: ${avgDuration.toFixed(2)}ms`);
  
  if (avgDuration > testConfig.performanceThresholds.pageLoadTime * 10) {
    logWarning('Test execution time is higher than expected');
  } else {
    logSuccess('Test execution time is within acceptable limits');
  }
  
  // Recommendations
  logSection('Recommendations');
  if (failureCount > 0) {
    logWarning('Some tests failed. Please review the errors above.');
    logInfo('Check the application logs for more details.');
  } else {
    logSuccess('All tests passed! The inventory system is working correctly.');
  }
  
  if (totalDuration > 300000) { // 5 minutes
    logWarning('Total test execution time is high. Consider optimizing tests.');
  }
}

function main() {
  try {
    checkPrerequisites();
    
    const testResults = runAllTests();
    
    if (testResults.success) {
      logHeader('🎉 All Tests Passed Successfully!');
      logSuccess('The inventory system is functioning correctly.');
      process.exit(0);
    } else {
      logHeader('❌ Some Tests Failed');
      logError('Please review the test results and fix any issues.');
      process.exit(1);
    }
  } catch (error) {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTestSuite,
  checkPrerequisites,
  testConfig
};