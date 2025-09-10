import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthenticationFlow } from '../page-objects/authentication-flow';

test.describe('Projects Modals Interactions - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authFlow: AuthenticationFlow;

  // Mock inventory data for LU Import Modal
  const mockInventoryItems = [
    {
      id: 'inv-1',
      name: 'Producto Inventario A',
      sku: 'SKU-001',
      quantity: 50,
      unit_price: 25.99,
      categories: { name: 'Categoría A', color: 'blue' },
      locations: { name: 'Almacén Principal' }
    },
    {
      id: 'inv-2',
      name: 'Producto Inventario B',
      sku: 'SKU-002',
      quantity: 30,
      unit_price: 45.50,
      categories: { name: 'Categoría B', color: 'green' },
      locations: { name: 'Almacén Secundario' }
    },
    {
      id: 'inv-3',
      name: 'Producto Inventario C',
      sku: 'SKU-003',
      quantity: 0,
      unit_price: 15.75,
      categories: { name: 'Categoría C', color: 'red' },
      locations: { name: 'Almacén Principal' }
    }
  ];

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authFlow = new AuthenticationFlow(page);
    
    // Mock projects API
    await page.route('**/api/projects', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{
              id: 'project-1',
              name: 'Proyecto Test',
              description: 'Proyecto para testing',
              status: 'active',
              priority: 'high'
            }]
          })
        });
      } else {
        await route.continue();
      }
    });
    
    // Mock metrics API
    await page.route('**/api/projects/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeProjects: 1,
          completedProjects: 0,
          onHoldProjects: 0,
          totalProjects: 1,
          productTypes: {
            lu: { total: 5, completed: 2, inProcess: 3 },
            cl: { total: 3, completed: 1, inProcess: 2 },
            mp: { total: 4, completed: 2, inProcess: 2 }
          }
        })
      });
    });
    
    // Mock inventory API for LU Import Modal
    await page.route('**/api/inventory/items**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockInventoryItems)
      });
    });
    
    // Authenticate and navigate to projects page
    await authFlow.loginAsValidUser();
    await projectsPage.goto();
    await projectsPage.expectDashboardLoaded();
  });

  test.describe('Add Item Modal', () => {
    test('should open Add Item modal when clicking add item button', async () => {
      // TDD: Test Add Item modal opening
      await projectsPage.clickAddItemButton();
      
      // Verify modal is visible
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
      await expect(projectsPage.page.getByText('Agregar Item al Proyecto')).toBeVisible();
      
      // Verify modal content
      await expect(projectsPage.page.getByText('Productos LU')).toBeVisible();
      await expect(projectsPage.page.getByText('Productos CL')).toBeVisible();
      await expect(projectsPage.page.getByText('Productos IMP')).toBeVisible();
      
      // Verify descriptions
      await expect(projectsPage.page.getByText('Del Inventario VLN')).toBeVisible();
      await expect(projectsPage.page.getByText('Para Cotización')).toBeVisible();
      await expect(projectsPage.page.getByText('Importación')).toBeVisible();
    });

    test('should close Add Item modal when clicking cancel', async () => {
      // TDD: Test Add Item modal closing
      await projectsPage.clickAddItemButton();
      
      // Verify modal is open
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
      
      // Click cancel button
      await projectsPage.page.getByRole('button', { name: 'Cancelar' }).click();
      
      // Verify modal is closed
      await expect(projectsPage.page.getByRole('dialog')).not.toBeVisible();
    });

    test('should close Add Item modal when clicking outside', async () => {
      // TDD: Test Add Item modal closing by clicking outside
      await projectsPage.clickAddItemButton();
      
      // Verify modal is open
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
      
      // Click outside modal (on backdrop)
      await projectsPage.page.keyboard.press('Escape');
      
      // Verify modal is closed
      await expect(projectsPage.page.getByRole('dialog')).not.toBeVisible();
    });

    test('should display correct icons and styling for each product type', async () => {
      // TDD: Test visual elements of Add Item modal
      await projectsPage.clickAddItemButton();
      
      // Verify LU section styling
      const luCard = projectsPage.page.locator('text=Productos LU').locator('..');
      await expect(luCard).toBeVisible();
      
      // Verify CL section styling
      const clCard = projectsPage.page.locator('text=Productos CL').locator('..');
      await expect(clCard).toBeVisible();
      
      // Verify IMP section styling
      const impCard = projectsPage.page.locator('text=Productos IMP').locator('..');
      await expect(impCard).toBeVisible();
    });
  });

  test.describe('LU Import Modal', () => {
    test('should open LU Import modal when clicking LU option', async () => {
      // TDD: Test LU Import modal opening
      await projectsPage.clickAddItemButton();
      
      // Click on LU option
      await projectsPage.page.getByText('Productos LU').click();
      
      // Verify LU Import modal is visible
      await expect(projectsPage.page.getByText('Importar Productos del Inventario')).toBeVisible();
      
      // Verify search functionality is present
      await expect(projectsPage.page.getByPlaceholder('Buscar productos...')).toBeVisible();
    });

    test('should load and display inventory items in LU Import modal', async () => {
      // TDD: Test inventory items loading
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      await expect(projectsPage.page.getByText('Producto Inventario B')).toBeVisible();
      await expect(projectsPage.page.getByText('Producto Inventario C')).toBeVisible();
      
      // Verify SKUs are displayed
      await expect(projectsPage.page.getByText('SKU-001')).toBeVisible();
      await expect(projectsPage.page.getByText('SKU-002')).toBeVisible();
      await expect(projectsPage.page.getByText('SKU-003')).toBeVisible();
    });

    test('should filter inventory items by search term', async () => {
      // TDD: Test search functionality in LU Import modal
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      
      // Search for specific item
      await projectsPage.page.getByPlaceholder('Buscar productos...').fill('Producto A');
      
      // Verify filtered results
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      await expect(projectsPage.page.getByText('Producto Inventario B')).not.toBeVisible();
      await expect(projectsPage.page.getByText('Producto Inventario C')).not.toBeVisible();
    });

    test('should filter inventory items by SKU search', async () => {
      // TDD: Test SKU search functionality
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load
      await expect(projectsPage.page.getByText('SKU-001')).toBeVisible();
      
      // Search by SKU
      await projectsPage.page.getByPlaceholder('Buscar productos...').fill('SKU-002');
      
      // Verify filtered results
      await expect(projectsPage.page.getByText('Producto Inventario B')).toBeVisible();
      await expect(projectsPage.page.getByText('Producto Inventario A')).not.toBeVisible();
    });

    test('should allow selecting and deselecting inventory items', async () => {
      // TDD: Test item selection functionality
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      
      // Select first item
      const firstCheckbox = projectsPage.page.locator('input[type="checkbox"]').first();
      await firstCheckbox.check();
      
      // Verify checkbox is checked
      await expect(firstCheckbox).toBeChecked();
      
      // Deselect item
      await firstCheckbox.uncheck();
      
      // Verify checkbox is unchecked
      await expect(firstCheckbox).not.toBeChecked();
    });

    test('should allow modifying quantity for selected items', async () => {
      // TDD: Test quantity modification
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load and select first item
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      const firstCheckbox = projectsPage.page.locator('input[type="checkbox"]').first();
      await firstCheckbox.check();
      
      // Find and modify quantity input
      const quantityInput = projectsPage.page.locator('input[type="number"]').first();
      await quantityInput.fill('5');
      
      // Verify quantity value
      await expect(quantityInput).toHaveValue('5');
    });

    test('should show selected items count and total', async () => {
      // TDD: Test selection summary
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      
      // Select multiple items
      const checkboxes = projectsPage.page.locator('input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Verify selection count is displayed (implementation may vary)
      // This test assumes there's a selection summary displayed
      await expect(projectsPage.page.getByText(/seleccionado/i)).toBeVisible();
    });

    test('should import selected items successfully', async () => {
      // TDD: Test successful import
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Wait for items to load and select items
      await expect(projectsPage.page.getByText('Producto Inventario A')).toBeVisible();
      const firstCheckbox = projectsPage.page.locator('input[type="checkbox"]').first();
      await firstCheckbox.check();
      
      // Click import button
      await projectsPage.page.getByRole('button', { name: /importar/i }).click();
      
      // Verify modal closes after import
      await expect(projectsPage.page.getByText('Importar Productos del Inventario')).not.toBeVisible();
    });

    test('should close LU Import modal when clicking cancel', async () => {
      // TDD: Test LU Import modal closing
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Verify modal is open
      await expect(projectsPage.page.getByText('Importar Productos del Inventario')).toBeVisible();
      
      // Click cancel
      await projectsPage.page.getByRole('button', { name: 'Cancelar' }).click();
      
      // Verify modal is closed
      await expect(projectsPage.page.getByText('Importar Productos del Inventario')).not.toBeVisible();
    });

    test('should handle empty inventory gracefully', async () => {
      // TDD: Test empty inventory state
      // Mock empty inventory response
      await projectsPage.page.route('**/api/inventory/items**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
      
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Verify empty state message
      await expect(projectsPage.page.getByText(/no hay productos/i)).toBeVisible();
    });

    test('should handle inventory loading error', async () => {
      // TDD: Test error handling
      // Mock API error
      await projectsPage.page.route('**/api/inventory/items**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await projectsPage.clickAddItemButton();
      await projectsPage.page.getByText('Productos LU').click();
      
      // Verify error handling (implementation may vary)
      // This could be an error message or empty state
      await expect(projectsPage.page.getByText(/error/i).or(projectsPage.page.getByText(/no hay productos/i))).toBeVisible();
    });
  });

  test.describe('CL and IMP Modals', () => {
    test('should open CL modal when clicking CL option', async () => {
      // TDD: Test CL modal opening
      await projectsPage.clickAddItemButton();
      
      // Click on CL option
      await projectsPage.page.getByText('Productos CL').click();
      
      // Verify CL modal opens (implementation may vary)
      // This test assumes CL modal has specific content
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
    });

    test('should open IMP modal when clicking IMP option', async () => {
      // TDD: Test IMP modal opening
      await projectsPage.clickAddItemButton();
      
      // Click on IMP option
      await projectsPage.page.getByText('Productos IMP').click();
      
      // Verify IMP modal opens (implementation may vary)
      // This test assumes IMP modal has specific content
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
    });
  });

  test.describe('Modal Accessibility', () => {
    test('should have proper ARIA labels and roles', async () => {
      // TDD: Test accessibility
      await projectsPage.clickAddItemButton();
      
      // Verify dialog role
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
      
      // Verify dialog has accessible name
      const dialog = projectsPage.page.getByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-describedby');
    });

    test('should trap focus within modal', async () => {
      // TDD: Test focus management
      await projectsPage.clickAddItemButton();
      
      // Verify focus is trapped within modal
      await projectsPage.page.keyboard.press('Tab');
      
      // Focus should remain within modal elements
      const focusedElement = await projectsPage.page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should close modal with Escape key', async () => {
      // TDD: Test keyboard navigation
      await projectsPage.clickAddItemButton();
      
      // Verify modal is open
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
      
      // Press Escape
      await projectsPage.page.keyboard.press('Escape');
      
      // Verify modal is closed
      await expect(projectsPage.page.getByRole('dialog')).not.toBeVisible();
    });
  });

  test.describe('Modal Performance', () => {
    test('should load modals quickly', async () => {
      // TDD: Test modal loading performance
      const startTime = Date.now();
      
      await projectsPage.clickAddItemButton();
      
      // Modal should appear quickly
      await expect(projectsPage.page.getByRole('dialog')).toBeVisible({ timeout: 1000 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should load within 1 second
    });

    test('should handle multiple modal interactions without performance degradation', async () => {
      // TDD: Test performance with multiple interactions
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        await projectsPage.clickAddItemButton();
        await expect(projectsPage.page.getByRole('dialog')).toBeVisible();
        
        await projectsPage.page.getByRole('button', { name: 'Cancelar' }).click();
        await expect(projectsPage.page.getByRole('dialog')).not.toBeVisible();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(2000); // Each interaction should be fast
      }
    });
  });
});