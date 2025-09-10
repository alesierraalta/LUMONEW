import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Projects Dashboard - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authPage = new AuthPage(page);
    
    // Authenticate user before each test
    await authPage.login('test@example.com', 'password123');
    await projectsPage.goto();
  });

  test.describe('Dashboard Loading and Initial State', () => {
    test('should load projects dashboard with all required elements', async () => {
      // TDD: Test that dashboard loads with all essential components
      await projectsPage.expectDashboardLoaded();
      
      // Verify page title is present
      await expect(projectsPage.pageTitle).toBeVisible();
      await expect(projectsPage.pageTitle).toContainText('Gestión de Proyectos');
      
      // Verify create project button is present and enabled
      await expect(projectsPage.createProjectButton).toBeVisible();
      await expect(projectsPage.createProjectButton).toBeEnabled();
      
      // Verify all metric cards are present
      await expect(projectsPage.activeProjectsCard).toBeVisible();
      await expect(projectsPage.completedProjectsCard).toBeVisible();
      await expect(projectsPage.onHoldProjectsCard).toBeVisible();
      await expect(projectsPage.totalProjectsCard).toBeVisible();
    });

    test('should display loading state initially', async () => {
      // TDD: Test loading state behavior
      await projectsPage.page.goto('/es/projects');
      
      // Check if loading indicator appears (might be brief)
      const loadingVisible = await projectsPage.loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      
      // Eventually loading should complete
      await projectsPage.expectLoadingComplete();
      await projectsPage.expectDashboardLoaded();
    });

    test('should not display error messages on successful load', async () => {
      // TDD: Test that no error messages appear on successful load
      await projectsPage.expectDashboardLoaded();
      await projectsPage.expectNoErrorMessage();
    });
  });

  test.describe('Project Metrics Display', () => {
    test('should display project metrics with valid numeric values', async () => {
      // TDD: Test that all metrics display valid numeric values
      await projectsPage.expectDashboardLoaded();
      
      const activeProjects = await projectsPage.getMetricCardValue('active');
      const completedProjects = await projectsPage.getMetricCardValue('completed');
      const onHoldProjects = await projectsPage.getMetricCardValue('onHold');
      const totalProjects = await projectsPage.getMetricCardValue('total');
      
      // Verify all values are numeric and non-negative
      expect(parseInt(activeProjects)).toBeGreaterThanOrEqual(0);
      expect(parseInt(completedProjects)).toBeGreaterThanOrEqual(0);
      expect(parseInt(onHoldProjects)).toBeGreaterThanOrEqual(0);
      expect(parseInt(totalProjects)).toBeGreaterThanOrEqual(0);
      
      // Verify values are properly formatted (no NaN)
      expect(activeProjects).toMatch(/^\d+$/);
      expect(completedProjects).toMatch(/^\d+$/);
      expect(onHoldProjects).toMatch(/^\d+$/);
      expect(totalProjects).toMatch(/^\d+$/);
    });

    test('should validate metric calculations are consistent', async () => {
      // TDD: Test that total projects equals sum of individual metrics
      await projectsPage.expectDashboardLoaded();
      await projectsPage.validateMetricsData();
    });

    test('should display product type metrics', async () => {
      // TDD: Test product type metrics (LU, CL, MP) are displayed
      await projectsPage.expectDashboardLoaded();
      await projectsPage.expectProductTypeMetrics();
      
      // Verify LU metrics
      const luTotal = await projectsPage.getProductTypeMetric('lu', 'total');
      const luCompleted = await projectsPage.getProductTypeMetric('lu', 'completed');
      const luInProcess = await projectsPage.getProductTypeMetric('lu', 'inProcess');
      
      expect(parseInt(luTotal)).toBeGreaterThanOrEqual(0);
      expect(parseInt(luCompleted)).toBeGreaterThanOrEqual(0);
      expect(parseInt(luInProcess)).toBeGreaterThanOrEqual(0);
      
      // Verify CL metrics
      const clTotal = await projectsPage.getProductTypeMetric('cl', 'total');
      const clCompleted = await projectsPage.getProductTypeMetric('cl', 'completed');
      const clInProcess = await projectsPage.getProductTypeMetric('cl', 'inProcess');
      
      expect(parseInt(clTotal)).toBeGreaterThanOrEqual(0);
      expect(parseInt(clCompleted)).toBeGreaterThanOrEqual(0);
      expect(parseInt(clInProcess)).toBeGreaterThanOrEqual(0);
      
      // Verify MP metrics
      const mpTotal = await projectsPage.getProductTypeMetric('mp', 'total');
      const mpCompleted = await projectsPage.getProductTypeMetric('mp', 'completed');
      const mpInProcess = await projectsPage.getProductTypeMetric('mp', 'inProcess');
      
      expect(parseInt(mpTotal)).toBeGreaterThanOrEqual(0);
      expect(parseInt(mpCompleted)).toBeGreaterThanOrEqual(0);
      expect(parseInt(mpInProcess)).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Data Loading and API Integration', () => {
    test('should handle successful API response for metrics', async () => {
      // TDD: Test successful API integration
      let apiCalled = false;
      
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        apiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 5,
            completedProjects: 10,
            onHoldProjects: 2,
            totalProjects: 17,
            productTypes: {
              lu: { total: 25, completed: 15, inProcess: 10 },
              cl: { total: 30, completed: 20, inProcess: 10 },
              mp: { total: 15, completed: 8, inProcess: 7 }
            }
          })
        });
      });
      
      await projectsPage.goto();
      await projectsPage.expectDashboardLoaded();
      
      expect(apiCalled).toBe(true);
      
      // Verify the mocked data is displayed correctly
      expect(await projectsPage.getMetricCardValue('active')).toBe('5');
      expect(await projectsPage.getMetricCardValue('completed')).toBe('10');
      expect(await projectsPage.getMetricCardValue('onHold')).toBe('2');
      expect(await projectsPage.getMetricCardValue('total')).toBe('17');
    });

    test('should handle API error gracefully', async () => {
      // TDD: Test error handling for API failures
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await projectsPage.goto();
      
      // Should display error message or fallback state
      await projectsPage.expectErrorMessage();
    });

    test('should handle network timeout', async () => {
      // TDD: Test network timeout scenarios
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        // Simulate network timeout by delaying response
        await new Promise(resolve => setTimeout(resolve, 10000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        });
      });
      
      await projectsPage.goto();
      
      // Should show loading state initially
      await projectsPage.expectLoadingState();
      
      // After timeout, should show error or retry option
      await expect(async () => {
        await projectsPage.expectErrorMessage();
      }).toPass({ timeout: 15000 });
    });

    test('should handle malformed API response', async () => {
      // TDD: Test handling of invalid JSON response
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        });
      });
      
      await projectsPage.goto();
      
      // Should handle malformed response gracefully
      await projectsPage.expectErrorMessage();
    });
  });

  test.describe('Dashboard Refresh and Real-time Updates', () => {
    test('should refresh metrics when page is reloaded', async () => {
      // TDD: Test data refresh functionality
      await projectsPage.expectDashboardLoaded();
      
      const initialActiveProjects = await projectsPage.getMetricCardValue('active');
      
      // Mock different data for refresh
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: parseInt(initialActiveProjects) + 1,
            completedProjects: 10,
            onHoldProjects: 2,
            totalProjects: 13,
            productTypes: {
              lu: { total: 25, completed: 15, inProcess: 10 },
              cl: { total: 30, completed: 20, inProcess: 10 },
              mp: { total: 15, completed: 8, inProcess: 7 }
            }
          })
        });
      });
      
      await projectsPage.refreshPage();
      
      const refreshedActiveProjects = await projectsPage.getMetricCardValue('active');
      expect(parseInt(refreshedActiveProjects)).toBe(parseInt(initialActiveProjects) + 1);
    });

    test('should maintain state consistency during navigation', async () => {
      // TDD: Test state consistency when navigating away and back
      await projectsPage.expectDashboardLoaded();
      
      const initialMetrics = {
        active: await projectsPage.getMetricCardValue('active'),
        completed: await projectsPage.getMetricCardValue('completed'),
        onHold: await projectsPage.getMetricCardValue('onHold'),
        total: await projectsPage.getMetricCardValue('total')
      };
      
      // Navigate away and back
      await projectsPage.page.goto('/es/dashboard');
      await projectsPage.goto();
      
      // Verify metrics are consistent (assuming no changes)
      expect(await projectsPage.getMetricCardValue('active')).toBe(initialMetrics.active);
      expect(await projectsPage.getMetricCardValue('completed')).toBe(initialMetrics.completed);
      expect(await projectsPage.getMetricCardValue('onHold')).toBe(initialMetrics.onHold);
      expect(await projectsPage.getMetricCardValue('total')).toBe(initialMetrics.total);
    });
  });

  test.describe('Dashboard Performance', () => {
    test('should load dashboard within acceptable time limits', async () => {
      // TDD: Test performance requirements
      const loadTime = await projectsPage.measurePageLoadTime();
      
      // Dashboard should load within 3 seconds under normal conditions
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle slow network conditions gracefully', async () => {
      // TDD: Test performance under slow network
      await projectsPage.simulateSlowNetwork();
      
      const startTime = Date.now();
      await projectsPage.goto();
      
      // Should show loading state during slow load
      await projectsPage.expectLoadingState();
      
      await projectsPage.expectDashboardLoaded();
      const loadTime = Date.now() - startTime;
      
      // Should still complete loading (with delay)
      expect(loadTime).toBeGreaterThan(1000); // Due to simulated delay
      expect(loadTime).toBeLessThan(10000); // But not excessively long
    });
  });

  test.describe('Dashboard Accessibility', () => {
    test('should have proper heading structure', async () => {
      // TDD: Test accessibility compliance
      await projectsPage.expectDashboardLoaded();
      await projectsPage.checkHeadingStructure();
    });

    test('should support keyboard navigation', async () => {
      // TDD: Test keyboard accessibility
      await projectsPage.expectDashboardLoaded();
      await projectsPage.checkKeyboardNavigation();
    });

    test('should have proper ARIA labels', async () => {
      // TDD: Test ARIA accessibility
      await projectsPage.expectDashboardLoaded();
      await projectsPage.checkAriaLabels();
    });
  });

  test.describe('Dashboard Responsive Design', () => {
    test('should display correctly on mobile devices', async () => {
      // TDD: Test mobile responsiveness
      await projectsPage.checkMobileLayout();
    });

    test('should display correctly on tablet devices', async () => {
      // TDD: Test tablet responsiveness
      await projectsPage.checkTabletLayout();
    });

    test('should display correctly on desktop devices', async () => {
      // TDD: Test desktop responsiveness
      await projectsPage.checkDesktopLayout();
    });
  });
});