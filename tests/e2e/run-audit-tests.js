#!/usr/bin/env node

/**
 * Automated Audit System Test Runner
 * Executes all audit system tests and generates a comprehensive report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AuditTestRunner {
  constructor() {
    this.testResults = {
      startTime: new Date(),
      endTime: null,
      duration: null,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    this.testFiles = [
      'tests/e2e/audit-system-comprehensive.test.ts',
      'tests/e2e/audit-api-integration.test.ts',
      'tests/e2e/audit-system.test.ts'
    ];
  }

  async runTests() {
    console.log('🚀 Starting Automated Audit System Tests...\n');
    console.log('📅 Test Execution Date:', new Date().toISOString());
    console.log('🔧 Test Files:', this.testFiles.length);
    console.log('─'.repeat(60));

    for (const testFile of this.testFiles) {
      await this.runTestFile(testFile);
    }

    this.generateReport();
  }

  async runTestFile(testFile) {
    console.log(`\n📋 Running: ${testFile}`);
    
    try {
      const command = `npx playwright test ${testFile} --reporter=json`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 300000 // 5 minutes timeout
      });
      
      const result = JSON.parse(output);
      this.processTestResult(testFile, result);
      
    } catch (error) {
      console.error(`❌ Error running ${testFile}:`, error.message);
      this.processTestError(testFile, error);
    }
  }

  processTestResult(testFile, result) {
    const testResult = {
      file: testFile,
      status: 'passed',
      tests: result.suites?.[0]?.specs || [],
      duration: result.suites?.[0]?.duration || 0,
      error: null
    };

    if (result.suites && result.suites[0] && result.suites[0].specs) {
      result.suites[0].specs.forEach(spec => {
        this.testResults.summary.total++;
        
        if (spec.ok) {
          this.testResults.summary.passed++;
        } else {
          this.testResults.summary.failed++;
          testResult.status = 'failed';
        }
      });
    }

    this.testResults.tests.push(testResult);
    console.log(`✅ ${testFile} - ${testResult.status.toUpperCase()}`);
  }

  processTestError(testFile, error) {
    const testResult = {
      file: testFile,
      status: 'failed',
      tests: [],
      duration: 0,
      error: error.message
    };

    this.testResults.tests.push(testResult);
    this.testResults.summary.failed++;
    console.log(`❌ ${testFile} - FAILED`);
  }

  generateReport() {
    this.testResults.endTime = new Date();
    this.testResults.duration = this.testResults.endTime - this.testResults.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 AUDIT SYSTEM TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Total Duration: ${this.testResults.duration}ms`);
    console.log(`📋 Total Tests: ${this.testResults.summary.total}`);
    console.log(`✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.testResults.summary.skipped}`);
    
    const successRate = this.testResults.summary.total > 0 
      ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Success Rate: ${successRate}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    console.log('─'.repeat(60));
    
    this.testResults.tests.forEach(test => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${test.file}`);
      console.log(`   Duration: ${test.duration}ms`);
      
      if (test.tests && test.tests.length > 0) {
        test.tests.forEach(spec => {
          const specStatus = spec.ok ? '✅' : '❌';
          console.log(`   ${specStatus} ${spec.title}`);
        });
      }
      
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    // Generate JSON report
    this.saveJsonReport();
    
    // Generate markdown report
    this.saveMarkdownReport();
    
    console.log('\n📄 Reports generated:');
    console.log('   - audit-test-results.json');
    console.log('   - audit-test-report.md');
    
    console.log('\n🎯 AUDIT SYSTEM STATUS:', 
      this.testResults.summary.failed === 0 ? '✅ FULLY FUNCTIONAL' : '⚠️  ISSUES DETECTED');
  }

  saveJsonReport() {
    const reportPath = path.join(process.cwd(), 'audit-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
  }

  saveMarkdownReport() {
    const reportPath = path.join(process.cwd(), 'audit-test-report.md');
    
    const markdown = `# Audit System Test Report

**Generated:** ${this.testResults.startTime.toISOString()}
**Duration:** ${this.testResults.duration}ms

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${this.testResults.summary.total} |
| Passed | ${this.testResults.summary.passed} |
| Failed | ${this.testResults.summary.failed} |
| Skipped | ${this.testResults.summary.skipped} |
| Success Rate | ${this.testResults.summary.total > 0 ? ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(2) : 0}% |

## Test Results

${this.testResults.tests.map(test => `
### ${test.file}
- **Status:** ${test.status === 'passed' ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${test.duration}ms
${test.tests && test.tests.length > 0 ? `
**Test Cases:**
${test.tests.map(spec => `- ${spec.ok ? '✅' : '❌'} ${spec.title}`).join('\n')}
` : ''}
${test.error ? `**Error:** ${test.error}` : ''}
`).join('\n')}

## Conclusion

${this.testResults.summary.failed === 0 
  ? '✅ **All audit system tests passed successfully. The audit system is fully functional.**'
  : `⚠️ **${this.testResults.summary.failed} test(s) failed. Please review the issues above.**`
}

---

*Report generated by Automated Audit System Test Runner*
`;

    fs.writeFileSync(reportPath, markdown);
  }
}

// Run the tests
if (require.main === module) {
  const runner = new AuditTestRunner();
  runner.runTests().catch(console.error);
}

module.exports = AuditTestRunner;
