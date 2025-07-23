import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { selectors, urls } from '../fixtures/test-data';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.dashboard);
    await this.waitForPageLoad();
  }

  async expectDashboardLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(urls.dashboard);
    await this.waitForElement(selectors.dashboard.metricsCards);
    await this.waitForElement(selectors.dashboard.quickActions);
  }

  async getMetricsCardValue(metric: string): Promise<string> {
    const card = this.page.locator(`[data-testid="metric-${metric}"]`);
    await expect(card).toBeVisible();
    return await card.locator('[data-testid="metric-value"]').textContent() || '';
  }

  async expectMetricsCards(): Promise<void> {
    const expectedMetrics = ['total-items', 'low-stock', 'total-value', 'recent-transactions'];
    
    for (const metric of expectedMetrics) {
      const card = this.page.locator(`[data-testid="metric-${metric}"]`);
      await expect(card).toBeVisible();
    }
  }

  async clickQuickAction(action: string): Promise<void> {
    const quickAction = this.page.locator(`[data-testid="quick-action-${action}"]`);
    await expect(quickAction).toBeVisible();
    await quickAction.click();
  }

  async expectQuickActionsVisible(): Promise<void> {
    const quickActions = [
      'add-inventory',
      'quick-stock',
      'create-transaction',
      'view-reports'
    ];

    for (const action of quickActions) {
      const actionButton = this.page.locator(`[data-testid="quick-action-${action}"]`);
      await expect(actionButton).toBeVisible();
    }
  }

  async getRecentActivitiesCount(): Promise<number> {
    const activities = this.page.locator('[data-testid="recent-activity-item"]');
    return await activities.count();
  }

  async expectRecentActivities(): Promise<void> {
    const recentActivities = this.page.locator(selectors.dashboard.recentActivities);
    await expect(recentActivities).toBeVisible();
    
    const activitiesCount = await this.getRecentActivitiesCount();
    expect(activitiesCount).toBeGreaterThan(0);
  }

  async clickRecentActivity(index: number): Promise<void> {
    const activity = this.page.locator('[data-testid="recent-activity-item"]').nth(index);
    await activity.click();
  }

  async getLowStockAlertsCount(): Promise<number> {
    const alerts = this.page.locator('[data-testid="low-stock-alert"]');
    return await alerts.count();
  }

  async expectLowStockAlerts(): Promise<void> {
    const lowStockSection = this.page.locator(selectors.dashboard.lowStockAlerts);
    await expect(lowStockSection).toBeVisible();
  }

  async clickLowStockAlert(index: number): Promise<void> {
    const alert = this.page.locator('[data-testid="low-stock-alert"]').nth(index);
    await alert.click();
  }

  async expectInventoryChart(): Promise<void> {
    const chart = this.page.locator(selectors.dashboard.inventoryChart);
    await expect(chart).toBeVisible();
    
    // Wait for chart to load
    await this.page.waitForTimeout(2000);
    
    // Check if chart has data
    const chartData = this.page.locator('[data-testid="chart-data"]');
    await expect(chartData).toBeVisible();
  }

  async interactWithChart(): Promise<void> {
    const chart = this.page.locator(selectors.dashboard.inventoryChart);
    await expect(chart).toBeVisible();
    
    // Hover over chart elements
    const chartBars = this.page.locator('[data-testid="chart-bar"]');
    const barCount = await chartBars.count();
    
    if (barCount > 0) {
      await chartBars.first().hover();
      
      // Check for tooltip
      const tooltip = this.page.locator('[data-testid="chart-tooltip"]');
      await expect(tooltip).toBeVisible();
    }
  }

  async refreshDashboard(): Promise<void> {
    const refreshButton = this.page.locator('[data-testid="refresh-dashboard"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await this.waitForPageLoad();
    } else {
      await this.page.reload();
      await this.waitForPageLoad();
    }
  }

  async expectDashboardRefreshed(): Promise<void> {
    // Wait for loading indicator to appear and disappear
    const loadingIndicator = this.page.locator('[data-testid="loading-indicator"]');
    
    try {
      await loadingIndicator.waitFor({ state: 'visible', timeout: 2000 });
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading indicator might not appear for fast refreshes
    }
    
    await this.expectDashboardLoaded();
  }

  async navigateToInventory(): Promise<void> {
    await this.clickQuickAction('add-inventory');
    await this.page.waitForURL(urls.inventoryCreate);
  }

  async navigateToQuickStock(): Promise<void> {
    await this.clickQuickAction('quick-stock');
    
    // Should open quick stock modal
    const modal = this.page.locator('[data-testid="quick-stock-modal"]');
    await expect(modal).toBeVisible();
  }

  async checkDashboardResponsiveness(): Promise<void> {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.expectDashboardLoaded();
    
    // Check if mobile navigation is visible
    const mobileNav = this.page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
    
    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.expectDashboardLoaded();
    
    // Test desktop view
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.expectDashboardLoaded();
  }

  async expectDashboardAccessibility(): Promise<void> {
    // Check for proper heading structure
    const mainHeading = this.page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    // Check for ARIA labels on interactive elements
    const quickActionButtons = this.page.locator('[data-testid^="quick-action-"]');
    const buttonCount = await quickActionButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = quickActionButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
    
    // Check for keyboard navigation
    await this.page.keyboard.press('Tab');
    const focusedElement = this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  }

  async testKeyboardNavigation(): Promise<void> {
    // Start from the first focusable element
    await this.page.keyboard.press('Tab');
    
    // Navigate through quick actions
    for (let i = 0; i < 4; i++) {
      const focusedElement = this.page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      await this.page.keyboard.press('Tab');
    }
    
    // Test Enter key on focused element
    const focusedElement = this.page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await this.page.keyboard.press('Enter');
    }
  }

  async measureDashboardPerformance() {
    const startTime = Date.now();
    
    await this.goto();
    await this.expectDashboardLoaded();
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await this.measurePerformance();
    
    return {
      loadTime,
      ...metrics
    };
  }

  async expectPerformanceMetrics(expectedLoadTime: number = 3000): Promise<void> {
    const performance = await this.measureDashboardPerformance();
    
    expect(performance.loadTime).toBeLessThan(expectedLoadTime);
    expect(performance.domContentLoaded).toBeLessThan(2000);
    expect(performance.firstContentfulPaint).toBeLessThan(1500);
  }

  async simulateSlowNetwork(): Promise<void> {
    await this.helpers.simulateSlowNetwork();
    await this.goto();
    await this.expectDashboardLoaded();
  }

  async testDashboardWithLargeDataset(): Promise<void> {
    // Mock API response with large dataset
    await this.helpers.mockApiResponse('**/api/dashboard/metrics', {
      totalItems: 10000,
      lowStockItems: 150,
      totalValue: 5000000,
      recentTransactions: 500
    });
    
    await this.goto();
    await this.expectDashboardLoaded();
    
    // Verify large numbers are displayed correctly
    const totalItems = await this.getMetricsCardValue('total-items');
    expect(totalItems).toContain('10,000');
  }
}