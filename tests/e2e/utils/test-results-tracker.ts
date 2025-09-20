/**
 * Test Results Tracker
 * 
 * Utility class for tracking and managing test results,
 * generating reports, and maintaining test status documentation.
 */

export interface TestResult {
  testId: string;
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'PENDING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  executionTime: number;
  timestamp: Date;
  details: string;
  errorMessage?: string;
  screenshot?: string;
  video?: string;
  browser: string;
  environment: string;
}

export interface TestSuite {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  pendingTests: number;
  executionTime: number;
  successRate: number;
  results: TestResult[];
}

export class TestResultsTracker {
  private results: Map<string, TestResult> = new Map();
  private currentSuite: string = '';
  private startTime: Date = new Date();

  constructor(private environment: string = 'test') {}

  /**
   * Start tracking a new test suite
   */
  startSuite(suiteName: string): void {
    this.currentSuite = suiteName;
    this.startTime = new Date();
    console.log(`🚀 Starting test suite: ${suiteName}`);
  }

  /**
   * Record a test result
   */
  recordResult(
    testId: string,
    testName: string,
    status: TestResult['status'],
    priority: TestResult['priority'] = 'MEDIUM',
    category: string = 'general',
    executionTime: number = 0,
    details: string = '',
    errorMessage?: string,
    screenshot?: string,
    video?: string,
    browser: string = 'chromium'
  ): void {
    const result: TestResult = {
      testId,
      testName,
      status,
      priority,
      category,
      executionTime,
      timestamp: new Date(),
      details,
      errorMessage,
      screenshot,
      video,
      browser,
      environment: this.environment
    };

    this.results.set(testId, result);
    
    // Log result
    const statusIcon = this.getStatusIcon(status);
    console.log(`${statusIcon} ${testId}: ${testName} - ${status}`);
    if (errorMessage) {
      console.log(`   Error: ${errorMessage}`);
    }
  }

  /**
   * Get current test suite summary
   */
  getSuiteSummary(): TestSuite {
    const results = Array.from(this.results.values());
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const skippedTests = results.filter(r => r.status === 'SKIP').length;
    const pendingTests = results.filter(r => r.status === 'PENDING').length;
    
    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    return {
      suiteName: this.currentSuite,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      pendingTests,
      executionTime: totalExecutionTime,
      successRate,
      results
    };
  }

  /**
   * Generate detailed HTML report
   */
  generateHTMLReport(): string {
    const summary = this.getSuiteSummary();
    const timestamp = new Date().toISOString();
    
    return `
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
        .results { padding: 0 30px 30px; }
        .results h2 { color: #495057; margin-bottom: 20px; }
        .test-result { display: flex; align-items: center; padding: 15px; margin-bottom: 10px; border-radius: 6px; background: #f8f9fa; }
        .test-result.passed { background: #d4edda; border-left: 4px solid #28a745; }
        .test-result.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .test-result.skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
        .test-result.pending { background: #e2e3e5; border-left: 4px solid #6c757d; }
        .status-icon { font-size: 1.5em; margin-right: 15px; }
        .test-info { flex: 1; }
        .test-info h4 { margin: 0 0 5px 0; color: #495057; }
        .test-info p { margin: 0; color: #6c757d; font-size: 0.9em; }
        .test-meta { text-align: right; color: #6c757d; font-size: 0.9em; }
        .error-details { margin-top: 10px; padding: 10px; background: #fff5f5; border-radius: 4px; border-left: 3px solid #dc3545; }
        .error-details pre { margin: 0; font-size: 0.8em; color: #721c24; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin: 20px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745 0%, #20c997 100%); transition: width 0.3s ease; }
        .footer { padding: 20px 30px; background: #f8f9fa; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; }
        @media (max-width: 768px) {
            .summary { grid-template-columns: 1fr 1fr; }
            .header h1 { font-size: 2em; }
            .test-result { flex-direction: column; align-items: flex-start; }
            .test-meta { margin-top: 10px; align-self: flex-end; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Inventory Module Test Report</h1>
            <p>Generated on ${timestamp} | Environment: ${this.environment}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <p class="number">${summary.totalTests}</p>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <p class="number">${summary.passedTests}</p>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <p class="number">${summary.failedTests}</p>
            </div>
            <div class="summary-card skipped">
                <h3>Skipped</h3>
                <p class="number">${summary.skippedTests}</p>
            </div>
            <div class="summary-card time">
                <h3>Execution Time</h3>
                <p class="number">${(summary.executionTime / 1000).toFixed(1)}s</p>
            </div>
        </div>
        
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${summary.successRate}%"></div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${this.generateTestResultsHTML(summary.results)}
        </div>
        
        <div class="footer">
            <p>Test Suite: ${summary.suiteName} | Success Rate: ${summary.successRate.toFixed(2)}%</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JSON report
   */
  generateJSONReport(): string {
    const summary = this.getSuiteSummary();
    return JSON.stringify({
      summary,
      timestamp: new Date().toISOString(),
      environment: this.environment
    }, null, 2);
  }

  /**
   * Generate Markdown report for documentation
   */
  generateMarkdownReport(): string {
    const summary = this.getSuiteSummary();
    const timestamp = new Date().toISOString();
    
    let markdown = `# 📋 Inventory Module Test Report\n\n`;
    markdown += `**Generated:** ${timestamp}\n`;
    markdown += `**Environment:** ${this.environment}\n`;
    markdown += `**Suite:** ${summary.suiteName}\n\n`;
    
    markdown += `## 📊 Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${summary.totalTests} |\n`;
    markdown += `| Passed | ${summary.passedTests} |\n`;
    markdown += `| Failed | ${summary.failedTests} |\n`;
    markdown += `| Skipped | ${summary.skippedTests} |\n`;
    markdown += `| Pending | ${summary.pendingTests} |\n`;
    markdown += `| Success Rate | ${summary.successRate.toFixed(2)}% |\n`;
    markdown += `| Execution Time | ${(summary.executionTime / 1000).toFixed(1)}s |\n\n`;
    
    markdown += `## 🧪 Test Results\n\n`;
    
    // Group by status
    const groupedResults = this.groupResultsByStatus(summary.results);
    
    for (const [status, results] of Object.entries(groupedResults)) {
      markdown += `### ${this.getStatusIcon(status)} ${status.toUpperCase()} (${results.length})\n\n`;
      
      for (const result of results) {
        markdown += `#### ${result.testId}: ${result.testName}\n`;
        markdown += `- **Category:** ${result.category}\n`;
        markdown += `- **Priority:** ${result.priority}\n`;
        markdown += `- **Execution Time:** ${result.executionTime}ms\n`;
        markdown += `- **Browser:** ${result.browser}\n`;
        markdown += `- **Details:** ${result.details}\n`;
        
        if (result.errorMessage) {
          markdown += `- **Error:** ${result.errorMessage}\n`;
        }
        
        markdown += `\n`;
      }
    }
    
    markdown += `## 🎯 Recommendations\n\n`;
    
    if (summary.failedTests > 0) {
      markdown += `- **Critical:** ${summary.failedTests} tests failed and require immediate attention\n`;
    }
    
    if (summary.successRate < 90) {
      markdown += `- **Warning:** Success rate is below 90% target\n`;
    }
    
    if (summary.skippedTests > 0) {
      markdown += `- **Info:** ${summary.skippedTests} tests were skipped and should be reviewed\n`;
    }
    
    markdown += `\n---\n`;
    markdown += `*Report generated automatically by Test Results Tracker*`;
    
    return markdown;
  }

