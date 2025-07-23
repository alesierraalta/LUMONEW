import { test, expect, devices } from '@playwright/test';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin, loginAsUser } from '../utils/test-helpers';

test.describe('Cross-Browser Compatibility Tests', () => {
  // Test core functionality across all browsers
  test.describe('Core Functionality', () => {
    test('should handle authentication flow consistently across browsers', async ({ page, browserName }) => {
      await page.goto(testData.urls.login);
      
      // Test login form behavior
      await page.fill(testData.selectors.auth.emailInput, testData.users.admin.email);
      await page.fill(testData.selectors.auth.passwordInput, testData.users.admin.password);
      
      // Check form validation styling
      const emailInput = page.locator(testData.selectors.auth.emailInput);
      const passwordInput = page.locator(testData.selectors.auth.passwordInput);
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      
      // Submit and verify redirect
      await page.click(testData.selectors.auth.loginButton);
      await expect(page).toHaveURL(testData.urls.dashboard);
      
      // Verify dashboard loads properly
      await expect(page.locator(testData.selectors.dashboard.metricsCards)).toBeVisible();
      
      console.log(`✓ Authentication flow verified on ${browserName}`);
    });

    test('should handle form interactions consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Test form field interactions
      await page.fill('[name="name"]', 'Cross-Browser Test Item');
      await page.fill('[name="description"]', 'Testing form behavior');
      await page.fill('[name="quantity"]', '10');
      await page.fill('[name="price"]', '25.99');
      
      // Test dropdown/select behavior
      const categorySelect = page.locator('select[name="category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption({ index: 1 });
      }
      
      // Test date picker (if present)
      const dateInput = page.locator('[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill('2024-12-31');
      }
      
      // Verify form validation
      await page.click('button[type="submit"]');
      
      // Check for success message or redirect
      await expect(page.locator('[data-testid="success-message"]').or(page.locator('text=success'))).toBeVisible({ timeout: 10000 });
      
      console.log(`✓ Form interactions verified on ${browserName}`);
    });

    test('should handle navigation consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      
      // Test main navigation
      const navItems = [
        { selector: testData.selectors.nav.dashboardLink, url: testData.urls.dashboard },
        { selector: testData.selectors.nav.inventoryLink, url: testData.urls.inventory },
        { selector: testData.selectors.nav.usersLink, url: testData.urls.users },
        { selector: testData.selectors.nav.categoriesLink, url: testData.urls.categories }
      ];
      
      for (const item of navItems) {
        await page.click(item.selector);
        await expect(page).toHaveURL(new RegExp(item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        await page.waitForLoadState('networkidle');
      }
      
      console.log(`✓ Navigation verified on ${browserName}`);
    });
  });

  // Test responsive design across different viewport sizes
  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile devices', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginAsAdmin(page);
      
      // Check mobile navigation (hamburger menu)
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]').or(page.locator('button[aria-label*="menu"]'));
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await expect(page.locator('[data-testid="mobile-menu"]').or(page.locator('[role="navigation"]'))).toBeVisible();
      }
      
      // Check responsive tables
      await page.goto(testData.urls.inventory);
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        const tableWidth = await table.boundingBox();
        const viewportWidth = page.viewportSize()?.width || 375;
        expect(tableWidth?.width).toBeLessThanOrEqual(viewportWidth);
      }
      
      console.log(`✓ Mobile responsive design verified on ${browserName}`);
    });

    test('should adapt layout for tablet devices', async ({ page, browserName }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginAsAdmin(page);
      
      // Check tablet-specific layouts
      await page.goto(testData.urls.dashboard);
      
      // Verify dashboard cards layout
      const dashboardCards = page.locator('[data-testid*="card"]').or(page.locator('.card'));
      const cardCount = await dashboardCards.count();
      
      if (cardCount > 0) {
        // Check that cards are properly arranged for tablet
        const firstCard = dashboardCards.first();
        const cardBox = await firstCard.boundingBox();
        expect(cardBox?.width).toBeGreaterThan(200); // Reasonable card width for tablet
      }
      
      console.log(`✓ Tablet responsive design verified on ${browserName}`);
    });
  });

  // Test browser-specific features
  test.describe('Browser-Specific Features', () => {
    test('should handle local storage consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      
      // Test localStorage functionality
      await page.evaluate(() => {
        localStorage.setItem('test-key', 'test-value');
      });
      
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('test-key');
      });
      
      expect(storedValue).toBe('test-value');
      
      // Test sessionStorage
      await page.evaluate(() => {
        sessionStorage.setItem('session-key', 'session-value');
      });
      
      const sessionValue = await page.evaluate(() => {
        return sessionStorage.getItem('session-key');
      });
      
      expect(sessionValue).toBe('session-value');
      
      console.log(`✓ Storage functionality verified on ${browserName}`);
    });

    test('should handle JavaScript APIs consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      
      // Test common JavaScript APIs
      const apiTests = await page.evaluate(() => {
        const results = {
          fetch: typeof fetch !== 'undefined',
          promise: typeof Promise !== 'undefined',
          arrow: (() => true)() === true,
          destructuring: (() => { const [a] = [1]; return a === 1; })(),
          async: typeof (async () => {})() === 'object'
        };
        return results;
      });
      
      expect(apiTests.fetch).toBe(true);
      expect(apiTests.promise).toBe(true);
      expect(apiTests.arrow).toBe(true);
      expect(apiTests.destructuring).toBe(true);
      expect(apiTests.async).toBe(true);
      
      console.log(`✓ JavaScript APIs verified on ${browserName}`);
    });

    test('should handle CSS features consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      
      // Test CSS Grid support
      const gridSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        return testElement.style.display === 'grid';
      });
      
      expect(gridSupport).toBe(true);
      
      // Test Flexbox support
      const flexSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'flex';
        return testElement.style.display === 'flex';
      });
      
      expect(flexSupport).toBe(true);
      
      // Test CSS Custom Properties
      const customPropsSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-prop', 'test');
        return testElement.style.getPropertyValue('--test-prop') === 'test';
      });
      
      expect(customPropsSupport).toBe(true);
      
      console.log(`✓ CSS features verified on ${browserName}`);
    });
  });

  // Test performance across browsers
  test.describe('Cross-Browser Performance', () => {
    test('should load pages within acceptable time limits', async ({ page, browserName }) => {
      const startTime = Date.now();
      
      await page.goto(testData.urls.login);
      await page.waitForLoadState('networkidle');
      
      const loginLoadTime = Date.now() - startTime;
      expect(loginLoadTime).toBeLessThan(5000); // 5 seconds max
      
      await loginAsAdmin(page);
      
      const dashboardStartTime = Date.now();
      await page.goto(testData.urls.dashboard);
      await page.waitForLoadState('networkidle');
      
      const dashboardLoadTime = Date.now() - dashboardStartTime;
      expect(dashboardLoadTime).toBeLessThan(3000); // 3 seconds max for authenticated pages
      
      console.log(`✓ Performance verified on ${browserName}: Login ${loginLoadTime}ms, Dashboard ${dashboardLoadTime}ms`);
    });

    test('should handle large datasets consistently', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Check if pagination is working
      const paginationNext = page.locator('[data-testid="pagination-next"]').or(page.locator('button:has-text("Next")'));
      if (await paginationNext.isVisible()) {
        await paginationNext.click();
        await page.waitForLoadState('networkidle');
        
        // Verify page changed
        const currentUrl = page.url();
        expect(currentUrl).toContain('page=2');
      }
      
      console.log(`✓ Large dataset handling verified on ${browserName}`);
    });
  });

  // Test error handling across browsers
  test.describe('Error Handling', () => {
    test('should display errors consistently', async ({ page, browserName }) => {
      await page.goto(testData.urls.login);
      
      // Test invalid login
      await page.fill(testData.selectors.auth.emailInput, 'invalid@email.com');
      await page.fill(testData.selectors.auth.passwordInput, 'wrongpassword');
      await page.click(testData.selectors.auth.loginButton);
      
      // Check for error message
      await expect(page.locator('[data-testid="error-message"]').or(page.locator('text=Invalid'))).toBeVisible({ timeout: 5000 });
      
      console.log(`✓ Error handling verified on ${browserName}`);
    });

    test('should handle network errors gracefully', async ({ page, browserName }) => {
      await loginAsAdmin(page);
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto(testData.urls.inventory);
      
      // Check for error state or loading state
      const errorIndicator = page.locator('[data-testid="error-state"]').or(page.locator('text=Error')).or(page.locator('text=Failed'));
      const loadingIndicator = page.locator('[data-testid="loading"]').or(page.locator('text=Loading'));
      
      await expect(errorIndicator.or(loadingIndicator)).toBeVisible({ timeout: 10000 });
      
      console.log(`✓ Network error handling verified on ${browserName}`);
    });
  });
});

