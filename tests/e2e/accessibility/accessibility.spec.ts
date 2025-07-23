import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin, loginAsUser } from '../utils/test-helpers';

test.describe('Accessibility Tests', () => {
  // Full page accessibility scans
  test.describe('Full Page Accessibility Scans', () => {
    test('should not have accessibility violations on login page', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations on dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations on inventory page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations on users page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.users);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations on categories page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.categories);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility violations on locations page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.locations);
      
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  // WCAG 2.1 AA compliance tests
  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should meet WCAG 2.1 AA standards on dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should meet WCAG 2.1 AA standards on forms', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should meet WCAG 2.1 AA standards on data tables', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .include('table')
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  // Keyboard navigation tests
  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation on login form', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator(testData.selectors.auth.emailInput)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(testData.selectors.auth.passwordInput)).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(testData.selectors.auth.loginButton)).toBeFocused();
      
      // Test form submission with Enter key
      await page.fill(testData.selectors.auth.emailInput, testData.users.admin.email);
      await page.fill(testData.selectors.auth.passwordInput, testData.users.admin.password);
      await page.keyboard.press('Enter');
      
      await expect(page).toHaveURL(testData.urls.dashboard);
    });

    test('should support keyboard navigation in main navigation', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Test navigation with keyboard
      await page.keyboard.press('Tab');
      
      // Find the first focusable navigation element
      const firstNavElement = page.locator('nav a, nav button').first();
      await expect(firstNavElement).toBeFocused();
      
      // Navigate through menu items
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      // Verify navigation occurred
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toBe(testData.urls.dashboard);
    });

    test('should support keyboard navigation in data tables', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Tab to first table row
      await page.keyboard.press('Tab');
      const firstRow = page.locator('table tbody tr').first();
      
      // Check if row or its action buttons are focusable
      const focusableElements = page.locator('table tbody tr:first-child button, table tbody tr:first-child a');
      const count = await focusableElements.count();
      
      if (count > 0) {
        await expect(focusableElements.first()).toBeFocused();
      }
    });

    test('should support keyboard navigation in modals', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Open a modal (create new item)
      await page.click(testData.selectors.inventory.createButton);
      
      // Wait for modal to appear
      const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
      await expect(modal).toBeVisible();
      
      // Test Escape key closes modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  // Screen reader compatibility tests
  test.describe('Screen Reader Compatibility', () => {
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Check for ARIA labels on buttons
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const textContent = await button.textContent();
        
        // Button should have either aria-label or text content
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Check heading hierarchy (h1, h2, h3, etc.)
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);
        
        // Check for proper nesting (simplified check)
        const firstHeading = headings.first();
        const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
        expect(['h1', 'h2'].includes(tagName)).toBe(true);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Check that form inputs have associated labels
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="number"], textarea, select');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 10); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        if (id) {
          // Check for associated label
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // Input should have label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should have proper table headers', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      // Check for table headers
      const tables = page.locator('table');
      const tableCount = await tables.count();
      
      for (let i = 0; i < tableCount; i++) {
        const table = tables.nth(i);
        const headers = table.locator('th');
        const headerCount = await headers.count();
        
        if (headerCount > 0) {
          // Check that headers have proper scope or other attributes
          for (let j = 0; j < headerCount; j++) {
            const header = headers.nth(j);
            const scope = await header.getAttribute('scope');
            const textContent = await header.textContent();
            
            // Header should have scope attribute or text content
            expect(scope || textContent?.trim()).toBeTruthy();
          }
        }
      }
    });
  });

  // ARIA snapshot tests for consistent accessibility tree
  test.describe('ARIA Snapshots', () => {
    test('should maintain consistent accessibility tree for navigation', async ({ page }) => {
      await loginAsAdmin(page);
      
      const navigation = page.locator('nav').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toMatchAriaSnapshot(`
          - navigation:
            - link /Dashboard|Home/
            - link /Inventory/
            - link /Users/
            - link /Categories/
            - link /Locations/
        `);
      }
    });

    test('should maintain consistent accessibility tree for data tables', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });
      
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        // Basic table structure check
        await expect(table).toMatchAriaSnapshot(`
          - table:
            - rowgroup:
              - row:
                - columnheader /Name|Item/
                - columnheader /Quantity|Stock/
                - columnheader /Price|Cost/
                - columnheader /Actions/
        `);
      }
    });
  });

  // Focus management tests
  test.describe('Focus Management', () => {
    test('should manage focus properly in modals', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Open modal
      await page.click(testData.selectors.inventory.createButton);
      
      const modal = page.locator('[role="dialog"]').or(page.locator('.modal'));
      await expect(modal).toBeVisible();
      
      // Focus should be trapped within modal
      const firstFocusableElement = modal.locator('input, button, select, textarea, [tabindex]:not([tabindex="-1"])').first();
      if (await firstFocusableElement.isVisible()) {
        await expect(firstFocusableElement).toBeFocused();
      }
      
      // Close modal and check focus returns
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      
      // Focus should return to trigger element
      await expect(page.locator(testData.selectors.inventory.createButton)).toBeFocused();
    });

    test('should maintain focus visibility', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Check that focused elements have visible focus indicators
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        // Check for focus styles (outline, box-shadow, etc.)
        const styles = await focusedElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            outline: computed.outline,
            outlineWidth: computed.outlineWidth,
            boxShadow: computed.boxShadow
          };
        });
        
        // Should have some form of focus indicator
        const hasFocusIndicator = 
          styles.outline !== 'none' || 
          styles.outlineWidth !== '0px' || 
          styles.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });
  });

  // Color contrast and visual accessibility
  test.describe('Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Use axe-core to check color contrast
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .withRules(['color-contrast'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not rely solely on color for information', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Check for color-only information using axe-core
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withRules(['color-contrast', 'link-in-text-block'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  // Mobile accessibility
  test.describe('Mobile Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } });
    
    test('should be accessible on mobile devices', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper touch target sizes', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Check touch target sizes (minimum 44x44px)
      const buttons = page.locator('button, a, input[type="button"], input[type="submit"]');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Touch targets should be at least 44x44px
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  // Error and status message accessibility
  test.describe('Error and Status Messages', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      // Trigger validation error
      await page.fill(testData.selectors.auth.emailInput, 'invalid-email');
      await page.fill(testData.selectors.auth.passwordInput, 'wrong');
      await page.click(testData.selectors.auth.loginButton);
      
      // Check for ARIA live regions or proper error announcements
      const errorMessage = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should announce success messages to screen readers', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Fill and submit form
      await page.fill('[name="name"]', 'Accessibility Test Item');
      await page.fill('[name="description"]', 'Testing accessibility');
      await page.fill('[name="quantity"]', '1');
      await page.fill('[name="price"]', '10.00');
      
      await page.click('button[type="submit"]');
      
      // Check for success announcement
      const successMessage = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    });
  });
});

// Custom accessibility test fixture
test.describe('Custom Accessibility Fixture Tests', () => {
  // Create a custom fixture for AxeBuilder with shared configuration
  const makeAxeBuilder = (page: any) => {
    return new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#third-party-widget'); // Exclude third-party content
  };

  test('should use custom AxeBuilder configuration', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(testData.urls.dashboard);
    
    const accessibilityScanResults = await makeAxeBuilder(page).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should scan specific components', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(testData.urls.inventory);
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    const accessibilityScanResults = await makeAxeBuilder(page)
      .include('table')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should attach accessibility scan results for debugging', async ({ page }, testInfo) => {
    await loginAsAdmin(page);
    await page.goto(testData.urls.dashboard);
    
    const accessibilityScanResults = await makeAxeBuilder(page).analyze();
    
    // Attach full results for debugging
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json'
    });
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});