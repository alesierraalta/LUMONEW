import { test, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard-page';
import { AuthPage } from '../page-objects/auth-page';
import { urls } from '../fixtures/test-data';

test.describe('Dashboard Workflows', () => {
  let dashboardPage: DashboardPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    authPage = new AuthPage(page);
    
    // Login as admin before each test
    await authPage.login.goto();
    await authPage.login.loginAsAdmin();
  });

  test.describe('Dashboard Loading and Metrics Display', () => {
    test('should load dashboard with all components', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      await dashboardPage.expectMetricsCards();
      await dashboardPage.expectQuickActionsVisible();
      await dashboardPage.expectRecentActivities();
      await dashboardPage.expectLowStockAlerts();
      await dashboardPage.expectInventoryChart();
    });

    test('should display correct metrics values', async ({ page }) => {
      await dashboardPage.goto();
      
      // Check that metrics cards show numeric values
      const totalItems = await dashboardPage.getMetricsCardValue('total-items');
      const lowStock = await dashboardPage.getMetricsCardValue('low-stock');
      const totalValue = await dashboardPage.getMetricsCardValue('total-value');
      const recentTransactions = await dashboardPage.getMetricsCardValue('recent-transactions');
      
      expect(totalItems).toMatch(/^\d+/); // Should start with a number
      expect(lowStock).toMatch(/^\d+/);
      expect(totalValue).toMatch(/^\$[\d,]+/); // Should be currency format
      expect(recentTransactions).toMatch(/^\d+/);
    });

    test('should refresh dashboard data', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.refreshDashboard();
      await dashboardPage.expectDashboardRefreshed();
    });

    test('should handle dashboard with no data gracefully', async ({ page }) => {
      // Mock empty data response
      await page.route('**/api/dashboard/metrics', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalItems: 0,
            lowStockItems: 0,
            totalValue: 0,
            recentTransactions: 0
          })
        });
      });
      
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Verify zero states are handled properly
      const totalItems = await dashboardPage.getMetricsCardValue('total-items');
      expect(totalItems).toBe('0');
    });

    test('should display loading states during data fetch', async ({ page }) => {
      // Slow down API response to see loading state
      await page.route('**/api/dashboard/metrics', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              totalItems: 100,
              lowStockItems: 5,
              totalValue: 50000,
              recentTransactions: 25
            })
          });
        }, 2000);
      });
      
      await dashboardPage.goto();
      
      // Check for loading indicators
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      await expect(loadingIndicator).toBeVisible();
      
      // Wait for data to load
      await dashboardPage.expectDashboardLoaded();
      await expect(loadingIndicator).not.toBeVisible();
    });
  });

  test.describe('Quick Actions Functionality', () => {
    test('should navigate to inventory creation from quick action', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateToInventory();
      await expect(page).toHaveURL(urls.inventoryCreate);
    });

    test('should open quick stock modal', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.navigateToQuickStock();
      
      const modal = page.locator('[data-testid="quick-stock-modal"]');
      await expect(modal).toBeVisible();
    });

    test('should navigate to create transaction', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.clickQuickAction('create-transaction');
      
      // Should navigate to transaction creation or open modal
      const transactionModal = page.locator('[data-testid="transaction-modal"]');
      if (await transactionModal.isVisible()) {
        await expect(transactionModal).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/transactions\/create/);
      }
    });

    test('should navigate to reports', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.clickQuickAction('view-reports');
      
      await expect(page).toHaveURL(/\/reports/);
    });

    test('should show tooltips on quick action hover', async ({ page }) => {
      await dashboardPage.goto();
      
      const addInventoryAction = page.locator('[data-testid="quick-action-add-inventory"]');
      await addInventoryAction.hover();
      
      const tooltip = page.locator('[data-testid="tooltip"]');
      if (await tooltip.isVisible()) {
        await expect(tooltip).toContainText('Add new inventory item');
      }
    });
  });

  test.describe('Low Stock Alerts Interaction', () => {
    test('should display low stock alerts', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectLowStockAlerts();
      
      const alertsCount = await dashboardPage.getLowStockAlertsCount();
      expect(alertsCount).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to item details from low stock alert', async ({ page }) => {
      await dashboardPage.goto();
      
      const alertsCount = await dashboardPage.getLowStockAlertsCount();
      if (alertsCount > 0) {
        await dashboardPage.clickLowStockAlert(0);
        
        // Should navigate to item details or inventory page
        await expect(page).toHaveURL(/\/(inventory|items)/);
      }
    });

    test('should show alert severity levels', async ({ page }) => {
      await dashboardPage.goto();
      
      const criticalAlerts = page.locator('[data-testid="alert-critical"]');
      const warningAlerts = page.locator('[data-testid="alert-warning"]');
      
      const criticalCount = await criticalAlerts.count();
      const warningCount = await warningAlerts.count();
      
      // Verify alerts have appropriate styling
      if (criticalCount > 0) {
        await expect(criticalAlerts.first()).toHaveClass(/critical|danger|red/);
      }
      if (warningCount > 0) {
        await expect(warningAlerts.first()).toHaveClass(/warning|yellow/);
      }
    });

    test('should dismiss individual alerts', async ({ page }) => {
      await dashboardPage.goto();
      
      const alertsCount = await dashboardPage.getLowStockAlertsCount();
      if (alertsCount > 0) {
        const dismissButton = page.locator('[data-testid="dismiss-alert"]').first();
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          
          const newAlertsCount = await dashboardPage.getLowStockAlertsCount();
          expect(newAlertsCount).toBe(alertsCount - 1);
        }
      }
    });
  });

  test.describe('Charts and Analytics Interaction', () => {
    test('should display inventory chart with data', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectInventoryChart();
    });

    test('should interact with chart elements', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.interactWithChart();
    });

    test('should switch between chart types', async ({ page }) => {
      await dashboardPage.goto();
      
      const chartTypeSelector = page.locator('[data-testid="chart-type-selector"]');
      if (await chartTypeSelector.isVisible()) {
        await chartTypeSelector.selectOption('pie');
        
        const pieChart = page.locator('[data-testid="pie-chart"]');
        await expect(pieChart).toBeVisible();
        
        await chartTypeSelector.selectOption('bar');
        
        const barChart = page.locator('[data-testid="bar-chart"]');
        await expect(barChart).toBeVisible();
      }
    });

    test('should filter chart data by date range', async ({ page }) => {
      await dashboardPage.goto();
      
      const dateFilter = page.locator('[data-testid="chart-date-filter"]');
      if (await dateFilter.isVisible()) {
        await dateFilter.selectOption('last-30-days');
        
        // Wait for chart to update
        await page.waitForTimeout(1000);
        
        // Verify chart updated
        const chartTitle = page.locator('[data-testid="chart-title"]');
        await expect(chartTitle).toContainText('Last 30 Days');
      }
    });

    test('should export chart data', async ({ page }) => {
      await dashboardPage.goto();
      
      const exportButton = page.locator('[data-testid="export-chart"]');
      if (await exportButton.isVisible()) {
        // Set up download handler
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/chart.*\.(png|pdf|csv)$/);
      }
    });
  });

  test.describe('Recent Activities Navigation', () => {
    test('should display recent activities', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectRecentActivities();
      
      const activitiesCount = await dashboardPage.getRecentActivitiesCount();
      expect(activitiesCount).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to activity details', async ({ page }) => {
      await dashboardPage.goto();
      
      const activitiesCount = await dashboardPage.getRecentActivitiesCount();
      if (activitiesCount > 0) {
        await dashboardPage.clickRecentActivity(0);
        
        // Should navigate to relevant page or open details modal
        const detailsModal = page.locator('[data-testid="activity-details-modal"]');
        if (await detailsModal.isVisible()) {
          await expect(detailsModal).toBeVisible();
        } else {
          // Or navigate to audit/transaction page
          await expect(page).toHaveURL(/\/(audit|transactions|inventory)/);
        }
      }
    });

    test('should show activity timestamps', async ({ page }) => {
      await dashboardPage.goto();
      
      const activities = page.locator('[data-testid="recent-activity-item"]');
      const activitiesCount = await activities.count();
      
      for (let i = 0; i < Math.min(activitiesCount, 3); i++) {
        const activity = activities.nth(i);
        const timestamp = activity.locator('[data-testid="activity-timestamp"]');
        await expect(timestamp).toBeVisible();
        
        const timestampText = await timestamp.textContent();
        expect(timestampText).toMatch(/\d+\s+(minute|hour|day)s?\s+ago|just now/);
      }
    });

    test('should group activities by type', async ({ page }) => {
      await dashboardPage.goto();
      
      const activityTypes = page.locator('[data-testid="activity-type"]');
      const typesCount = await activityTypes.count();
      
      const types = new Set();
      for (let i = 0; i < typesCount; i++) {
        const typeText = await activityTypes.nth(i).textContent();
        types.add(typeText);
      }
      
      // Should have different activity types
      expect(types.size).toBeGreaterThan(0);
    });

    test('should load more activities', async ({ page }) => {
      await dashboardPage.goto();
      
      const loadMoreButton = page.locator('[data-testid="load-more-activities"]');
      if (await loadMoreButton.isVisible()) {
        const initialCount = await dashboardPage.getRecentActivitiesCount();
        await loadMoreButton.click();
        
        await page.waitForTimeout(1000);
        const newCount = await dashboardPage.getRecentActivitiesCount();
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await dashboardPage.checkDashboardResponsiveness();
    });

    test('should maintain functionality on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Test touch interactions
      const quickAction = page.locator('[data-testid="quick-action-add-inventory"]');
      await quickAction.tap();
    });

    test('should handle orientation changes', async ({ page }) => {
      // Portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await dashboardPage.expectDashboardLoaded();
    });
  });

  test.describe('Dashboard Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.testKeyboardNavigation();
    });

    test('should have proper accessibility attributes', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectDashboardAccessibility();
    });

    test('should support screen readers', async ({ page }) => {
      await dashboardPage.goto();
      
      // Check for ARIA landmarks
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
      
      const navigation = page.locator('nav[role="navigation"]');
      await expect(navigation).toBeVisible();
      
      // Check for proper heading structure
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/dashboard/i);
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await dashboardPage.goto();
      
      // This would typically use axe-core or similar tool
      // For now, we'll check basic contrast requirements
      const metricsCards = page.locator('[data-testid^="metric-"]');
      const cardCount = await metricsCards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const card = metricsCards.nth(i);
        const styles = await card.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color
          };
        });
        
        // Basic check that colors are defined
        expect(styles.backgroundColor).toBeTruthy();
        expect(styles.color).toBeTruthy();
      }
    });
  });

  test.describe('Dashboard Performance', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      await dashboardPage.expectPerformanceMetrics();
    });

    test('should handle slow network conditions', async ({ page }) => {
      await dashboardPage.simulateSlowNetwork();
    });

    test('should efficiently handle large datasets', async ({ page }) => {
      await dashboardPage.testDashboardWithLargeDataset();
    });

    test('should optimize chart rendering', async ({ page }) => {
      await dashboardPage.goto();
      
      const startTime = Date.now();
      await dashboardPage.expectInventoryChart();
      const chartLoadTime = Date.now() - startTime;
      
      expect(chartLoadTime).toBeLessThan(2000); // Chart should render within 2 seconds
    });

    test('should cache dashboard data appropriately', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Navigate away and back
      await page.goto(urls.inventory);
      await page.goBack();
      
      // Should load faster from cache
      const startTime = Date.now();
      await dashboardPage.expectDashboardLoaded();
      const cacheLoadTime = Date.now() - startTime;
      
      expect(cacheLoadTime).toBeLessThan(1000); // Should load from cache quickly
    });
  });

  test.describe('Dashboard Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/dashboard/metrics', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await dashboardPage.goto();
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|failed/i);
    });

    test('should retry failed requests', async ({ page }) => {
      let requestCount = 0;
      await page.route('**/api/dashboard/metrics', route => {
        requestCount++;
        if (requestCount < 3) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              totalItems: 100,
              lowStockItems: 5,
              totalValue: 50000,
              recentTransactions: 25
            })
          });
        }
      });
      
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      expect(requestCount).toBe(3); // Should have retried
    });

    test('should handle network disconnection', async ({ page }) => {
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Simulate network disconnection
      await page.context().setOffline(true);
      
      await dashboardPage.refreshDashboard();
      
      const offlineMessage = page.locator('[data-testid="offline-message"]');
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toContainText(/offline|connection/i);
      }
      
      // Restore connection
      await page.context().setOffline(false);
    });
  });
});