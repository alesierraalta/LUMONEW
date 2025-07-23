import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin } from '../utils/test-helpers';

test.describe('Enhanced Test Reporting and Debugging', () => {
  // Test with comprehensive debugging information
  test.describe('Debug Information Collection', () => {
    test('should collect comprehensive debug information on test failure', async ({ page }, testInfo) => {
      try {
        await loginAsAdmin(page);
        await page.goto(testData.urls.dashboard);
        
        // Intentionally cause a failure for demonstration
        // await expect(page.locator('non-existent-element')).toBeVisible();
        
        // This test should pass, but demonstrates debug collection
        await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
        
      } catch (error) {
        // Collect debug information on failure
        await collectDebugInformation(page, testInfo, error);
        throw error;
      }
    });

    test('should capture network activity', async ({ page }, testInfo) => {
      const networkLogs: any[] = [];
      
      // Monitor network requests
      page.on('request', request => {
        networkLogs.push({
          type: 'request',
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          timestamp: new Date().toISOString()
        });
      });
      
      page.on('response', response => {
        networkLogs.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          timestamp: new Date().toISOString()
        });
      });
      
      page.on('requestfailed', request => {
        networkLogs.push({
          type: 'request_failed',
          url: request.url(),
          failure: request.failure()?.errorText,
          timestamp: new Date().toISOString()
        });
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      await page.waitForLoadState('networkidle');
      
      // Attach network logs
      await testInfo.attach('network-logs', {
        body: JSON.stringify(networkLogs, null, 2),
        contentType: 'application/json'
      });
      
      console.log(`Captured ${networkLogs.length} network events`);
    });

    test('should capture console logs and errors', async ({ page }, testInfo) => {
      const consoleLogs: any[] = [];
      
      // Monitor console messages
      page.on('console', msg => {
        consoleLogs.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      });
      
      // Monitor page errors
      page.on('pageerror', error => {
        consoleLogs.push({
          type: 'pageerror',
          text: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      // Attach console logs
      await testInfo.attach('console-logs', {
        body: JSON.stringify(consoleLogs, null, 2),
        contentType: 'application/json'
      });
      
      console.log(`Captured ${consoleLogs.length} console events`);
    });
  });

  // Test retry mechanisms with detailed logging
  test.describe('Test Retry and Recovery', () => {
    test('should handle flaky tests with retry logic', async ({ page }, testInfo) => {
      console.log(`Test attempt: ${testInfo.retry + 1}`);
      
      if (testInfo.retry > 0) {
        console.log('Retrying test - performing cleanup');
        // Perform any necessary cleanup for retry
        await page.goto('about:blank');
        await page.waitForTimeout(1000);
      }
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table with retry logic
      let tableVisible = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.waitForSelector('table', { timeout: 5000 });
          tableVisible = true;
          break;
        } catch (error) {
          console.log(`Table load attempt ${attempt + 1} failed`);
          if (attempt < 2) {
            await page.reload();
            await page.waitForLoadState('networkidle');
          }
        }
      }
      
      expect(tableVisible).toBe(true);
    });

    test('should collect retry-specific information', async ({ page }, testInfo) => {
      const retryInfo = {
        retryCount: testInfo.retry,
        maxRetries: testInfo.project.retries || 0,
        testTitle: testInfo.title,
        testFile: testInfo.file,
        startTime: new Date().toISOString()
      };
      
      await testInfo.attach('retry-info', {
        body: JSON.stringify(retryInfo, null, 2),
        contentType: 'application/json'
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
      
      console.log(`Test completed on attempt ${testInfo.retry + 1}`);
    });
  });

  // Visual debugging with screenshots and videos
  test.describe('Visual Debugging', () => {
    test('should capture screenshots at key points', async ({ page }, testInfo) => {
      // Screenshot before login
      await page.goto(testData.urls.login);
      await testInfo.attach('01-login-page', {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
      
      // Screenshot after login
      await loginAsAdmin(page);
      await testInfo.attach('02-after-login', {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
      
      // Screenshot of dashboard
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      await testInfo.attach('03-dashboard', {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
      
      // Screenshot of inventory page
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
      await testInfo.attach('04-inventory-page', {
        body: await page.screenshot(),
        contentType: 'image/png'
      });
      
      console.log('Captured 4 debug screenshots');
    });

    test('should capture element-specific screenshots', async ({ page }, testInfo) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Screenshot of specific dashboard components
      const metricsCards = page.locator(testData.selectors.dashboard.metricsCards);
      if (await metricsCards.isVisible()) {
        await testInfo.attach('metrics-cards', {
          body: await metricsCards.screenshot(),
          contentType: 'image/png'
        });
      }
      
      const quickActions = page.locator(testData.selectors.dashboard.quickActions);
      if (await quickActions.isVisible()) {
        await testInfo.attach('quick-actions', {
          body: await quickActions.screenshot(),
          contentType: 'image/png'
        });
      }
      
      console.log('Captured component-specific screenshots');
    });
  });

  // Performance debugging
  test.describe('Performance Debugging', () => {
    test('should collect detailed performance traces', async ({ page }, testInfo) => {
      // Start tracing
      await page.context().tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      // Navigate to inventory
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Stop tracing and attach
      await page.context().tracing.stop({ path: 'trace.zip' });
      await testInfo.attach('performance-trace', {
        path: 'trace.zip',
        contentType: 'application/zip'
      });
      
      console.log('Performance trace captured');
    });

    test('should collect resource timing information', async ({ page }, testInfo) => {
      await page.goto(testData.urls.dashboard);
      await loginAsAdmin(page);
      await page.waitForLoadState('networkidle');
      
      const resourceTiming = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources.map(resource => ({
          name: resource.name,
          duration: resource.duration,
          transferSize: resource.transferSize,
          encodedBodySize: resource.encodedBodySize,
          decodedBodySize: resource.decodedBodySize,
          startTime: resource.startTime,
          responseEnd: resource.responseEnd
        }));
      });
      
      await testInfo.attach('resource-timing', {
        body: JSON.stringify(resourceTiming, null, 2),
        contentType: 'application/json'
      });
      
      console.log(`Collected timing for ${resourceTiming.length} resources`);
    });
  });

  // Test environment information
  test.describe('Environment Debugging', () => {
    test('should collect browser and system information', async ({ page, browserName }, testInfo) => {
      const environmentInfo = {
        browser: browserName,
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: page.viewportSize(),
        url: page.url(),
        timestamp: new Date().toISOString(),
        testInfo: {
          title: testInfo.title,
          file: testInfo.file,
          line: testInfo.line,
          column: testInfo.column
        }
      };
      
      await testInfo.attach('environment-info', {
        body: JSON.stringify(environmentInfo, null, 2),
        contentType: 'application/json'
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
      
      console.log(`Test running on ${browserName}`);
    });

    test('should collect application state information', async ({ page }, testInfo) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      const appState = await page.evaluate(() => {
        return {
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          cookies: document.cookie,
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
          visibilityState: document.visibilityState
        };
      });
      
      await testInfo.attach('application-state', {
        body: JSON.stringify(appState, null, 2),
        contentType: 'application/json'
      });
      
      console.log('Application state captured');
    });
  });
});

// Helper function to collect comprehensive debug information
async function collectDebugInformation(page: any, testInfo: any, error: any) {
  console.log('Collecting debug information due to test failure...');
  
  try {
    // Screenshot
    await testInfo.attach('failure-screenshot', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
    
    // Page HTML
    const html = await page.content();
    await testInfo.attach('page-html', {
      body: html,
      contentType: 'text/html'
    });
    
    // Console logs
    const consoleLogs = await page.evaluate(() => {
      return (window as any).__consoleLogs || [];
    });
    
    if (consoleLogs.length > 0) {
      await testInfo.attach('console-logs', {
        body: JSON.stringify(consoleLogs, null, 2),
        contentType: 'application/json'
      });
    }
    
    // Error details
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: page.url(),
      title: await page.title()
    };
    
    await testInfo.attach('error-details', {
      body: JSON.stringify(errorInfo, null, 2),
      contentType: 'application/json'
    });
    
    // Browser context state
    const contextState = {
      cookies: await page.context().cookies(),
      localStorage: await page.evaluate(() => ({ ...localStorage })),
      sessionStorage: await page.evaluate(() => ({ ...sessionStorage }))
    };
    
    await testInfo.attach('context-state', {
      body: JSON.stringify(contextState, null, 2),
      contentType: 'application/json'
    });
    
    console.log('Debug information collection completed');
    
  } catch (debugError) {
    console.error('Failed to collect debug information:', debugError);
  }
}

// Custom reporter example (would be in a separate file)
export class CustomTestReporter {
  onTestEnd(test: any, result: any) {
    const duration = result.duration;
    const status = result.status;
    
    console.log(`Test: ${test.title}`);
    console.log(`Status: ${status}`);
    console.log(`Duration: ${duration}ms`);
    
    if (result.attachments) {
      console.log(`Attachments: ${result.attachments.length}`);
      result.attachments.forEach((attachment: any) => {
        console.log(`  - ${attachment.name} (${attachment.contentType})`);
      });
    }
    
    if (status === 'failed') {
      console.log(`Error: ${result.error?.message}`);
    }
    
    console.log('---');
  }
  
  onEnd(result: any) {
    const { status, startTime, duration } = result;
    const passed = result.stats.passed;
    const failed = result.stats.failed;
    const skipped = result.stats.skipped;
    
    console.log('\n=== Test Run Summary ===');
    console.log(`Status: ${status}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${passed + failed + skipped}`);
    
    if (failed > 0) {
      console.log('\nFailed tests should have debug attachments available.');
    }
  }
}