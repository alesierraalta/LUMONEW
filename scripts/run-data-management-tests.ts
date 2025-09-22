#!/usr/bin/env ts-node

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

interface TestResult {
  test: string
  status: 'PASSED' | 'FAILED' | 'SKIPPED'
  duration?: number
  error?: string
}

class DataManagementTestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  async runTests(): Promise<void> {
    console.log('🚀 Starting Data Management Operations Tests')
    console.log('=' .repeat(60))
    
    this.startTime = Date.now()
    
    try {
      // Check if development server is running
      await this.checkServerStatus()
      
      // Run the comprehensive test suite
      await this.runPlaywrightTests()
      
      // Generate report
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    }
  }

  private async checkServerStatus(): Promise<void> {
    console.log('🔍 Checking if development server is running...')
    
    try {
      // Try to check if port 3000 is in use
      const { stdout } = await execAsync('netstat -ano | findstr :3000')
      
      if (stdout.trim()) {
        console.log('✅ Development server appears to be running on port 3000')
      } else {
        console.log('⚠️ No server detected on port 3000')
        console.log('💡 Make sure to run "npm run dev" before running tests')
      }
    } catch (error) {
      console.log('⚠️ Could not check server status, proceeding with tests...')
    }
  }

  private async runPlaywrightTests(): Promise<void> {
    console.log('\n🧪 Running Playwright tests...')
    
    const testFile = 'tests/data-management-operations.spec.ts'
    
    if (!fs.existsSync(testFile)) {
      throw new Error(`Test file not found: ${testFile}`)
    }

    try {
      // Run Playwright tests with detailed output
      const command = `npx playwright test ${testFile} --reporter=list --headed=false`
      
      console.log(`📋 Executing: ${command}`)
      console.log('=' .repeat(60))
      
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })
      
      console.log(stdout)
      
      if (stderr) {
        console.log('⚠️ Warnings/Errors:')
        console.log(stderr)
      }
      
      // Parse results from stdout
      this.parseTestResults(stdout)
      
    } catch (error: any) {
      console.error('❌ Playwright test execution failed:')
      console.error(error.message)
      
      // Try to parse partial results if available
      if (error.stdout) {
        console.log('\n📊 Partial Results:')
        console.log(error.stdout)
        this.parseTestResults(error.stdout)
      }
    }
  }

  private parseTestResults(output: string): void {
    console.log('\n📊 Parsing Test Results...')
    
    const lines = output.split('\n')
    let currentTest = ''
    
    for (const line of lines) {
      // Look for test execution lines
      if (line.includes('✓') || line.includes('PASSED')) {
        const testName = this.extractTestName(line)
        if (testName) {
          this.results.push({
            test: testName,
            status: 'PASSED',
            duration: this.extractDuration(line)
          })
        }
      } else if (line.includes('✗') || line.includes('FAILED')) {
        const testName = this.extractTestName(line)
        if (testName) {
          this.results.push({
            test: testName,
            status: 'FAILED',
            duration: this.extractDuration(line),
            error: 'Test execution failed'
          })
        }
      } else if (line.includes('⏭') || line.includes('SKIPPED')) {
        const testName = this.extractTestName(line)
        if (testName) {
          this.results.push({
            test: testName,
            status: 'SKIPPED',
            duration: this.extractDuration(line)
          })
        }
      }
    }
  }

  private extractTestName(line: string): string | null {
    // Extract test name from Playwright output
    const patterns = [
      /✓\s+(.+?)\s+\(\d+ms\)/,
      /✗\s+(.+?)\s+\(\d+ms\)/,
      /⏭\s+(.+?)\s+\(\d+ms\)/,
      /(.+?)\s+\[PASSED\]/,
      /(.+?)\s+\[FAILED\]/,
      /(.+?)\s+\[SKIPPED\]/
    ]
    
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return null
  }

  private extractDuration(line: string): number | undefined {
    const match = line.match(/\((\d+)ms\)/)
    return match ? parseInt(match[1]) : undefined
  }

  private generateReport(): void {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime
    
    console.log('\n' + '=' .repeat(60))
    console.log('📋 DATA MANAGEMENT OPERATIONS TEST REPORT')
    console.log('=' .repeat(60))
    
    console.log(`⏱️ Total execution time: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log(`🧪 Total tests: ${this.results.length}`)
    
    const passed = this.results.filter(r => r.status === 'PASSED').length
    const failed = this.results.filter(r => r.status === 'FAILED').length
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length
    
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️ Skipped: ${skipped}`)
    
    console.log('\n📊 DETAILED RESULTS:')
    console.log('-'.repeat(60))
    
    // Group results by test suite
    const suites = this.groupResultsBySuite()
    
    for (const [suite, tests] of Object.entries(suites)) {
      console.log(`\n${suite}:`)
      
      for (const test of tests) {
        const statusIcon = test.status === 'PASSED' ? '✅' : 
                          test.status === 'FAILED' ? '❌' : '⏭️'
        const duration = test.duration ? ` (${test.duration}ms)` : ''
        
        console.log(`  ${statusIcon} ${test.test}${duration}`)
        
        if (test.error) {
          console.log(`    Error: ${test.error}`)
        }
      }
    }
    
    // Summary by operation type
    console.log('\n📈 OPERATION SUMMARY:')
    console.log('-'.repeat(60))
    
    const operations = {
      'Categorías - Crear': this.results.filter(r => r.test.includes('Create new category')),
      'Categorías - Editar': this.results.filter(r => r.test.includes('Edit existing category')),
      'Categorías - Eliminar': this.results.filter(r => r.test.includes('Delete category')),
      'Ubicaciones - Crear': this.results.filter(r => r.test.includes('Create new location')),
      'Ubicaciones - Editar': this.results.filter(r => r.test.includes('Edit existing location')),
      'Ubicaciones - Eliminar': this.results.filter(r => r.test.includes('Delete location')),
      'Usuarios - Crear': this.results.filter(r => r.test.includes('Create new user')),
      'Usuarios - Editar': this.results.filter(r => r.test.includes('Edit existing user')),
      'Usuarios - Cambiar Rol': this.results.filter(r => r.test.includes('Change user role')),
      'Usuarios - Eliminar': this.results.filter(r => r.test.includes('Delete user'))
    }
    
    for (const [operation, tests] of Object.entries(operations)) {
      if (tests.length > 0) {
        const passed = tests.filter(t => t.status === 'PASSED').length
        const total = tests.length
        const status = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌'
        
        console.log(`${status} ${operation}: ${passed}/${total} passed`)
      }
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    console.log('-'.repeat(60))
    
    const failedTests = this.results.filter(r => r.status === 'FAILED')
    
    if (failedTests.length === 0) {
      console.log('🎉 All tests passed! The data management operations are working correctly.')
    } else {
      console.log('🔧 Issues found that need attention:')
      
      for (const test of failedTests) {
        if (test.test.includes('Edit existing category')) {
          console.log('• Fix the 404 error for category editing - check routing and API endpoints')
        }
        if (test.test.includes('Delete category')) {
          console.log('• Fix the category deletion functionality - check API and UI integration')
        }
        if (test.test.includes('Error handling')) {
          console.log('• Improve error handling for invalid IDs and edge cases')
        }
      }
    }
    
    console.log('\n' + '=' .repeat(60))
    
    // Save results to file for reference
    this.saveResultsToFile()
  }

  private groupResultsBySuite(): Record<string, TestResult[]> {
    const suites: Record<string, TestResult[]> = {}
    
    for (const result of this.results) {
      let suite = 'Other'
      
      if (result.test.includes('category')) {
        suite = '📂 Categorías'
      } else if (result.test.includes('location')) {
        suite = '📍 Ubicaciones'
      } else if (result.test.includes('user')) {
        suite = '👥 Usuarios'
      } else if (result.test.includes('navigation') || result.test.includes('permission') || result.test.includes('error')) {
        suite = '🔍 Validaciones Adicionales'
      }
      
      if (!suites[suite]) {
        suites[suite] = []
      }
      suites[suite].push(result)
    }
    
    return suites
  }

  private saveResultsToFile(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `test-results/data-management-${timestamp}.json`
    
    // Ensure directory exists
    const dir = path.dirname(filename)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASSED').length,
      failed: this.results.filter(r => r.status === 'FAILED').length,
      skipped: this.results.filter(r => r.status === 'SKIPPED').length,
      duration: Date.now() - this.startTime,
      results: this.results
    }
    
    fs.writeFileSync(filename, JSON.stringify(report, null, 2))
    console.log(`📁 Results saved to: ${filename}`)
  }
}

// Run the tests
async function main() {
  const runner = new DataManagementTestRunner()
  await runner.runTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { DataManagementTestRunner }