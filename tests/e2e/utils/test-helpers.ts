import { Page, expect, Locator } from '@playwright/test';
import { testUsers, selectors, urls } from '../fixtures/test-data';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login with test user credentials
   */
  async login(userType: 'admin' | 'user' = 'admin') {
    const user = testUsers[userType];
    
    await this.page.goto(urls.login);
    await this.page.fill(selectors.auth.emailInput, user.email);
    await this.page.fill(selectors.auth.passwordInput, user.password);
    await this.page.click(selectors.auth.loginButton);
    
    // Wait for successful login redirect
    await this.page.waitForURL(urls.dashboard);
    await expect(this.page).toHaveURL(urls.dashboard);
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click(selectors.nav.userMenu);
    await this.page.click(selectors.auth.logoutButton);
    await this.page.waitForURL(urls.login);
  }

  /**
   * Navigate to a specific page
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for element to be visible and ready
   */
  async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout });
    return element;
  }

  /**
   * Fill form field with validation
   */
  async fillField(selector: string, value: string) {
    const field = await this.waitForElement(selector);
    await field.clear();
    await field.fill(value);
    
    // Verify the value was set correctly
    await expect(field).toHaveValue(value);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string) {
    const select = await this.waitForElement(selector);
    await select.selectOption(value);
  }

  /**
   * Click button and wait for action to complete
   */
  async clickAndWait(selector: string, waitForSelector?: string) {
    const button = await this.waitForElement(selector);
    await button.click();
    
    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    }
  }

  /**
   * Handle confirmation dialogs
   */
  async confirmAction() {
    const confirmButton = await this.waitForElement(selectors.modals.confirmButton);
    await confirmButton.click();
  }

  /**
   * Cancel action in dialog
   */
  async cancelAction() {
    const cancelButton = await this.waitForElement(selectors.modals.cancelButton);
    await cancelButton.click();
  }

  /**
   * Search for items in a table
   */
  async searchTable(searchTerm: string, searchSelector = selectors.inventory.searchInput) {
    await this.fillField(searchSelector, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  /**
   * Get table row count
   */
  async getTableRowCount(tableSelector = selectors.tables.table): Promise<number> {
    const rows = this.page.locator(`${tableSelector} ${selectors.tables.tableRow}`);
    return await rows.count();
  }

  /**
   * Select all items in bulk operations
   */
  async selectAllBulkItems() {
    await this.clickAndWait(selectors.inventory.bulkSelectAll);
  }

  /**
   * Perform bulk action
   */
  async performBulkAction(action: string) {
    await this.clickAndWait(selectors.inventory.bulkActions);
    await this.page.click(`[data-testid="bulk-${action}"]`);
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string) {
    const toast = this.page.locator('[data-testid="toast"]');
    await toast.waitFor({ state: 'visible' });
    
    if (message) {
      await expect(toast).toContainText(message);
    }
    
    // Wait for toast to disappear
    await toast.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Scroll element into view
   */
  async scrollIntoView(selector: string) {
    const element = this.page.locator(selector);
    await element.scrollIntoViewIfNeeded();
  }

  /**
   * Get text content of element
   */
  async getTextContent(selector: string): Promise<string> {
    const element = await this.waitForElement(selector);
    return await element.textContent() || '';
  }

  /**
   * Check if page has specific URL
   */
  async expectUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }

  /**
   * Check if page title matches
   */
  async expectTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout = 30000) {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(urlPattern: string | RegExp, response: any) {
    await this.page.route(urlPattern, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  /**
   * Clear all cookies and local storage
   */
  async clearBrowserData() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set viewport size
   */
  async setViewportSize(width: number, height: number) {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Simulate slow network
   */
  async simulateSlowNetwork() {
    await this.page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
  }

  /**
   * Check accessibility violations
   */
  async checkAccessibility() {
    // This would integrate with axe-core or similar accessibility testing library
    // For now, we'll do basic checks
    
    // Check for missing alt text on images
    const images = this.page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (!alt) {
        console.warn(`Image without alt text found: ${await img.getAttribute('src')}`);
      }
    }
    
    // Check for proper heading hierarchy
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      const firstHeading = await headings.first().evaluate(el => el.tagName);
      if (firstHeading !== 'H1') {
        console.warn('Page should start with H1 heading');
      }
    }
  }

  /**
   * Measure page performance
   */
  async measurePerformance() {
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    return performanceMetrics;
  }
}

/**
 * Database cleanup helper
 */
export class DatabaseHelper {
  /**
   * Clean up test data after test
   */
  static async cleanupTestData() {
    // This would connect to your test database and clean up
    // For now, we'll use a placeholder
    console.log('Cleaning up test data...');
  }

  /**
   * Seed test data before test
   */
  static async seedTestData() {
    // This would seed your test database with required data
    console.log('Seeding test data...');
  }
}

/**
 * Custom assertions for E2E tests
 */
export class CustomAssertions {
  constructor(private page: Page) {}

  /**
   * Assert that table contains specific data
   */
  async expectTableToContain(data: string[]) {
    const table = this.page.locator(selectors.tables.table);
    
    for (const item of data) {
      await expect(table).toContainText(item);
    }
  }

  /**
   * Assert that form has validation errors
   */
  async expectFormValidationErrors(fields: string[]) {
    for (const field of fields) {
      const errorMessage = this.page.locator(`[data-testid="${field}-error"]`);
      await expect(errorMessage).toBeVisible();
    }
  }

  /**
   * Assert that metrics cards show expected values
   */
  async expectMetricsCards(expectedMetrics: Record<string, string>) {
    for (const [metric, value] of Object.entries(expectedMetrics)) {
      const metricCard = this.page.locator(`[data-testid="metric-${metric}"]`);
      await expect(metricCard).toContainText(value);
    }
  }
}

/**
 * Convenience functions for common login scenarios
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.login('admin');
}

export async function loginAsUser(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.login('user');
}

export async function loginAsManager(page: Page): Promise<void> {
  // For now, use admin role as manager - in a real app you'd have separate manager role
  const helpers = new TestHelpers(page);
  await helpers.login('admin');
}

export async function loginAsEmployee(page: Page): Promise<void> {
  // For now, use user role as employee - in a real app you'd have separate employee role
  const helpers = new TestHelpers(page);
  await helpers.login('user');
}

/**
 * Convenience function to logout
 */
export async function logout(page: Page): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.logout();
}

/**
 * Check accessibility violations
 */
export async function checkAccessibility(page: Page, pageName?: string): Promise<void> {
  const helpers = new TestHelpers(page);
  await helpers.checkAccessibility();
  
  if (pageName) {
    console.log(`Accessibility check completed for: ${pageName}`);
  }
}

/**
 * Measure page performance
 */
export async function measurePerformance(page: Page, action?: () => Promise<void>): Promise<any> {
  const helpers = new TestHelpers(page);
  
  if (action) {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();
    
    const performanceMetrics = await helpers.measurePerformance();
    
    return {
      ...performanceMetrics,
      loadTime: endTime - startTime
    };
  }
  
  return await helpers.measurePerformance();
}