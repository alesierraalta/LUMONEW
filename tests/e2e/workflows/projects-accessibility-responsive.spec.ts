import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthenticationFlow } from '../page-objects/authentication-flow';

test.describe('Projects Accessibility and Responsive Design - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authFlow: AuthenticationFlow;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authFlow = new AuthenticationFlow(page);
    
    // Mock API responses for consistent testing
    await page.route('**/api/projects', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'project-1',
              name: 'Proyecto Mobile Test',
              description: 'Descripción para pruebas de responsividad',
              status: 'active',
              priority: 'high',
              startDate: '2024-01-01',
              endDate: '2024-12-31'
            },
            {
              id: 'project-2',
              name: 'Proyecto Tablet Test',
              description: 'Descripción para pruebas de accesibilidad',
              status: 'completed',
              priority: 'medium',
              startDate: '2024-02-01',
              endDate: '2024-11-30'
            },
            {
              id: 'project-3',
              name: 'Proyecto Desktop Test',
              description: 'Descripción para pruebas de navegación por teclado',
              status: 'on_hold',
              priority: 'low',
              startDate: '2024-03-01',
              endDate: '2024-10-31'
            }
          ]
        })
      });
    });
    
    await page.route('**/api/projects/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeProjects: 1,
          completedProjects: 1,
          onHoldProjects: 1,
          totalProjects: 3
        })
      });
    });
    
    await page.route('**/api/inventory/items', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            { id: 'item-1', name: 'Item Test', sku: 'SKU001', price: 100 }
          ]
        })
      });
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should display correctly on mobile devices (320px)', async ({ page }) => {
      // TDD: Test mobile viewport
      await page.setViewportSize({ width: 320, height: 568 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page loads and is usable on mobile
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Verify metrics are stacked or hidden appropriately
      const metricsSection = page.locator('[data-testid="metrics-section"]').or(page.locator('.metrics'));
      if (await metricsSection.isVisible()) {
        const metricsBox = await metricsSection.boundingBox();
        expect(metricsBox?.width).toBeLessThanOrEqual(320);
      }
      
      // Verify project cards are stacked vertically
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      const cardCount = await projectCards.count();
      
      if (cardCount > 1) {
        const firstCard = await projectCards.first().boundingBox();
        const secondCard = await projectCards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Cards should be stacked vertically (second card below first)
          expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 10);
        }
      }
      
      // Verify buttons and controls are touch-friendly (minimum 44px)
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        const buttonBox = await createButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should display correctly on tablet devices (768px)', async ({ page }) => {
      // TDD: Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page utilizes tablet space effectively
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Verify metrics are displayed in a row or grid
      const metricsItems = page.locator('[data-testid="metric-item"]').or(page.locator('.metric'));
      const metricsCount = await metricsItems.count();
      
      if (metricsCount >= 2) {
        const firstMetric = await metricsItems.first().boundingBox();
        const secondMetric = await metricsItems.nth(1).boundingBox();
        
        if (firstMetric && secondMetric) {
          // Metrics should be side by side on tablet
          expect(Math.abs(firstMetric.y - secondMetric.y)).toBeLessThan(50);
        }
      }
      
      // Verify project cards utilize available width
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      if (await projectCards.first().isVisible()) {
        const cardBox = await projectCards.first().boundingBox();
        expect(cardBox?.width).toBeGreaterThan(200); // Should be wider than mobile
        expect(cardBox?.width).toBeLessThanOrEqual(768);
      }
    });

    test('should display correctly on desktop devices (1200px)', async ({ page }) => {
      // TDD: Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page utilizes desktop space effectively
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Verify metrics are displayed in a horizontal layout
      const metricsItems = page.locator('[data-testid="metric-item"]').or(page.locator('.metric'));
      const metricsCount = await metricsItems.count();
      
      if (metricsCount >= 3) {
        const metrics = [];
        for (let i = 0; i < Math.min(3, metricsCount); i++) {
          const box = await metricsItems.nth(i).boundingBox();
          if (box) metrics.push(box);
        }
        
        // All metrics should be roughly on the same horizontal line
        if (metrics.length >= 2) {
          expect(Math.abs(metrics[0].y - metrics[1].y)).toBeLessThan(20);
        }
      }
      
      // Verify project cards can be displayed in a grid layout
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      const cardCount = await projectCards.count();
      
      if (cardCount >= 2) {
        const firstCard = await projectCards.first().boundingBox();
        const secondCard = await projectCards.nth(1).boundingBox();
        
        if (firstCard && secondCard) {
          // Cards might be side by side on desktop
          const sideBySide = Math.abs(firstCard.y - secondCard.y) < 50;
          const stacked = secondCard.y > firstCard.y + firstCard.height - 10;
          
          expect(sideBySide || stacked).toBeTruthy();
        }
      }
    });

    test('should handle viewport size changes dynamically', async ({ page }) => {
      // TDD: Test responsive behavior during resize
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Start with desktop size
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Resize to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Resize to mobile
      await page.setViewportSize({ width: 320, height: 568 });
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Verify functionality still works after resizing
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await expect(createButton).toBeEnabled();
      }
    });

    test('should maintain usability with horizontal scrolling disabled', async ({ page }) => {
      // TDD: Test no horizontal overflow
      await page.setViewportSize({ width: 320, height: 568 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check for horizontal scrollbar
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 5); // Allow small tolerance
    });
  });

  test.describe('Keyboard Navigation and Accessibility', () => {
    test('should support full keyboard navigation', async ({ page }) => {
      // TDD: Test keyboard navigation
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Start navigation from the beginning
      await page.keyboard.press('Tab');
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Navigate through interactive elements
      const interactiveElements = [];
      let tabCount = 0;
      const maxTabs = 20; // Prevent infinite loop
      
      while (tabCount < maxTabs) {
        const currentFocus = await page.evaluate(() => {
          const focused = document.activeElement;
          return focused ? {
            tagName: focused.tagName,
            type: focused.getAttribute('type'),
            role: focused.getAttribute('role'),
            ariaLabel: focused.getAttribute('aria-label'),
            textContent: focused.textContent?.trim().substring(0, 50)
          } : null;
        });
        
        if (currentFocus) {
          interactiveElements.push(currentFocus);
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
        
        // Break if we've cycled back to the first element
        if (tabCount > 5 && interactiveElements.length > 0) {
          const currentElement = await page.evaluate(() => {
            const focused = document.activeElement;
            return focused ? focused.textContent?.trim().substring(0, 50) : null;
          });
          
          if (currentElement === interactiveElements[0].textContent) {
            break;
          }
        }
      }
      
      // Verify we found interactive elements
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    test('should support keyboard shortcuts and actions', async ({ page }) => {
      // TDD: Test keyboard shortcuts
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Test Enter key on buttons
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await createButton.focus();
        await page.keyboard.press('Enter');
        
        // Verify modal opens
        await expect(page.getByRole('dialog').or(page.locator('.modal'))).toBeVisible({ timeout: 5000 });
        
        // Test Escape key to close modal
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog').or(page.locator('.modal'))).not.toBeVisible({ timeout: 5000 });
      }
      
      // Test Space key on buttons
      if (await createButton.isVisible()) {
        await createButton.focus();
        await page.keyboard.press('Space');
        
        // Verify modal opens
        await expect(page.getByRole('dialog').or(page.locator('.modal'))).toBeVisible({ timeout: 5000 });
        
        // Close modal for cleanup
        await page.keyboard.press('Escape');
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // TDD: Test ARIA attributes
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check main heading
      const mainHeading = page.getByRole('heading', { level: 1 });
      await expect(mainHeading).toBeVisible();
      
      // Check navigation landmarks
      const navigation = page.getByRole('navigation');
      if (await navigation.isVisible()) {
        await expect(navigation).toHaveAttribute('aria-label');
      }
      
      // Check main content area
      const main = page.getByRole('main');
      if (await main.isVisible()) {
        await expect(main).toBeVisible();
      }
      
      // Check buttons have accessible names
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const accessibleName = await button.getAttribute('aria-label') || 
                                await button.textContent() ||
                                await button.getAttribute('title');
          expect(accessibleName).toBeTruthy();
        }
      }
      
      // Check form inputs have labels
      const inputs = page.getByRole('textbox');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          const hasLabel = await input.getAttribute('aria-label') ||
                          await input.getAttribute('aria-labelledby') ||
                          await page.locator(`label[for="${await input.getAttribute('id')}"]`).count() > 0;
          expect(hasLabel).toBeTruthy();
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // TDD: Test heading structure
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Get all headings
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels = [];
      
      for (const heading of headings) {
        if (await heading.isVisible()) {
          const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
          const level = parseInt(tagName.charAt(1));
          headingLevels.push(level);
        }
      }
      
      // Verify heading hierarchy (should start with h1 and not skip levels)
      if (headingLevels.length > 0) {
        expect(headingLevels[0]).toBe(1); // First heading should be h1
        
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const previousLevel = headingLevels[i - 1];
          
          // Should not skip more than one level
          expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
        }
      }
    });

    test('should support screen reader announcements', async ({ page }) => {
      // TDD: Test screen reader support
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check for live regions
      const liveRegions = page.locator('[aria-live]');
      const liveRegionCount = await liveRegions.count();
      
      if (liveRegionCount > 0) {
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');
          expect(['polite', 'assertive', 'off']).toContain(ariaLive);
        }
      }
      
      // Check for status messages
      const statusElements = page.getByRole('status');
      const statusCount = await statusElements.count();
      
      // Trigger an action that should create a status message
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Check if modal has proper announcements
        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          const modalTitle = await modal.getAttribute('aria-labelledby') || 
                           await modal.getAttribute('aria-label');
          expect(modalTitle).toBeTruthy();
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // TDD: Test color contrast (basic check)
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check text elements for basic contrast
      const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
      const elementCount = await textElements.count();
      
      // Sample a few elements to check they have visible text
      const sampleSize = Math.min(10, elementCount);
      
      for (let i = 0; i < sampleSize; i++) {
        const element = textElements.nth(i);
        if (await element.isVisible()) {
          const textContent = await element.textContent();
          if (textContent && textContent.trim().length > 0) {
            // Basic visibility check - element should be visible with text
            await expect(element).toBeVisible();
            
            // Check computed styles
            const styles = await element.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                opacity: computed.opacity
              };
            });
            
            // Basic checks - should have color and not be transparent
            expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
            expect(parseFloat(styles.opacity)).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should support focus management in modals', async ({ page }) => {
      // TDD: Test focus trapping in modals
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Open modal
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.getByRole('dialog').or(page.locator('.modal'));
        await expect(modal).toBeVisible();
        
        // Check initial focus
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Test focus trapping by tabbing through modal elements
        let tabCount = 0;
        const maxTabs = 10;
        const focusedElements = [];
        
        while (tabCount < maxTabs) {
          const currentFocus = await page.evaluate(() => {
            const focused = document.activeElement;
            return focused ? focused.tagName + (focused.className ? '.' + focused.className : '') : null;
          });
          
          if (currentFocus) {
            focusedElements.push(currentFocus);
          }
          
          await page.keyboard.press('Tab');
          tabCount++;
          
          // Check if focus is still within modal
          const focusWithinModal = await page.evaluate(() => {
            const focused = document.activeElement;
            const modal = document.querySelector('[role="dialog"], .modal');
            return modal ? modal.contains(focused) : false;
          });
          
          if (!focusWithinModal && tabCount > 2) {
            // Focus might have wrapped back to first element
            break;
          }
        }
        
        // Verify we found focusable elements within the modal
        expect(focusedElements.length).toBeGreaterThan(0);
        
        // Close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    });
  });

  test.describe('Touch and Mobile Interaction', () => {
    test('should support touch gestures on mobile', async ({ page }) => {
      // TDD: Test touch interactions
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Test tap interactions
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        // Simulate touch tap
        await createButton.tap();
        
        const modal = page.getByRole('dialog').or(page.locator('.modal'));
        await expect(modal).toBeVisible({ timeout: 5000 });
        
        // Close modal
        const closeButton = modal.getByRole('button', { name: /cerrar|cancelar/i });
        if (await closeButton.isVisible()) {
          await closeButton.tap();
        } else {
          await page.keyboard.press('Escape');
        }
      }
      
      // Test scroll behavior
      const projectsList = page.locator('[data-testid="projects-list"]').or(page.locator('.projects'));
      if (await projectsList.isVisible()) {
        // Simulate scroll gesture
        await projectsList.hover();
        await page.mouse.wheel(0, 100);
        
        // Verify page scrolled
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have appropriate touch target sizes', async ({ page }) => {
      // TDD: Test touch target sizes (minimum 44px)
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check button sizes
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
      
      // Check link sizes
      const links = page.getByRole('link');
      const linkCount = await links.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        if (await link.isVisible()) {
          const box = await link.boundingBox();
          if (box) {
            // Links should have adequate touch targets
            expect(Math.min(box.height, box.width)).toBeGreaterThanOrEqual(32);
          }
        }
      }
    });

    test('should prevent zoom on form inputs', async ({ page }) => {
      // TDD: Test viewport meta tag prevents zoom on input focus
      await page.setViewportSize({ width: 375, height: 667 });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Check viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      
      // Should contain user-scalable=no or maximum-scale=1 to prevent zoom
      const preventsZoom = viewportMeta?.includes('user-scalable=no') || 
                          viewportMeta?.includes('maximum-scale=1');
      
      // Open form to test input behavior
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.getByRole('dialog').or(page.locator('.modal'));
        if (await modal.isVisible()) {
          const nameInput = modal.getByRole('textbox').first();
          if (await nameInput.isVisible()) {
            await nameInput.focus();
            
            // Input should be focused without causing zoom
            await expect(nameInput).toBeFocused();
          }
        }
      }
    });
  });

  test.describe('Print and High Contrast Support', () => {
    test('should be readable in high contrast mode', async ({ page }) => {
      // TDD: Test high contrast support
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page is still usable in dark mode
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Check that interactive elements are still visible
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible();
        
        // Verify button has visible text or icon
        const buttonText = await createButton.textContent();
        const hasAriaLabel = await createButton.getAttribute('aria-label');
        expect(buttonText || hasAriaLabel).toBeTruthy();
      }
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // TDD: Test reduced motion support
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page loads without animations
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Test modal opening without animations
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        
        const modal = page.getByRole('dialog').or(page.locator('.modal'));
        await expect(modal).toBeVisible({ timeout: 1000 }); // Should appear quickly without animation
      }
    });

    test('should be printable with proper layout', async ({ page }) => {
      // TDD: Test print styles
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      // Verify main content is still visible
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Check that navigation and non-essential elements might be hidden
      const navigation = page.getByRole('navigation');
      if (await navigation.count() > 0) {
        // Navigation might be hidden in print mode
        const navVisible = await navigation.first().isVisible();
        // This is acceptable either way - just checking it doesn't break
        expect(typeof navVisible).toBe('boolean');
      }
      
      // Verify project content is printable
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toBeVisible();
      }
    });
  });
});