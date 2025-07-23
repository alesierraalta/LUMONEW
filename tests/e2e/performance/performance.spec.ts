import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin, loginAsUser } from '../utils/test-helpers';

test.describe('Performance Tests', () => {
  // Page load performance tests
  test.describe('Page Load Performance', () => {
    test('should load login page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(testData.urls.login);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Login page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`Login page loaded in ${loadTime}ms`);
    });

    test('should load dashboard within acceptable time after login', async ({ page }) => {
      await loginAsAdmin(page);
      
      const startTime = Date.now();
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 2 seconds for authenticated users
      expect(loadTime).toBeLessThan(2000);
      
      console.log(`Dashboard loaded in ${loadTime}ms`);
    });

    test('should load inventory page within acceptable time', async ({ page }) => {
      await loginAsAdmin(page);
      
      const startTime = Date.now();
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Inventory page with data should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`Inventory page loaded in ${loadTime}ms`);
    });

    test('should load user management page within acceptable time', async ({ page }) => {
      await loginAsAdmin(page);
      
      const startTime = Date.now();
      await page.goto(testData.urls.users);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Users page should load within 2.5 seconds
      expect(loadTime).toBeLessThan(2500);
      
      console.log(`Users page loaded in ${loadTime}ms`);
    });
  });

  // Core Web Vitals tests
  test.describe('Core Web Vitals', () => {
    test('should have acceptable First Contentful Paint (FCP)', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      const fcpMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      if (fcpMetric) {
        // FCP should be under 1.8 seconds (good threshold)
        expect(fcpMetric).toBeLessThan(1800);
        console.log(`First Contentful Paint: ${fcpMetric}ms`);
      }
    });

    test('should have acceptable Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto(testData.urls.dashboard);
      await loginAsAdmin(page);
      
      const lcpMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 10000);
        });
      });
      
      if (lcpMetric) {
        // LCP should be under 2.5 seconds (good threshold)
        expect(lcpMetric).toBeLessThan(2500);
        console.log(`Largest Contentful Paint: ${lcpMetric}ms`);
      }
    });

    test('should have minimal Cumulative Layout Shift (CLS)', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Wait for page to fully load and settle
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const clsMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Resolve after a delay to capture layout shifts
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      // CLS should be under 0.1 (good threshold)
      expect(clsMetric).toBeLessThan(0.1);
      console.log(`Cumulative Layout Shift: ${clsMetric}`);
    });

    test('should have acceptable Time to Interactive (TTI)', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(testData.urls.login);
      
      // Wait for page to be interactive
      await page.waitForLoadState('networkidle');
      
      // Test interactivity by clicking a button
      await page.click(testData.selectors.auth.emailInput);
      await page.type(testData.selectors.auth.emailInput, 'test');
      
      const ttiTime = Date.now() - startTime;
      
      // TTI should be under 3.8 seconds (good threshold)
      expect(ttiTime).toBeLessThan(3800);
      console.log(`Time to Interactive: ${ttiTime}ms`);
    });
  });

  // Network performance tests
  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto(testData.urls.login);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time on slow network
      expect(loadTime).toBeLessThan(8000);
      console.log(`Page loaded on slow network in ${loadTime}ms`);
    });

    test('should handle network failures gracefully', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Block API requests to simulate network failure
      await context.route('**/api/**', route => route.abort());
      
      await page.goto(testData.urls.inventory);
      
      // Should show loading state or error state
      const loadingOrError = page.locator('[data-testid="loading"], [data-testid="error"], text=Loading, text=Error');
      await expect(loadingOrError).toBeVisible({ timeout: 5000 });
      
      console.log('Network failure handled gracefully');
    });

    test('should optimize resource loading', async ({ page }) => {
      // Monitor network requests
      const requests: any[] = [];
      page.on('request', request => {
        requests.push({
          url: request.url(),
          resourceType: request.resourceType(),
          size: 0
        });
      });
      
      page.on('response', response => {
        const request = requests.find(req => req.url === response.url());
        if (request) {
          request.size = response.headers()['content-length'] || 0;
        }
      });
      
      await page.goto(testData.urls.dashboard);
      await loginAsAdmin(page);
      await page.waitForLoadState('networkidle');
      
      // Analyze requests
      const imageRequests = requests.filter(req => req.resourceType === 'image');
      const jsRequests = requests.filter(req => req.resourceType === 'script');
      const cssRequests = requests.filter(req => req.resourceType === 'stylesheet');
      
      console.log(`Network requests: ${requests.length} total`);
      console.log(`Images: ${imageRequests.length}, JS: ${jsRequests.length}, CSS: ${cssRequests.length}`);
      
      // Should not have excessive requests
      expect(requests.length).toBeLessThan(50);
    });
  });

  // Memory performance tests
  test.describe('Memory Performance', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Navigate through multiple pages
      const pages = [
        testData.urls.dashboard,
        testData.urls.inventory,
        testData.urls.users,
        testData.urls.categories,
        testData.urls.locations
      ];
      
      for (const url of pages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        console.log(`Memory usage: ${initialMemory} -> ${finalMemory} (${memoryIncreasePercent.toFixed(2)}% increase)`);
        
        // Memory increase should be reasonable (less than 50% increase)
        expect(memoryIncreasePercent).toBeLessThan(50);
      }
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await loginAsAdmin(page);
      
      const startTime = Date.now();
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Simulate loading more data (pagination)
      const paginationNext = page.locator('[data-testid="pagination-next"]').or(page.locator('button:has-text("Next")'));
      let pageCount = 0;
      
      while (await paginationNext.isVisible() && pageCount < 5) {
        await paginationNext.click();
        await page.waitForLoadState('networkidle');
        pageCount++;
      }
      
      const loadTime = Date.now() - startTime;
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      console.log(`Loaded ${pageCount + 1} pages in ${loadTime}ms`);
      
      if (initialMemory && finalMemory) {
        const memoryIncrease = finalMemory - initialMemory;
        console.log(`Memory increase: ${memoryIncrease} bytes`);
        
        // Memory increase should be reasonable for the amount of data loaded
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
      }
      
      // Should load multiple pages within reasonable time
      expect(loadTime).toBeLessThan(15000);
    });
  });

  // JavaScript performance tests
  test.describe('JavaScript Performance', () => {
    test('should have fast JavaScript execution times', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Measure JavaScript execution time for common operations
      const executionTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate common DOM operations
        for (let i = 0; i < 1000; i++) {
          const div = document.createElement('div');
          div.textContent = `Item ${i}`;
          document.body.appendChild(div);
          document.body.removeChild(div);
        }
        
        return performance.now() - start;
      });
      
      // JavaScript operations should be fast
      expect(executionTime).toBeLessThan(100); // 100ms for 1000 operations
      console.log(`JavaScript execution time: ${executionTime}ms`);
    });

    test('should handle form interactions efficiently', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const startTime = Date.now();
      
      // Fill form fields rapidly
      await page.fill('[name="name"]', 'Performance Test Item');
      await page.fill('[name="description"]', 'Testing form performance with a longer description that includes multiple words and sentences to simulate real user input.');
      await page.fill('[name="quantity"]', '100');
      await page.fill('[name="price"]', '29.99');
      
      // Test dropdown interaction
      const categorySelect = page.locator('select[name="category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
      }
      
      const formInteractionTime = Date.now() - startTime;
      
      // Form interactions should be responsive
      expect(formInteractionTime).toBeLessThan(1000);
      console.log(`Form interaction time: ${formInteractionTime}ms`);
    });

    test('should handle table operations efficiently', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      const startTime = Date.now();
      
      // Test sorting if available
      const sortableHeaders = page.locator('th[role="button"], th button, th a');
      const headerCount = await sortableHeaders.count();
      
      if (headerCount > 0) {
        await sortableHeaders.first().click();
        await page.waitForLoadState('networkidle');
      }
      
      // Test filtering if available
      const searchInput = page.locator(testData.selectors.inventory.searchInput);
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for debounced search
      }
      
      const tableOperationTime = Date.now() - startTime;
      
      // Table operations should be responsive
      expect(tableOperationTime).toBeLessThan(2000);
      console.log(`Table operation time: ${tableOperationTime}ms`);
    });
  });

  // Bundle size and asset optimization tests
  test.describe('Asset Optimization', () => {
    test('should have optimized bundle sizes', async ({ page }) => {
      const resourceSizes: { [key: string]: number } = {};
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentLength = response.headers()['content-length'];
        
        if (contentLength) {
          resourceSizes[url] = parseInt(contentLength);
        }
      });
      
      await page.goto(testData.urls.login);
      await page.waitForLoadState('networkidle');
      
      // Check JavaScript bundle sizes
      const jsFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.js'));
      const totalJsSize = jsFiles.reduce((total, url) => total + (resourceSizes[url] || 0), 0);
      
      // Check CSS bundle sizes
      const cssFiles = Object.keys(resourceSizes).filter(url => url.endsWith('.css'));
      const totalCssSize = cssFiles.reduce((total, url) => total + (resourceSizes[url] || 0), 0);
      
      console.log(`Total JS size: ${(totalJsSize / 1024).toFixed(2)}KB`);
      console.log(`Total CSS size: ${(totalCssSize / 1024).toFixed(2)}KB`);
      
      // Bundle sizes should be reasonable
      expect(totalJsSize).toBeLessThan(2 * 1024 * 1024); // 2MB JS limit
      expect(totalCssSize).toBeLessThan(500 * 1024); // 500KB CSS limit
    });

    test('should use efficient image formats and sizes', async ({ page }) => {
      const imageRequests: any[] = [];
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'];
        
        if (contentType && contentType.startsWith('image/')) {
          imageRequests.push({
            url,
            contentType,
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      for (const image of imageRequests) {
        console.log(`Image: ${image.url} (${image.contentType}, ${(image.size / 1024).toFixed(2)}KB)`);
        
        // Images should be reasonably sized
        expect(image.size).toBeLessThan(1024 * 1024); // 1MB per image limit
        
        // Should prefer modern formats
        const isModernFormat = ['image/webp', 'image/avif', 'image/svg+xml'].includes(image.contentType);
        const isLegacyFormat = ['image/jpeg', 'image/png'].includes(image.contentType);
        
        expect(isModernFormat || isLegacyFormat).toBe(true);
      }
    });
  });

  // Database query performance simulation
  test.describe('Data Loading Performance', () => {
    test('should handle concurrent data requests efficiently', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Monitor API requests
      const apiRequests: any[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiRequests.push({
            url: request.url(),
            startTime: Date.now()
          });
        }
      });
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const request = apiRequests.find(req => req.url === response.url());
          if (request) {
            request.responseTime = Date.now() - request.startTime;
          }
        }
      });
      
      // Load multiple pages that make API requests
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      await page.goto(testData.urls.inventory);
      await page.waitForLoadState('networkidle');
      
      // Analyze API performance
      const completedRequests = apiRequests.filter(req => req.responseTime);
      const averageResponseTime = completedRequests.reduce((sum, req) => sum + req.responseTime, 0) / completedRequests.length;
      
      console.log(`API requests: ${completedRequests.length}, Average response time: ${averageResponseTime.toFixed(2)}ms`);
      
      // API responses should be fast
      expect(averageResponseTime).toBeLessThan(1000);
      
      // Should not have too many concurrent requests
      expect(completedRequests.length).toBeLessThan(20);
    });

    test('should handle pagination efficiently', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for initial load
      await page.waitForSelector('table', { timeout: 10000 });
      
      const paginationTimes: number[] = [];
      const paginationNext = page.locator('[data-testid="pagination-next"]').or(page.locator('button:has-text("Next")'));
      
      let pageCount = 0;
      while (await paginationNext.isVisible() && pageCount < 3) {
        const startTime = Date.now();
        await paginationNext.click();
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        paginationTimes.push(loadTime);
        pageCount++;
      }
      
      if (paginationTimes.length > 0) {
        const averagePaginationTime = paginationTimes.reduce((sum, time) => sum + time, 0) / paginationTimes.length;
        console.log(`Average pagination time: ${averagePaginationTime.toFixed(2)}ms`);
        
        // Pagination should be fast
        expect(averagePaginationTime).toBeLessThan(1500);
      }
    });
  });
});

// Performance monitoring utilities
test.describe('Performance Monitoring', () => {
  test('should collect comprehensive performance metrics', async ({ page }, testInfo) => {
    await page.goto(testData.urls.login);
    await loginAsAdmin(page);
    await page.goto(testData.urls.dashboard);
    await page.waitForLoadState('networkidle');
    
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // Paint timing
        firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
        
        // Resource timing
        resourceCount: performance.getEntriesByType('resource').length,
        
        // Memory (if available)
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      };
    });
    
    // Attach performance metrics to test results
    await testInfo.attach('performance-metrics', {
      body: JSON.stringify(performanceMetrics, null, 2),
      contentType: 'application/json'
    });
    
    console.log('Performance Metrics:', performanceMetrics);
    
    // Basic performance assertions
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(2000);
    expect(performanceMetrics.resourceCount).toBeLessThan(100);
  });
});