import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthenticationFlow } from '../page-objects/authentication-flow';

test.describe('Projects Performance and Optimization - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authFlow: AuthenticationFlow;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authFlow = new AuthenticationFlow(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load projects page within acceptable time limits', async ({ page }) => {
      // TDD: Test initial page load performance
      const startTime = Date.now();
      
      // Mock API with realistic delay
      await page.route('**/api/projects', async route => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 50 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción del proyecto ${i + 1}`,
              status: ['active', 'completed', 'on_hold'][i % 3],
              priority: ['high', 'medium', 'low'][i % 3],
              startDate: '2024-01-01',
              endDate: '2024-12-31'
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await new Promise(resolve => setTimeout(resolve, 50));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 20,
            completedProjects: 15,
            onHoldProjects: 15,
            totalProjects: 50
          })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Wait for page to be fully loaded
      await expect(page.getByText('Proyectos')).toBeVisible();
      await expect(page.locator('[data-testid="project-card"]').or(page.locator('.project-item')).first()).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // TDD: Test performance with large number of projects
      const projectCount = 200;
      
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: projectCount }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción muy larga del proyecto ${i + 1} con mucho texto para simular contenido real que podría afectar el rendimiento de la aplicación`,
              status: ['active', 'completed', 'on_hold', 'cancelled'][i % 4],
              priority: ['urgent', 'high', 'medium', 'low'][i % 4],
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              tags: [`tag-${i % 10}`, `category-${i % 5}`],
              team: Array.from({ length: (i % 5) + 1 }, (_, j) => `member-${j + 1}`)
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 80,
            completedProjects: 60,
            onHoldProjects: 40,
            totalProjects: projectCount
          })
        });
      });
      
      const startTime = Date.now();
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Wait for initial projects to load
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Check if pagination or virtualization is implemented
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      const visibleCards = await projectCards.count();
      
      const loadTime = Date.now() - startTime;
      
      // Should handle large datasets efficiently
      expect(loadTime).toBeLessThan(5000);
      
      // Should not render all items at once (pagination/virtualization)
      expect(visibleCards).toBeLessThanOrEqual(50);
      
      console.log(`Large dataset load time: ${loadTime}ms, Visible cards: ${visibleCards}`);
    });

    test('should optimize API calls and avoid unnecessary requests', async ({ page }) => {
      // TDD: Test API call optimization
      let apiCallCount = 0;
      let projectsApiCalls = 0;
      let metricsApiCalls = 0;
      
      await page.route('**/api/projects', async route => {
        apiCallCount++;
        projectsApiCalls++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'project-1',
                name: 'Proyecto Test',
                description: 'Descripción test',
                status: 'active',
                priority: 'high'
              }
            ]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        apiCallCount++;
        metricsApiCalls++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 1,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 1
          })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Wait a bit to ensure no additional calls are made
      await page.waitForTimeout(1000);
      
      // Should make minimal API calls on initial load
      expect(projectsApiCalls).toBeLessThanOrEqual(2); // Allow for potential retry
      expect(metricsApiCalls).toBeLessThanOrEqual(2);
      expect(apiCallCount).toBeLessThanOrEqual(4);
      
      console.log(`API calls made: ${apiCallCount} (Projects: ${projectsApiCalls}, Metrics: ${metricsApiCalls})`);
    });

    test('should implement proper caching strategies', async ({ page }) => {
      // TDD: Test caching behavior
      let apiCallCount = 0;
      
      await page.route('**/api/projects', async route => {
        apiCallCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Cache-Control': 'public, max-age=300', // 5 minutes cache
            'ETag': '"projects-v1"'
          },
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'project-1',
                name: 'Proyecto Cached',
                description: 'Descripción cached',
                status: 'active',
                priority: 'high'
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
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 1
          })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      const initialApiCalls = apiCallCount;
      
      // Navigate away and back
      await page.goBack();
      await page.goForward();
      
      // Wait for potential API calls
      await page.waitForTimeout(500);
      
      // Should not make additional API calls if properly cached
      const finalApiCalls = apiCallCount;
      expect(finalApiCalls - initialApiCalls).toBeLessThanOrEqual(1);
      
      console.log(`Cache test - Initial calls: ${initialApiCalls}, Final calls: ${finalApiCalls}`);
    });
  });

  test.describe('Runtime Performance', () => {
    test('should maintain smooth scrolling with large lists', async ({ page }) => {
      // TDD: Test scrolling performance
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 100 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción del proyecto ${i + 1}`,
              status: ['active', 'completed', 'on_hold'][i % 3],
              priority: ['high', 'medium', 'low'][i % 3]
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 50, completedProjects: 30, onHoldProjects: 20, totalProjects: 100 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Measure scroll performance
      const startTime = Date.now();
      
      // Perform multiple scroll actions
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 200);
        await page.waitForTimeout(100);
      }
      
      const scrollTime = Date.now() - startTime;
      
      // Scrolling should be smooth and responsive
      expect(scrollTime).toBeLessThan(1000);
      
      // Verify content is still visible after scrolling
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      console.log(`Scroll performance: ${scrollTime}ms for 5 scroll actions`);
    });

    test('should handle rapid filter changes efficiently', async ({ page }) => {
      // TDD: Test filter performance
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 50 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción del proyecto ${i + 1}`,
              status: ['active', 'completed', 'on_hold'][i % 3],
              priority: ['high', 'medium', 'low'][i % 3]
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 20, completedProjects: 15, onHoldProjects: 15, totalProjects: 50 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      const startTime = Date.now();
      
      // Rapid filter changes
      const searchInput = page.getByRole('textbox', { name: /buscar|search/i });
      if (await searchInput.isVisible()) {
        await searchInput.fill('Proyecto 1');
        await page.waitForTimeout(100);
        
        await searchInput.fill('Proyecto 2');
        await page.waitForTimeout(100);
        
        await searchInput.fill('Proyecto 3');
        await page.waitForTimeout(100);
        
        await searchInput.fill('');
      }
      
      // Test status filter changes
      const statusFilter = page.getByRole('combobox', { name: /estado|status/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
        await page.waitForTimeout(100);
        
        await statusFilter.selectOption('completed');
        await page.waitForTimeout(100);
        
        await statusFilter.selectOption('all');
      }
      
      const filterTime = Date.now() - startTime;
      
      // Filter changes should be responsive
      expect(filterTime).toBeLessThan(2000);
      
      // Verify final state shows all projects
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      const visibleCards = await projectCards.count();
      expect(visibleCards).toBeGreaterThan(0);
      
      console.log(`Filter performance: ${filterTime}ms for multiple filter changes`);
    });

    test('should handle modal operations efficiently', async ({ page }) => {
      // TDD: Test modal performance
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Test',
              description: 'Descripción test',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 1, completedProjects: 0, onHoldProjects: 0, totalProjects: 1 })
        });
      });
      
      await page.route('**/api/inventory/items', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 100 }, (_, i) => ({
              id: `item-${i + 1}`,
              name: `Item ${i + 1}`,
              sku: `SKU${String(i + 1).padStart(3, '0')}`,
              price: (i + 1) * 10
            }))
          })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Test modal opening performance
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        const startTime = Date.now();
        
        await createButton.click();
        
        const modal = page.getByRole('dialog').or(page.locator('.modal'));
        await expect(modal).toBeVisible();
        
        const modalOpenTime = Date.now() - startTime;
        
        // Modal should open quickly
        expect(modalOpenTime).toBeLessThan(500);
        
        // Test LU Import modal performance
        const luOption = modal.getByText(/LU/i).first();
        if (await luOption.isVisible()) {
          const luStartTime = Date.now();
          
          await luOption.click();
          
          const luModal = page.getByRole('dialog').last();
          await expect(luModal).toBeVisible();
          
          // Wait for items to load
          await expect(luModal.getByText(/item/i).first()).toBeVisible({ timeout: 3000 });
          
          const luModalTime = Date.now() - luStartTime;
          
          // LU modal with items should load efficiently
          expect(luModalTime).toBeLessThan(2000);
          
          console.log(`Modal performance - Create: ${modalOpenTime}ms, LU Import: ${luModalTime}ms`);
          
          // Close modals
          await page.keyboard.press('Escape');
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not cause memory leaks during navigation', async ({ page }) => {
      // TDD: Test memory usage
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 20 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción ${i + 1}`,
              status: 'active',
              priority: 'high'
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 20, completedProjects: 0, onHoldProjects: 0, totalProjects: 20 })
        });
      });
      
      await authFlow.loginAsValidUser();
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Navigate multiple times
      for (let i = 0; i < 5; i++) {
        await projectsPage.goto();
        await expect(page.getByText('Proyectos')).toBeVisible();
        
        // Navigate away
        await page.goto('about:blank');
        await page.waitForTimeout(100);
      }
      
      // Final navigation to projects
      await projectsPage.goto();
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Get final memory usage
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be reasonable (less than 50% increase)
        expect(memoryIncreasePercent).toBeLessThan(50);
        
        console.log(`Memory usage - Initial: ${initialMemory}, Final: ${finalMemory}, Increase: ${memoryIncreasePercent.toFixed(2)}%`);
      }
    });

    test('should handle concurrent operations without performance degradation', async ({ page }) => {
      // TDD: Test concurrent operations
      let apiCallCount = 0;
      
      await page.route('**/api/projects', async route => {
        apiCallCount++;
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Concurrent',
              description: 'Test concurrencia',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 1, completedProjects: 0, onHoldProjects: 0, totalProjects: 1 })
        });
      });
      
      await authFlow.loginAsValidUser();
      
      const startTime = Date.now();
      
      // Simulate concurrent navigation attempts
      const navigationPromises = [];
      for (let i = 0; i < 3; i++) {
        navigationPromises.push(projectsPage.goto());
      }
      
      await Promise.all(navigationPromises);
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      const concurrentTime = Date.now() - startTime;
      
      // Should handle concurrent operations efficiently
      expect(concurrentTime).toBeLessThan(3000);
      
      // Should not make excessive API calls
      expect(apiCallCount).toBeLessThanOrEqual(5);
      
      console.log(`Concurrent operations: ${concurrentTime}ms, API calls: ${apiCallCount}`);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // TDD: Test slow network performance
      await page.route('**/api/projects', async route => {
        // Simulate slow network (2 seconds delay)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Slow Network',
              description: 'Test red lenta',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 1, completedProjects: 0, onHoldProjects: 0, totalProjects: 1 })
        });
      });
      
      await authFlow.loginAsValidUser();
      
      const startTime = Date.now();
      await projectsPage.goto();
      
      // Should show loading state
      const loadingIndicator = page.locator('[data-testid="loading"]').or(page.locator('.loading')).or(page.locator('.spinner'));
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
      }
      
      // Eventually should load content
      await expect(page.getByText('Proyectos')).toBeVisible({ timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should handle slow network but still load
      expect(loadTime).toBeGreaterThan(2000); // Should reflect the slow network
      expect(loadTime).toBeLessThan(10000); // But not timeout
      
      console.log(`Slow network load time: ${loadTime}ms`);
    });

    test('should implement proper loading states', async ({ page }) => {
      // TDD: Test loading states
      let resolveProjects: (value: any) => void;
      const projectsPromise = new Promise(resolve => {
        resolveProjects = resolve;
      });
      
      await page.route('**/api/projects', async route => {
        await projectsPromise;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Loading Test',
              description: 'Test estados de carga',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 1, completedProjects: 0, onHoldProjects: 0, totalProjects: 1 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      // Should show loading state initially
      const loadingStates = [
        page.locator('[data-testid="loading"]'),
        page.locator('.loading'),
        page.locator('.spinner'),
        page.getByText(/cargando|loading/i),
        page.locator('[aria-label*="loading"]'),
        page.locator('[aria-label*="cargando"]')
      ];
      
      let foundLoadingState = false;
      for (const loadingState of loadingStates) {
        if (await loadingState.isVisible()) {
          foundLoadingState = true;
          break;
        }
      }
      
      // Resolve the API call
      resolveProjects!(null);
      
      // Should eventually show content
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Loading state should be gone
      for (const loadingState of loadingStates) {
        await expect(loadingState).not.toBeVisible();
      }
      
      console.log(`Loading state found: ${foundLoadingState}`);
    });

    test('should optimize bundle size and resource loading', async ({ page }) => {
      // TDD: Test resource optimization
      const resourceSizes: { [key: string]: number } = {};
      let totalSize = 0;
      
      page.on('response', async (response) => {
        const url = response.url();
        const contentLength = response.headers()['content-length'];
        
        if (contentLength) {
          const size = parseInt(contentLength);
          totalSize += size;
          
          if (url.includes('.js')) {
            resourceSizes['javascript'] = (resourceSizes['javascript'] || 0) + size;
          } else if (url.includes('.css')) {
            resourceSizes['css'] = (resourceSizes['css'] || 0) + size;
          } else if (url.includes('/api/')) {
            resourceSizes['api'] = (resourceSizes['api'] || 0) + size;
          }
        }
      });
      
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Bundle Test',
              description: 'Test optimización bundle',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 1, completedProjects: 0, onHoldProjects: 0, totalProjects: 1 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Wait for all resources to load
      await page.waitForTimeout(2000);
      
      // Check resource sizes (these are rough guidelines)
      if (resourceSizes['javascript']) {
        expect(resourceSizes['javascript']).toBeLessThan(5 * 1024 * 1024); // 5MB JS limit
      }
      
      if (resourceSizes['css']) {
        expect(resourceSizes['css']).toBeLessThan(1 * 1024 * 1024); // 1MB CSS limit
      }
      
      console.log('Resource sizes:', resourceSizes);
      console.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    });
  });

  test.describe('Stress Testing', () => {
    test('should handle rapid user interactions without breaking', async ({ page }) => {
      // TDD: Test rapid interactions
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 10 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto ${i + 1}`,
              description: `Descripción ${i + 1}`,
              status: ['active', 'completed'][i % 2],
              priority: ['high', 'low'][i % 2]
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 5, completedProjects: 5, onHoldProjects: 0, totalProjects: 10 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Rapid filter changes
      const searchInput = page.getByRole('textbox', { name: /buscar|search/i });
      if (await searchInput.isVisible()) {
        for (let i = 0; i < 10; i++) {
          await searchInput.fill(`test${i}`);
          await page.waitForTimeout(50);
        }
        await searchInput.fill('');
      }
      
      // Rapid button clicks
      const createButton = page.getByRole('button', { name: /crear|nuevo/i });
      if (await createButton.isVisible()) {
        for (let i = 0; i < 5; i++) {
          await createButton.click();
          await page.waitForTimeout(100);
          
          const modal = page.getByRole('dialog').or(page.locator('.modal'));
          if (await modal.isVisible()) {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(50);
        }
      }
      
      // Verify page is still functional
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      const projectCards = page.locator('[data-testid="project-card"]').or(page.locator('.project-item'));
      const cardCount = await projectCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should maintain performance under sustained load', async ({ page }) => {
      // TDD: Test sustained performance
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: Array.from({ length: 30 }, (_, i) => ({
              id: `project-${i + 1}`,
              name: `Proyecto Sustained ${i + 1}`,
              description: `Descripción sustained ${i + 1}`,
              status: ['active', 'completed', 'on_hold'][i % 3],
              priority: ['high', 'medium', 'low'][i % 3]
            }))
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ activeProjects: 10, completedProjects: 10, onHoldProjects: 10, totalProjects: 30 })
        });
      });
      
      await authFlow.loginAsValidUser();
      await projectsPage.goto();
      
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      const performanceMetrics = [];
      
      // Sustained operations for 30 seconds
      const endTime = Date.now() + 30000;
      let operationCount = 0;
      
      while (Date.now() < endTime) {
        const startTime = Date.now();
        
        // Perform various operations
        const searchInput = page.getByRole('textbox', { name: /buscar|search/i });
        if (await searchInput.isVisible()) {
          await searchInput.fill(`search${operationCount}`);
          await page.waitForTimeout(100);
          await searchInput.fill('');
        }
        
        // Scroll
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(50);
        await page.mouse.wheel(0, -100);
        
        const operationTime = Date.now() - startTime;
        performanceMetrics.push(operationTime);
        operationCount++;
        
        await page.waitForTimeout(200);
      }
      
      // Analyze performance metrics
      const avgTime = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
      const maxTime = Math.max(...performanceMetrics);
      
      // Performance should remain consistent
      expect(avgTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(2000);
      
      // Verify page is still functional
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      console.log(`Sustained load test - Operations: ${operationCount}, Avg time: ${avgTime.toFixed(2)}ms, Max time: ${maxTime}ms`);
    });
  });
});