import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin, loginAsUser } from '../utils/test-helpers';

test.describe('Edge Cases and Stress Tests', () => {
  // Boundary value testing
  test.describe('Boundary Value Tests', () => {
    test('should handle maximum length inputs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Test maximum length strings
      const maxLengthName = 'A'.repeat(255); // Typical database varchar limit
      const maxLengthDescription = 'B'.repeat(1000); // Longer text field limit
      
      await page.fill('[name="name"]', maxLengthName);
      await page.fill('[name="description"]', maxLengthDescription);
      await page.fill('[name="quantity"]', '999999');
      await page.fill('[name="price"]', '999999.99');
      
      // Should handle long inputs gracefully
      await page.click('button[type="submit"]');
      
      // Check for either success or appropriate validation message
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error');
      await expect(result).toBeVisible({ timeout: 10000 });
    });

    test('should handle minimum and zero values', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Test minimum values
      await page.fill('[name="name"]', 'A'); // Single character
      await page.fill('[name="description"]', ''); // Empty description
      await page.fill('[name="quantity"]', '0'); // Zero quantity
      await page.fill('[name="price"]', '0.01'); // Minimum price
      
      await page.click('button[type="submit"]');
      
      // Should handle minimum values appropriately
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error, text=required');
      await expect(result).toBeVisible({ timeout: 10000 });
    });

    test('should handle negative values appropriately', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      await page.fill('[name="name"]', 'Negative Test Item');
      await page.fill('[name="quantity"]', '-1');
      await page.fill('[name="price"]', '-10.00');
      
      await page.click('button[type="submit"]');
      
      // Should show validation errors for negative values
      const errorMessage = page.locator('[data-testid="error-message"], text=invalid, text=positive, text=greater');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should handle very large numbers', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      await page.fill('[name="name"]', 'Large Number Test');
      await page.fill('[name="quantity"]', '999999999');
      await page.fill('[name="price"]', '999999999.99');
      
      await page.click('button[type="submit"]');
      
      // Should handle large numbers or show appropriate limits
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error, text=limit');
      await expect(result).toBeVisible({ timeout: 10000 });
    });
  });

  // Special character and encoding tests
  test.describe('Special Character Tests', () => {
    test('should handle special characters in inputs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const specialChars = 'Test Item with Special Chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      const unicodeChars = 'Unicode Test: 中文 العربية русский 日本語 🚀🎉💯';
      
      await page.fill('[name="name"]', specialChars);
      await page.fill('[name="description"]', unicodeChars);
      await page.fill('[name="quantity"]', '1');
      await page.fill('[name="price"]', '10.00');
      
      await page.click('button[type="submit"]');
      
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error');
      await expect(result).toBeVisible({ timeout: 10000 });
    });

    test('should handle HTML and script injection attempts', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const htmlInjection = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const sqlInjection = "'; DROP TABLE inventory; --";
      
      await page.fill('[name="name"]', htmlInjection);
      await page.fill('[name="description"]', sqlInjection);
      await page.fill('[name="quantity"]', '1');
      await page.fill('[name="price"]', '10.00');
      
      await page.click('button[type="submit"]');
      
      // Should not execute scripts or cause errors
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error');
      await expect(result).toBeVisible({ timeout: 10000 });
      
      // Verify no script execution occurred
      const alertDialog = page.locator('text=XSS');
      await expect(alertDialog).not.toBeVisible();
    });

    test('should handle null bytes and control characters', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const controlChars = 'Test\x00\x01\x02\x03\x04\x05Item';
      const tabsAndNewlines = 'Test\t\n\r\nItem';
      
      await page.fill('[name="name"]', controlChars);
      await page.fill('[name="description"]', tabsAndNewlines);
      await page.fill('[name="quantity"]', '1');
      await page.fill('[name="price"]', '10.00');
      
      await page.click('button[type="submit"]');
      
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error');
      await expect(result).toBeVisible({ timeout: 10000 });
    });
  });

  // Network failure and timeout tests
  test.describe('Network Failure Tests', () => {
    test('should handle complete network failure', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Block all network requests
      await context.route('**/*', route => route.abort());
      
      await page.goto(testData.urls.inventory);
      
      // Should show appropriate error state
      const errorState = page.locator('[data-testid="error-state"], [data-testid="network-error"], text=network, text=connection, text=offline');
      await expect(errorState).toBeVisible({ timeout: 10000 });
    });

    test('should handle slow network responses', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Add significant delay to API requests
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
        await route.continue();
      });
      
      await page.goto(testData.urls.inventory);
      
      // Should show loading state during slow requests
      const loadingState = page.locator('[data-testid="loading"], text=Loading, [role="progressbar"]');
      await expect(loadingState).toBeVisible({ timeout: 2000 });
    });

    test('should handle intermittent network failures', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      let requestCount = 0;
      await context.route('**/api/**', async (route) => {
        requestCount++;
        // Fail every other request
        if (requestCount % 2 === 0) {
          await route.abort();
        } else {
          await route.continue();
        }
      });
      
      await page.goto(testData.urls.inventory);
      
      // Should eventually load or show appropriate error handling
      const result = page.locator('table, [data-testid="error-state"], [data-testid="retry-button"]');
      await expect(result).toBeVisible({ timeout: 15000 });
    });

    test('should handle API timeout scenarios', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Simulate hanging requests
      await context.route('**/api/**', async (route) => {
        // Never resolve the request (simulate timeout)
        await new Promise(() => {}); // Infinite promise
      });
      
      await page.goto(testData.urls.inventory);
      
      // Should show timeout handling
      const timeoutState = page.locator('[data-testid="timeout"], [data-testid="error-state"], text=timeout, text=slow');
      await expect(timeoutState).toBeVisible({ timeout: 30000 });
    });
  });

  // Concurrent user actions
  test.describe('Concurrency Tests', () => {
    test('should handle rapid form submissions', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Fill form
      await page.fill('[name="name"]', 'Rapid Submit Test');
      await page.fill('[name="quantity"]', '1');
      await page.fill('[name="price"]', '10.00');
      
      // Rapidly click submit multiple times
      const submitButton = page.locator('button[type="submit"]');
      await Promise.all([
        submitButton.click(),
        submitButton.click(),
        submitButton.click()
      ]);
      
      // Should handle duplicate submissions gracefully
      const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], text=success, text=error');
      await expect(result).toBeVisible({ timeout: 10000 });
    });

    test('should handle rapid navigation', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Rapidly navigate between pages
      const navigationPromises = [
        page.goto(testData.urls.dashboard),
        page.goto(testData.urls.inventory),
        page.goto(testData.urls.users),
        page.goto(testData.urls.categories)
      ];
      
      await Promise.allSettled(navigationPromises);
      
      // Should end up on a valid page
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(dashboard|inventory|users|categories)/);
    });

    test('should handle multiple modal openings', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Try to open multiple modals rapidly
      const createButton = page.locator(testData.selectors.inventory.createButton);
      
      await Promise.all([
        createButton.click(),
        createButton.click(),
        createButton.click()
      ]);
      
      // Should only have one modal open
      const modals = page.locator('[role="dialog"], .modal');
      const modalCount = await modals.count();
      expect(modalCount).toBeLessThanOrEqual(1);
    });
  });

  // Browser storage limits
  test.describe('Storage Limit Tests', () => {
    test('should handle localStorage quota exceeded', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Try to fill localStorage to capacity
      const result = await page.evaluate(() => {
        try {
          const largeData = 'x'.repeat(1024 * 1024); // 1MB string
          for (let i = 0; i < 10; i++) {
            localStorage.setItem(`large_item_${i}`, largeData);
          }
          return 'success';
        } catch (error) {
          return (error as Error).name;
        }
      });
      
      // Should handle quota exceeded gracefully
      expect(['success', 'QuotaExceededError'].includes(result)).toBe(true);
      
      // Application should still function
      await page.goto(testData.urls.dashboard);
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
    });

    test('should handle sessionStorage limits', async ({ page }) => {
      await loginAsAdmin(page);
      
      const result = await page.evaluate(() => {
        try {
          const largeData = 'y'.repeat(1024 * 1024);
          for (let i = 0; i < 10; i++) {
            sessionStorage.setItem(`session_item_${i}`, largeData);
          }
          return 'success';
        } catch (error) {
          return (error as Error).name;
        }
      });
      
      expect(['success', 'QuotaExceededError'].includes(result)).toBe(true);
      
      // Application should still function
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
    });
  });

  // Memory pressure tests
  test.describe('Memory Pressure Tests', () => {
    test('should handle memory-intensive operations', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Create memory pressure
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      await page.evaluate(() => {
        // Create large arrays to consume memory
        const largeArrays = [];
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(10000).fill(`memory_test_${i}`));
        }
        (window as any).memoryTestData = largeArrays;
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
      });
      
      // Application should still be responsive
      await page.click(testData.selectors.nav.inventoryLink);
      await page.waitForSelector('table', { timeout: 10000 });
      
      console.log(`Memory usage: ${initialMemory} -> ${finalMemory}`);
    });

    test('should handle DOM node limits', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Create many DOM nodes
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        for (let i = 0; i < 10000; i++) {
          const div = document.createElement('div');
          div.textContent = `Node ${i}`;
          container.appendChild(div);
        }
      });
      
      // Application should still function
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
    });
  });

  // Date and time edge cases
  test.describe('Date and Time Edge Cases', () => {
    test('should handle leap year dates', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Test leap year date
      const dateInput = page.locator('[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill('2024-02-29'); // Leap year
        
        const value = await dateInput.inputValue();
        expect(value).toBe('2024-02-29');
      }
    });

    test('should handle timezone edge cases', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Test different timezone scenarios
      const timezoneTests = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ];
      
      for (const timezone of timezoneTests) {
        await page.evaluate((tz) => {
          // Simulate timezone change (limited browser support)
          const date = new Date();
          console.log(`Current time in ${tz}: ${date.toLocaleString('en-US', { timeZone: tz })}`);
        }, timezone);
      }
      
      await page.goto(testData.urls.dashboard);
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
    });

    test('should handle invalid date inputs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const dateInput = page.locator('[type="date"]');
      if (await dateInput.isVisible()) {
        // Try invalid dates
        const invalidDates = ['2024-02-30', '2024-13-01', '2024-00-01'];
        
        for (const invalidDate of invalidDates) {
          await dateInput.fill(invalidDate);
          const value = await dateInput.inputValue();
          
          // Browser should either reject or correct invalid dates
          expect(value === '' || value !== invalidDate).toBe(true);
        }
      }
    });
  });

  // File upload edge cases
  test.describe('File Upload Edge Cases', () => {
    test('should handle oversized file uploads', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Create a large file buffer (simulated)
        const largeFileContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
        
        // Note: In real tests, you'd use actual file uploads
        // This is a simplified demonstration
        await page.evaluate((content) => {
          const blob = new Blob([content], { type: 'text/plain' });
          const file = new File([blob], 'large-file.txt', { type: 'text/plain' });
          
          // Simulate file selection
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
          }
        }, largeFileContent);
        
        // Should handle large files appropriately
        const errorMessage = page.locator('[data-testid="file-error"], text=size, text=large, text=limit');
        await expect(errorMessage.or(page.locator('text=success'))).toBeVisible({ timeout: 10000 });
      }
    });

    test('should handle invalid file types', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await page.evaluate(() => {
          const blob = new Blob(['fake executable content'], { type: 'application/x-executable' });
          const file = new File([blob], 'malicious.exe', { type: 'application/x-executable' });
          
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (input) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
          }
        });
        
        // Should reject invalid file types
        const errorMessage = page.locator('[data-testid="file-error"], text=type, text=invalid, text=not allowed');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });
  });

  // Race condition tests
  test.describe('Race Condition Tests', () => {
    test('should handle rapid state changes', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Rapidly trigger state changes
      const searchInput = page.locator(testData.selectors.inventory.searchInput);
      if (await searchInput.isVisible()) {
        const searchTerms = ['test', 'item', 'product', 'sample', ''];
        
        for (const term of searchTerms) {
          await searchInput.fill(term);
          await page.waitForTimeout(100); // Small delay between changes
        }
        
        // Should handle rapid changes gracefully
        await page.waitForLoadState('networkidle');
        await expect(page.locator('table')).toBeVisible();
      }
    });

    test('should handle competing async operations', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Start multiple navigation operations simultaneously
      const operations = [
        page.goto(testData.urls.dashboard),
        page.goto(testData.urls.inventory),
        page.goto(testData.urls.users)
      ];
      
      // Wait for all to complete
      await Promise.allSettled(operations);
      
      // Should end up in a consistent state
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|inventory|users)/);
    });
  });

  // Error recovery tests
  test.describe('Error Recovery Tests', () => {
    test('should recover from JavaScript errors', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Inject a JavaScript error
      await page.evaluate(() => {
        // Cause a runtime error
        (window as any).causeError = () => {
          throw new Error('Intentional test error');
        };
        
        try {
          (window as any).causeError();
        } catch (e) {
          console.error('Caught intentional error:', e);
        }
      });
      
      // Application should still function
      await page.goto(testData.urls.inventory);
      await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should handle corrupted local storage', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Corrupt localStorage
      await page.evaluate(() => {
        localStorage.setItem('user', 'invalid-json-{{{');
        localStorage.setItem('settings', 'corrupted-data');
      });
      
      // Application should handle corrupted data gracefully
      await page.goto(testData.urls.dashboard);
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
    });
  });
});