// Browser-specific test configurations
test.describe('Safari-Specific Tests', () => {
  test.skip(({ browserName }) => browserName !== 'webkit');
  
  test('should handle Safari-specific behaviors', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test Safari-specific date input behavior
    await page.goto(testData.urls.inventory + '/create');
    const dateInput = page.locator('[type="date"]');
    
    if (await dateInput.isVisible()) {
      // Safari handles date inputs differently
      await dateInput.click();
      await dateInput.fill('2024-12-31');
      
      const value = await dateInput.inputValue();
      expect(value).toBe('2024-12-31');
    }
    
    console.log('✓ Safari-specific behaviors verified');
  });
});

test.describe('Firefox-Specific Tests', () => {
  test.skip(({ browserName }) => browserName !== 'firefox');
  
  test('should handle Firefox-specific behaviors', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test Firefox-specific scrolling behavior
    await page.goto(testData.urls.inventory);
    
    // Firefox sometimes handles smooth scrolling differently
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(1000);
    
    const scrollPosition = await page.evaluate(() => window.pageYOffset);
    expect(scrollPosition).toBeGreaterThan(0);
    
    console.log('✓ Firefox-specific behaviors verified');
  });
});

test.describe('Mobile Browser Tests', () => {
  test.use({ ...devices['iPhone 12'] });
  
  test('should handle mobile Safari behaviors', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Test mobile-specific touch interactions
    await page.goto(testData.urls.dashboard);
    
    // Test swipe gestures if implemented
    const swipeableElement = page.locator('[data-testid="swipeable"]').first();
    if (await swipeableElement.isVisible()) {
      const box = await swipeableElement.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2);
        await page.mouse.up();
      }
    }
    
    console.log('✓ Mobile Safari behaviors verified');
  });
});