import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';
import { loginAsAdmin, loginAsUser } from '../utils/test-helpers';

test.describe('Visual Regression Tests', () => {
  // Configure visual comparisons
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Dashboard Visual Tests', () => {
    test('should match dashboard layout', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Wait for all content to load
      await page.waitForSelector(testData.selectors.dashboard.metricsCards);
      await page.waitForTimeout(1000); // Allow for any remaining loading
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('dashboard-full-page.png', {
        fullPage: true,
        threshold: 0.2,
        maxDiffPixels: 1000
      });
    });

    test('should match dashboard metrics cards', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      await page.waitForSelector(testData.selectors.dashboard.metricsCards);
      
      // Screenshot specific component
      const metricsCards = page.locator(testData.selectors.dashboard.metricsCards);
      await expect(metricsCards).toHaveScreenshot('dashboard-metrics-cards.png', {
        threshold: 0.2
      });
    });

    test('should match dashboard charts', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Wait for charts to render
      await page.waitForSelector('[data-testid="chart"], .chart, canvas', { timeout: 10000 });
      await page.waitForTimeout(2000); // Allow charts to fully render
      
      const chartsSection = page.locator('[data-testid="charts-section"], .charts-container').first();
      if (await chartsSection.isVisible()) {
        await expect(chartsSection).toHaveScreenshot('dashboard-charts.png', {
          threshold: 0.3 // Charts may have slight variations
        });
      }
    });

    test('should match dashboard responsive layout on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      await page.waitForSelector(testData.selectors.dashboard.metricsCards);
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match dashboard responsive layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      await page.waitForSelector(testData.selectors.dashboard.metricsCards);
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        threshold: 0.2
      });
    });
  });

  test.describe('Inventory Visual Tests', () => {
    test('should match inventory table layout', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      await page.waitForSelector('table');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('inventory-table.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match inventory filters', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      const filtersSection = page.locator('[data-testid="filters"], .filters-container').first();
      if (await filtersSection.isVisible()) {
        await expect(filtersSection).toHaveScreenshot('inventory-filters.png', {
          threshold: 0.2
        });
      }
    });

    test('should match inventory create modal', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Open create modal
      const createButton = page.locator(testData.selectors.inventory.createButton);
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Wait for modal to appear
        const modal = page.locator('[role="dialog"], .modal');
        await expect(modal).toBeVisible();
        await page.waitForTimeout(500);
        
        await expect(modal).toHaveScreenshot('inventory-create-modal.png', {
          threshold: 0.2
        });
      }
    });

    test('should match inventory item details', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Click on first item if available
      const firstItem = page.locator('table tbody tr').first();
      if (await firstItem.isVisible()) {
        await firstItem.click();
        
        // Wait for details view
        await page.waitForTimeout(1000);
        
        const detailsView = page.locator('[data-testid="item-details"], .item-details');
        if (await detailsView.isVisible()) {
          await expect(detailsView).toHaveScreenshot('inventory-item-details.png', {
            threshold: 0.2
          });
        }
      }
    });
  });

  test.describe('Authentication Visual Tests', () => {
    test('should match login page layout', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      await page.waitForSelector('form');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match login form validation states', async ({ page }) => {
      await page.goto(testData.urls.login);
      
      // Trigger validation by submitting empty form
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('login-form-validation.png', {
        threshold: 0.2
      });
    });

    test('should match signup page layout', async ({ page }) => {
      await page.goto(testData.urls.signup);
      
      await page.waitForSelector('form');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });
  });

  test.describe('Navigation Visual Tests', () => {
    test('should match main navigation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      const navigation = page.locator('nav, [role="navigation"], .sidebar, .navigation').first();
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveScreenshot('main-navigation.png', {
          threshold: 0.2
        });
      }
    });

    test('should match mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Open mobile menu if it exists
      const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu-button, button[aria-label*="menu"]').first();
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
        
        const mobileMenu = page.locator('[data-testid="mobile-navigation"], .mobile-menu');
        if (await mobileMenu.isVisible()) {
          await expect(mobileMenu).toHaveScreenshot('mobile-navigation.png', {
            threshold: 0.2
          });
        }
      }
    });

    test('should match breadcrumb navigation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb"]').first();
      if (await breadcrumbs.isVisible()) {
        await expect(breadcrumbs).toHaveScreenshot('breadcrumb-navigation.png', {
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Form Visual Tests', () => {
    test('should match form input states', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      // Test different input states
      const nameInput = page.locator('[name="name"]');
      if (await nameInput.isVisible()) {
        // Default state
        await expect(nameInput).toHaveScreenshot('input-default.png');
        
        // Focused state
        await nameInput.focus();
        await expect(nameInput).toHaveScreenshot('input-focused.png');
        
        // Filled state
        await nameInput.fill('Test Item');
        await expect(nameInput).toHaveScreenshot('input-filled.png');
        
        // Clear and trigger validation
        await nameInput.fill('');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(500);
        await expect(nameInput).toHaveScreenshot('input-error.png');
      }
    });

    test('should match form button states', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory + '/create');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        // Default state
        await expect(submitButton).toHaveScreenshot('button-default.png');
        
        // Hover state
        await submitButton.hover();
        await expect(submitButton).toHaveScreenshot('button-hover.png');
        
        // Disabled state (if applicable)
        await page.evaluate(() => {
          const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (button) button.disabled = true;
        });
        await expect(submitButton).toHaveScreenshot('button-disabled.png');
      }
    });
  });

  test.describe('Data Table Visual Tests', () => {
    test('should match table header', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      await page.waitForSelector('table');
      
      const tableHeader = page.locator('table thead');
      await expect(tableHeader).toHaveScreenshot('table-header.png', {
        threshold: 0.2
      });
    });

    test('should match table pagination', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      await page.waitForSelector('table');
      
      const pagination = page.locator('[data-testid="pagination"], .pagination').first();
      if (await pagination.isVisible()) {
        await expect(pagination).toHaveScreenshot('table-pagination.png', {
          threshold: 0.2
        });
      }
    });

    test('should match table empty state', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to a page that might have empty state
      await page.goto(testData.urls.inventory + '?search=nonexistentitem12345');
      await page.waitForTimeout(2000);
      
      const emptyState = page.locator('[data-testid="empty-state"], .empty-state, text=No items found');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toHaveScreenshot('table-empty-state.png', {
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Modal Visual Tests', () => {
    test('should match modal overlay', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      const createButton = page.locator(testData.selectors.inventory.createButton);
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modalOverlay = page.locator('[data-testid="modal-overlay"], .modal-overlay, [role="dialog"]').first();
        await expect(modalOverlay).toBeVisible();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('modal-overlay.png', {
          fullPage: true,
          threshold: 0.2
        });
      }
    });

    test('should match confirmation dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      // Try to trigger a delete confirmation
      const deleteButton = page.locator('[data-testid="delete-button"], button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        const confirmDialog = page.locator('[role="alertdialog"], [data-testid="confirm-dialog"]');
        if (await confirmDialog.isVisible()) {
          await page.waitForTimeout(500);
          await expect(confirmDialog).toHaveScreenshot('confirmation-dialog.png', {
            threshold: 0.2
          });
        }
      }
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('should match 404 error page', async ({ page }) => {
      await page.goto('/nonexistent-page-12345');
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match network error state', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Block network requests to simulate error
      await context.route('**/api/**', route => route.abort());
      
      await page.goto(testData.urls.inventory);
      await page.waitForTimeout(3000);
      
      const errorState = page.locator('[data-testid="error-state"], .error-state');
      if (await errorState.isVisible()) {
        await expect(errorState).toHaveScreenshot('network-error-state.png', {
          threshold: 0.2
        });
      }
    });
  });

  test.describe('Loading State Visual Tests', () => {
    test('should match loading spinner', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Add delay to API requests to capture loading state
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      const navigationPromise = page.goto(testData.urls.inventory);
      
      // Capture loading state
      await page.waitForTimeout(500);
      const loadingSpinner = page.locator('[data-testid="loading"], .loading, [role="progressbar"]');
      if (await loadingSpinner.isVisible()) {
        await expect(loadingSpinner).toHaveScreenshot('loading-spinner.png', {
          threshold: 0.2
        });
      }
      
      await navigationPromise;
    });

    test('should match skeleton loading', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Add delay to capture skeleton state
      await context.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      });
      
      const navigationPromise = page.goto(testData.urls.dashboard);
      
      await page.waitForTimeout(500);
      const skeleton = page.locator('[data-testid="skeleton"], .skeleton');
      if (await skeleton.isVisible()) {
        await expect(skeleton).toHaveScreenshot('skeleton-loading.png', {
          threshold: 0.2
        });
      }
      
      await navigationPromise;
    });
  });

  test.describe('Theme Visual Tests', () => {
    test('should match light theme', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Ensure light theme is active
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      });
      
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('light-theme.png', {
        fullPage: true,
        threshold: 0.2
      });
    });

    test('should match dark theme', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Enable dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('dark-theme.png', {
        fullPage: true,
        threshold: 0.2
      });
    });
  });

  test.describe('Component State Visual Tests', () => {
    test('should match alert components', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Look for alert components
      const alerts = page.locator('[role="alert"], .alert, [data-testid="alert"]');
      const alertCount = await alerts.count();
      
      for (let i = 0; i < Math.min(alertCount, 3); i++) {
        const alert = alerts.nth(i);
        if (await alert.isVisible()) {
          await expect(alert).toHaveScreenshot(`alert-${i}.png`, {
            threshold: 0.2
          });
        }
      }
    });

    test('should match badge components', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.inventory);
      
      await page.waitForSelector('table');
      
      const badges = page.locator('.badge, [data-testid="badge"]');
      const badgeCount = await badges.count();
      
      for (let i = 0; i < Math.min(badgeCount, 5); i++) {
        const badge = badges.nth(i);
        if (await badge.isVisible()) {
          await expect(badge).toHaveScreenshot(`badge-${i}.png`, {
            threshold: 0.2
          });
        }
      }
    });

    test('should match tooltip components', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(testData.urls.dashboard);
      
      // Look for elements that might have tooltips
      const tooltipTriggers = page.locator('[title], [data-tooltip], [aria-describedby]');
      const triggerCount = await tooltipTriggers.count();
      
      for (let i = 0; i < Math.min(triggerCount, 3); i++) {
        const trigger = tooltipTriggers.nth(i);
        if (await trigger.isVisible()) {
          await trigger.hover();
          await page.waitForTimeout(500);
          
          const tooltip = page.locator('[role="tooltip"], .tooltip');
          if (await tooltip.isVisible()) {
            await expect(tooltip).toHaveScreenshot(`tooltip-${i}.png`, {
              threshold: 0.2
            });
          }
        }
      }
    });
  });
});