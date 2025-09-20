#!/usr/bin/env node

/**
 * Inventory Module Comprehensive Testing Script
 * 
 * This script runs the complete inventory module test suite,
 * generates reports, and updates documentation with results.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class InventoryTestRunner {
  constructor() {
    this.resultsDir = './test-results';
    this.reportsDir = './test-results/reports';
    this.docsDir = './docs';
    this.startTime = Date.now();
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      executionTime: 0,
      details: []
    };
  }

  /**
   * Run the complete inventory test suite
   */
  async runTests() {
    console.log('🚀 Starting Inventory Module Comprehensive Testing');
    console.log('==================================================');
    
    try {
      // Ensure directories exist
      this.ensureDirectories();
      
      // Run the comprehensive test suite
      console.log('\n📋 Running comprehensive inventory tests...');
      await this.runComprehensiveTests();
      
      // Generate reports
      console.log('\n📊 Generating test reports...');
      await this.generateReports();
      
      // Update documentation
      console.log('\n📝 Updating documentation...');
      await this.updateDocumentation();
      
      // Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [this.resultsDir, this.reportsDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  /**
   * Run the comprehensive inventory tests
   */
  async runComprehensiveTests() {
    const testFile = 'tests/e2e/inventory/inventory-comprehensive-testing.spec.ts';
    
    try {
      console.log(`🧪 Executing: ${testFile}`);
      
      const command = `npx playwright test ${testFile} --reporter=html,json,junit --output-dir=${this.resultsDir}`;
      
      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Parse results
      this.parseTestResults();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse test results from generated files
   */
  parseTestResults() {
    try {
      // Parse JSON results
      const jsonResultsPath = path.join(this.resultsDir, 'results.json');
      if (fs.existsSync(jsonResultsPath)) {
        const results = JSON.parse(fs.readFileSync(jsonResultsPath, 'utf8'));
        this.processTestResults(results);
      }
      
      // Parse JUnit results
      const junitResultsPath = path.join(this.resultsDir, 'junit.xml');
      if (fs.existsSync(junitResultsPath)) {
        this.processJUnitResults(junitResultsPath);
      }
      
    } catch (error) {
      console.warn('⚠️ Could not parse test results:', error.message);
    }
  }

  /**
   * Process Playwright JSON results
   */
  processTestResults(results) {
    if (results.stats) {
      this.testResults.total = results.stats.total || 0;
      this.testResults.passed = results.stats.passed || 0;
      this.testResults.failed = results.stats.failed || 0;
      this.testResults.skipped = results.stats.skipped || 0;
      this.testResults.executionTime = results.stats.duration || 0;
    }
    
    if (results.suites) {
      results.suites.forEach(suite => {
        this.processSuite(suite);
      });
    }
  }

  /**
   * Process a test suite
   */
  processSuite(suite) {
    if (suite.tests) {
      suite.tests.forEach(test => {
        this.testResults.details.push({
          name: test.title,
          status: test.status,
          duration: test.duration || 0,
          error: test.error ? test.error.message : null
        });
      });
    }
    
    if (suite.suites) {
      suite.suites.forEach(subSuite => this.processSuite(subSuite));
    }
  }

  /**
   * Process JUnit XML results
   */
  processJUnitResults(filePath) {
    try {
      const xmlContent = fs.readFileSync(filePath, 'utf8');
      // Simple XML parsing for JUnit results
      const totalMatch = xmlContent.match(/tests="(\d+)"/);
      const failuresMatch = xmlContent.match(/failures="(\d+)"/);
      const skippedMatch = xmlContent.match(/skipped="(\d+)"/);
      const timeMatch = xmlContent.match(/time="([\d.]+)"/);
      
      if (totalMatch) this.testResults.total = parseInt(totalMatch[1]);
      if (failuresMatch) this.testResults.failed = parseInt(failuresMatch[1]);
      if (skippedMatch) this.testResults.skipped = parseInt(skippedMatch[1]);
      if (timeMatch) this.testResults.executionTime = parseFloat(timeMatch[1]) * 1000;
      
      this.testResults.passed = this.testResults.total - this.testResults.failed - this.testResults.skipped;
      
    } catch (error) {
      console.warn('⚠️ Could not parse JUnit results:', error.message);
    }
  }

  /**
   * Generate comprehensive test reports
   */
  async generateReports() {
    // Generate HTML report
    this.generateHTMLReport();
    
    // Generate Markdown report
    this.generateMarkdownReport();
    
    // Generate JSON report
    this.generateJSONReport();
    
    // Generate CSV report
    this.generateCSVReport();
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const timestamp = new Date().toISOString();
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total) * 100 : 0;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Module Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
        .summary-card .number { font-size: 2.5em; font-weight: bold; color: #007bff; margin: 0; }
        .summary-card.passed { border-left-color: #28a745; }
        .summary-card.passed .number { color: #28a745; }
        .summary-card.failed { border-left-color: #dc3545; }
        .summary-card.failed .number { color: #dc3545; }
        .summary-card.skipped { border-left-color: #ffc107; }
        .summary-card.skipped .number { color: #ffc107; }
        .summary-card.time { border-left-color: #6f42c1; }
        .summary-card.time .number { color: #6f42c1; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin: 20px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745 0%, #20c997 100%); transition: width 0.3s ease; }
        .results { padding: 0 30px 30px; }
        .results h2 { color: #495057; margin-bottom: 20px; }
        .test-result { display: flex; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 6px; background: #f8f9fa; }
        .test-result.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-result.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-result.skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
        .status-icon { font-size: 1.5em; margin-right: 15px; }
        .test-info { flex: 1; }
        .test-info h4 { margin: 0 0 5px 0; color: #495057; }
        .test-info p { margin: 0; color: #6c757d; font-size: 0.9em; }
        .test-meta { text-align: right; color: #6c757d; font-size: 0.9em; }
        .error-details { margin-top: 10px; padding: 10px; background: #fff5f5; border-radius: 4px; border-left: 3px solid #dc3545; }
        .error-details pre { margin: 0; font-size: 0.8em; color: #721c24; }
        .footer { padding: 20px 30px; background: #f8f9fa; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Inventory Module Test Report</h1>
            <p>Generated on ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <p class="number">${this.testResults.total}</p>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <p class="number">${this.testResults.passed}</p>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <p class="number">${this.testResults.failed}</p>
            </div>
            <div class="summary-card skipped">
                <h3>Skipped</h3>
                <p class="number">${this.testResults.skipped}</p>
            </div>
            <div class="summary-card time">
                <h3>Execution Time</h3>
                <p class="number">${(this.testResults.executionTime / 1000).toFixed(1)}s</p>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${successRate}%"></div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${this.generateTestResultsHTML()}
        </div>
        
        <div class="footer">
            <p>Success Rate: ${successRate.toFixed(2)}%</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(this.reportsDir, 'inventory-test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`📄 HTML report generated: ${reportPath}`);
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const timestamp = new Date().toISOString();
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total) * 100 : 0;
    
    let markdown = `# 📋 Inventory Module Test Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Execution Time:** ${(this.testResults.executionTime / 1000).toFixed(1)}s\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${this.testResults.total} |\n`;
    markdown += `| Passed | ${this.testResults.passed} |\n`;
    markdown += `| Failed | ${this.testResults.failed} |\n`;
    markdown += `| Skipped | ${this.testResults.skipped} |\n`;
    markdown += `| Success Rate | ${successRate.toFixed(2)}% |\n`;
    markdown += `| Execution Time | ${(this.testResults.executionTime / 1000).toFixed(1)}s |\n\n`;
    
    markdown += `## 🧪 Test Results\n\n`;
    
    // Group by status
    const groupedResults = this.groupResultsByStatus();
    
    for (const [status, results] of Object.entries(groupedResults)) {
      markdown += `### ${this.getStatusIcon(status)} ${status.toUpperCase()} (${results.length})\n\n`;
      
      for (const result of results) {
        markdown += `#### ${result.name}\n`;
        markdown += `- **Duration:** ${result.duration}ms\n`;
        if (result.error) {
          markdown += `- **Error:** ${result.error}\n`;
        }
        markdown += `\n`;
      }
    }
    
    markdown += `## 🎯 Recommendations\n\n`;
    
    if (this.testResults.failed > 0) {
      markdown += `- **Critical:** ${this.testResults.failed} tests failed and require immediate attention\n`;
    }
    
    if (successRate < 90) {
      markdown += `- **Warning:** Success rate is below 90% target\n`;
    }
    
    if (this.testResults.skipped > 0) {
      markdown += `- **Info:** ${this.testResults.skipped} tests were skipped and should be reviewed\n`;
    }
    
    markdown += `\n---\n`;
    markdown += `*Report generated automatically by Inventory Test Runner*`;
    
    const reportPath = path.join(this.reportsDir, 'inventory-test-report.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`📄 Markdown report generated: ${reportPath}`);
  }

  /**
   * Generate JSON report
   */
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        skipped: this.testResults.skipped,
        successRate: this.testResults.total > 0 ? 
          (this.testResults.passed / this.testResults.total) * 100 : 0,
        executionTime: this.testResults.executionTime
      },
      details: this.testResults.details
    };
    
    const reportPath = path.join(this.reportsDir, 'inventory-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report generated: ${reportPath}`);
  }

  /**
   * Generate CSV report
   */
  generateCSVReport() {
    const headers = ['Test Name', 'Status', 'Duration (ms)', 'Error'];
    const csvRows = [headers.join(',')];
    
    this.testResults.details.forEach(result => {
      const row = [
        `"${result.name}"`,
        result.status,
        result.duration,
        result.error ? `"${result.error.replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const reportPath = path.join(this.reportsDir, 'inventory-test-report.csv');
    fs.writeFileSync(reportPath, csvContent);
    console.log(`📄 CSV report generated: ${reportPath}`);
  }

  /**
   * Update documentation with test results
   */
  async updateDocumentation() {
    try {
      const docPath = path.join(this.docsDir, 'INVENTORY_TESTING_DOCUMENTATION.md');
      
      if (fs.existsSync(docPath)) {
        let content = fs.readFileSync(docPath, 'utf8');
        
        // Update the summary section
        const successRate = this.testResults.total > 0 ? 
          (this.testResults.passed / this.testResults.total) * 100 : 0;
        
        const summaryRegex = /## 📊 Resumen Ejecutivo[\s\S]*?### Métricas de Calidad[\s\S]*?-\*\*Errores Críticos\*\*: \d+/;
        const newSummary = `## 📊 Resumen Ejecutivo

### Estado General del Módulo
- **Funcionalidades Identificadas**: 15+ funcionalidades principales
- **Casos de Prueba**: 50+ escenarios de testing
- **Cobertura Objetivo**: 100%
- **Estado Actual**: ${successRate >= 90 ? 'Estable' : 'En desarrollo y testing'}

### Métricas de Calidad
- **Estabilidad Objetivo**: 100%
- **Estabilidad Actual**: ${successRate.toFixed(2)}%
- **Tiempo de Respuesta**: < 3 segundos
- **Disponibilidad**: 99.9%
- **Errores Críticos**: ${this.testResults.failed}`;
        
        content = content.replace(summaryRegex, newSummary);
        
        // Update test results table
        const testResultsTable = this.generateTestResultsTable();
        const tableRegex = /\| ID \| Funcionalidad \| Caso de Prueba \| Prioridad \| Estado \| Resultado \| Observaciones \|[\s\S]*?\| CP010 \| Reportes \| Stock bajo \| Baja \| ⏳ \| - \| Pendiente \|/;
        content = content.replace(tableRegex, testResultsTable);
        
        fs.writeFileSync(docPath, content);
        console.log(`📝 Documentation updated: ${docPath}`);
      }
      
    } catch (error) {
      console.warn('⚠️ Could not update documentation:', error.message);
    }
  }

  /**
   * Generate test results table for documentation
   */
  generateTestResultsTable() {
    let table = `| ID | Funcionalidad | Caso de Prueba | Prioridad | Estado | Resultado | Observaciones |\n`;
    table += `|----|---------------|----------------|-----------|---------|-----------|---------------|\n`;
    
    // Add test results from execution
    this.testResults.details.forEach((result, index) => {
      const testId = `CP${String(index + 1).padStart(3, '0')}`;
      const status = this.getStatusIcon(result.status);
      const resultStatus = result.status === 'passed' ? '✅ ÉXITO' : 
                          result.status === 'failed' ? '❌ FALLO' : '⏭️ OMITIDO';
      const observations = result.error ? `Error: ${result.error.substring(0, 50)}...` : '-';
      
      table += `| ${testId} | ${result.name.split(':')[0]} | ${result.name} | Alta | ${status} | ${resultStatus} | ${observations} |\n`;
    });
    
    return table;
  }

  /**
   * Generate HTML for test results
   */
  generateTestResultsHTML() {
    return this.testResults.details.map(result => `
      <div class="test-result ${result.status}">
        <div class="status-icon">${this.getStatusIcon(result.status)}</div>
        <div class="test-info">
          <h4>${result.name}</h4>
          <p>Duration: ${result.duration}ms</p>
          ${result.error ? `<div class="error-details"><pre>${result.error}</pre></div>` : ''}
        </div>
        <div class="test-meta">
          <div>${result.status}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Group results by status
   */
  groupResultsByStatus() {
    return this.testResults.details.reduce((groups, result) => {
      if (!groups[result.status]) {
        groups[result.status] = [];
      }
      groups[result.status].push(result);
      return groups;
    }, {});
  }

  /**
   * Get status icon
   */
  getStatusIcon(status) {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  /**
   * Display final summary
   */
  displaySummary() {
    const totalTime = Date.now() - this.startTime;
    const successRate = this.testResults.total > 0 ? 
      (this.testResults.passed / this.testResults.total) * 100 : 0;
    
    console.log('\n🎉 Inventory Module Testing Complete!');
    console.log('=====================================');
    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏭️ Skipped: ${this.testResults.skipped}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⏱️ Total Time: ${(totalTime / 1000).toFixed(1)}s`);
    
    if (this.testResults.failed > 0) {
      console.log(`\n⚠️ ${this.testResults.failed} tests failed and require attention`);
    }
    
    if (successRate >= 90) {
      console.log('\n🎯 Target achieved: 90%+ success rate');
    } else {
      console.log(`\n🎯 Target not met: Need ${(90 - successRate).toFixed(2)}% improvement`);
    }
    
    console.log('\n📄 Reports generated in ./test-results/reports/');
    console.log('📝 Documentation updated in ./docs/INVENTORY_TESTING_DOCUMENTATION.md');
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new InventoryTestRunner();
  runner.runTests().catch(console.error);
}

module.exports = InventoryTestRunner;