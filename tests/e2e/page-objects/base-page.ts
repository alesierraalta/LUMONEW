import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

export abstract class BasePage {
  protected helpers: TestHelpers;

  constructor(protected page: Page) {
    this.helpers = new TestHelpers(page);
  }

  /**
   * Navigate to the page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Check if page is loaded
   */
  async isLoaded(): Promise<boolean> {
    try {
      await this.waitForPageLoad();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.helpers.takeScreenshot(name);
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForElement(selector: string, timeout = 10000): Promise<Locator> {
    return await this.helpers.waitForElement(selector, timeout);
  }

  /**
   * Fill form field
   */
  protected async fillField(selector: string, value: string): Promise<void> {
    await this.helpers.fillField(selector, value);
  }

  /**
   * Click element
   */
  protected async click(selector: string): Promise<void> {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  /**
   * Get text content
   */
  protected async getText(selector: string): Promise<string> {
    return await this.helpers.getTextContent(selector);
  }

  /**
   * Check if element exists
   */
  protected async elementExists(selector: string): Promise<boolean> {
    return await this.helpers.elementExists(selector);
  }

  /**
   * Wait for toast notification
   */
  protected async waitForToast(message?: string): Promise<void> {
    await this.helpers.waitForToast(message);
  }

  /**
   * Confirm action in dialog
   */
  protected async confirmAction(): Promise<void> {
    await this.helpers.confirmAction();
  }

  /**
   * Cancel action in dialog
   */
  protected async cancelAction(): Promise<void> {
    await this.helpers.cancelAction();
  }

  /**
   * Search in table
   */
  protected async searchTable(searchTerm: string, searchSelector?: string): Promise<void> {
    await this.helpers.searchTable(searchTerm, searchSelector);
  }

  /**
   * Get table row count
   */
  protected async getTableRowCount(tableSelector?: string): Promise<number> {
    return await this.helpers.getTableRowCount(tableSelector);
  }

  /**
   * Wait for API response
   */
  protected async waitForApiResponse(urlPattern: string | RegExp, timeout = 30000) {
    return await this.helpers.waitForApiResponse(urlPattern, timeout);
  }

  /**
   * Check accessibility
   */
  async checkAccessibility(): Promise<void> {
    await this.helpers.checkAccessibility();
  }

  /**
   * Measure performance
   */
  async measurePerformance() {
    return await this.helpers.measurePerformance();
  }
}