  /**
   * Save reports to files
   */
  async saveReports(outputDir: string = './test-results'): Promise<void> {
    // This would be implemented to save files
    // For now, we'll just log the reports
    console.log('📄 HTML Report generated');
    console.log('📄 JSON Report generated');
    console.log('📄 Markdown Report generated');
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'SKIP': return '⏭️';
      case 'PENDING': return '⏳';
      default: return '❓';
    }
  }

  /**
   * Generate HTML for test results
   */
  private generateTestResultsHTML(results: TestResult[]): string {
    return results.map(result => `
      <div class="test-result ${result.status.toLowerCase()}">
        <div class="status-icon">${this.getStatusIcon(result.status)}</div>
        <div class="test-info">
          <h4>${result.testId}: ${result.testName}</h4>
          <p>${result.details}</p>
          ${result.errorMessage ? `<div class="error-details"><pre>${result.errorMessage}</pre></div>` : ''}
        </div>
        <div class="test-meta">
          <div>${result.category}</div>
          <div>${result.priority}</div>
          <div>${result.executionTime}ms</div>
          <div>${result.browser}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Group results by status
   */
  private groupResultsByStatus(results: TestResult[]): Record<string, TestResult[]> {
    return results.reduce((groups, result) => {
      if (!groups[result.status]) {
        groups[result.status] = [];
      }
      groups[result.status].push(result);
      return groups;
    }, {} as Record<string, TestResult[]>);
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results.clear();
    this.currentSuite = '';
  }

  /**
   * Export results to various formats
   */
  exportResults(format: 'json' | 'csv' | 'xml' = 'json'): string {
    const results = Array.from(this.results.values());
    
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);
      case 'csv':
        return this.exportToCSV(results);
      case 'xml':
        return this.exportToXML(results);
      default:
        return JSON.stringify(results, null, 2);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(results: TestResult[]): string {
    const headers = ['Test ID', 'Test Name', 'Status', 'Priority', 'Category', 'Execution Time', 'Timestamp', 'Details', 'Error Message', 'Browser', 'Environment'];
    const csvRows = [headers.join(',')];
    
    results.forEach(result => {
      const row = [
        result.testId,
        `"${result.testName}"`,
        result.status,
        result.priority,
        result.category,
        result.executionTime,
        result.timestamp.toISOString(),
        `"${result.details}"`,
        result.errorMessage ? `"${result.errorMessage}"` : '',
        result.browser,
        result.environment
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Export to XML format
   */
  private exportToXML(results: TestResult[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<testResults>\n';
    
    results.forEach(result => {
      xml += '  <test>\n';
      xml += `    <id>${result.testId}</id>\n`;
      xml += `    <name><![CDATA[${result.testName}]]></name>\n`;
      xml += `    <status>${result.status}</status>\n`;
      xml += `    <priority>${result.priority}</priority>\n`;
      xml += `    <category>${result.category}</category>\n`;
      xml += `    <executionTime>${result.executionTime}</executionTime>\n`;
      xml += `    <timestamp>${result.timestamp.toISOString()}</timestamp>\n`;
      xml += `    <details><![CDATA[${result.details}]]></details>\n`;
      if (result.errorMessage) {
        xml += `    <errorMessage><![CDATA[${result.errorMessage}]]></errorMessage>\n`;
      }
      xml += `    <browser>${result.browser}</browser>\n`;
      xml += `    <environment>${result.environment}</environment>\n`;
      xml += '  </test>\n';
    });
    
    xml += '</testResults>';
    return xml;
  }
}

// Export singleton instance
export const testTracker = new TestResultsTracker();