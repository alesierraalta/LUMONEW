import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Projects Error Handling and Negative Cases - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authPage = new AuthPage(page);
  });

  test.describe('API Error Handling', () => {
    test('should handle 500 server error when loading projects', async ({ page }) => {
      // TDD: Test server error handling
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Mock metrics API to succeed
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.login('test@example.com', 'password123');
      await projectsPage.goto();
      
      // Verify error handling
      await expect(page.getByText(/error.*cargar.*proyectos/i).or(page.getByText(/algo salió mal/i))).toBeVisible({ timeout: 10000 });
      
      // Verify retry mechanism if available
      const retryButton = page.getByRole('button', { name: /reintentar|volver a intentar/i });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    });

    test('should handle 404 error when loading projects', async ({ page }) => {
      // TDD: Test not found error
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Projects not found' })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.login('test@example.com', 'password123');
      await projectsPage.goto();
      
      // Verify 404 handling
      await expect(page.getByText(/no.*encontr.*proyectos/i).or(page.getByText(/no hay proyectos/i))).toBeVisible({ timeout: 10000 });
    });

    test('should handle network timeout when loading projects', async ({ page }) => {
      // TDD: Test network timeout
      await page.route('**/api/projects', async route => {
        // Simulate timeout by not responding
        await new Promise(resolve => setTimeout(resolve, 30000));
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Request timeout' })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify timeout handling
      await expect(page.getByText(/tiempo.*agotado|timeout/i).or(page.getByText(/error.*conexión/i))).toBeVisible({ timeout: 35000 });
    });

    test('should handle malformed JSON response', async ({ page }) => {
      // TDD: Test malformed data handling
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify malformed data handling
      await expect(page.getByText(/error.*datos|datos.*inválidos/i).or(page.getByText(/algo salió mal/i))).toBeVisible({ timeout: 10000 });
    });

    test('should handle metrics API failure gracefully', async ({ page }) => {
      // TDD: Test metrics API error
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: []
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Metrics service unavailable' })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify page still loads without metrics
      await expect(page.getByText('Proyectos')).toBeVisible();
      
      // Verify metrics show error state or default values
      const metricsSection = page.locator('[data-testid="metrics-section"]').or(page.locator('.metrics'));
      if (await metricsSection.isVisible()) {
        await expect(metricsSection.getByText(/error|--/i)).toBeVisible();
      }
    });
  });

  test.describe('Form Validation Errors', () => {
    test('should handle project creation API error', async ({ page }) => {
      // TDD: Test form submission error
      await page.route('**/api/projects', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] })
          });
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation failed',
              details: {
                name: 'Project name already exists',
                description: 'Description is too long'
              }
            })
          });
        }
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Open form and fill with valid data
      await projectsPage.clickCreateProjectButton();
      await projectsPage.fillProjectForm({
        name: 'Proyecto Duplicado',
        description: 'Descripción muy larga que excede el límite permitido por el sistema',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        priority: 'high'
      });
      
      // Submit form
      await projectsPage.submitProjectForm();
      
      // Verify server validation errors are displayed
      await expect(page.getByText(/nombre.*ya existe/i)).toBeVisible();
      await expect(page.getByText(/descripción.*muy larga/i)).toBeVisible();
      
      // Verify form remains open for correction
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should handle network error during form submission', async ({ page }) => {
      // TDD: Test network error during submission
      await page.route('**/api/projects', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] })
          });
        } else if (route.request().method() === 'POST') {
          await route.abort('failed');
        }
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Fill and submit form
      await projectsPage.clickCreateProjectButton();
      await projectsPage.fillProjectForm({
        name: 'Proyecto Test',
        description: 'Descripción de prueba',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        priority: 'medium'
      });
      
      await projectsPage.submitProjectForm();
      
      // Verify network error handling
      await expect(page.getByText(/error.*conexión|error.*red/i)).toBeVisible();
      
      // Verify form data is preserved
      await expect(page.getByDisplayValue('Proyecto Test')).toBeVisible();
    });
  });

  test.describe('Authentication and Authorization Errors', () => {
    test('should handle unauthorized access (401)', async ({ page }) => {
      // TDD: Test unauthorized access
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify redirect to login or error message
      await expect(page.getByText(/no autorizado|iniciar sesión/i).or(page.locator('input[type="email"]'))).toBeVisible({ timeout: 10000 });
    });

    test('should handle forbidden access (403)', async ({ page }) => {
      // TDD: Test forbidden access
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden - Insufficient permissions' })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify forbidden error handling
      await expect(page.getByText(/sin permisos|acceso denegado/i)).toBeVisible({ timeout: 10000 });
    });

    test('should handle session expiration during usage', async ({ page }) => {
      // TDD: Test session expiration
      let requestCount = 0;
      
      await page.route('**/api/projects', async route => {
        requestCount++;
        if (requestCount === 1) {
          // First request succeeds
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] })
          });
        } else {
          // Subsequent requests fail with 401
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Session expired' })
          });
        }
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Trigger a refresh or action that causes another API call
      await page.reload();
      
      // Verify session expiration handling
      await expect(page.getByText(/sesión.*expirada|iniciar sesión/i).or(page.locator('input[type="email"]'))).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Data Integrity and Edge Cases', () => {
    test('should handle empty project list gracefully', async ({ page }) => {
      // TDD: Test empty state
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify empty state is displayed properly
      await expect(page.getByText(/no hay proyectos|sin proyectos/i)).toBeVisible();
      await expect(page.getByText('0').first()).toBeVisible(); // Metrics should show 0
    });

    test('should handle projects with missing or null fields', async ({ page }) => {
      // TDD: Test data with missing fields
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'project-1',
                name: 'Proyecto Completo',
                description: 'Descripción completa',
                status: 'active',
                priority: 'high'
              },
              {
                id: 'project-2',
                name: 'Proyecto Incompleto',
                description: null,
                status: null,
                priority: undefined
              },
              {
                id: 'project-3',
                name: null,
                description: 'Sin nombre',
                status: 'active',
                priority: 'low'
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
            activeProjects: 2,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 3
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify projects with missing data are handled gracefully
      await expect(page.getByText('Proyecto Completo')).toBeVisible();
      await expect(page.getByText('Proyecto Incompleto')).toBeVisible();
      
      // Verify fallback values for missing data
      await expect(page.getByText(/sin.*nombre|nombre.*disponible/i).or(page.getByText('project-3'))).toBeVisible();
    });

    test('should handle extremely long project names and descriptions', async ({ page }) => {
      // TDD: Test data overflow
      const longName = 'A'.repeat(500);
      const longDescription = 'B'.repeat(2000);
      
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'project-1',
                name: longName,
                description: longDescription,
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
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify long text is handled (truncated or scrollable)
      const projectCard = page.locator('[data-testid="project-card"]').or(page.locator('.project-item')).first();
      await expect(projectCard).toBeVisible();
      
      // Verify text doesn't break layout
      const viewport = page.viewportSize();
      if (viewport) {
        const cardBox = await projectCard.boundingBox();
        expect(cardBox?.width).toBeLessThanOrEqual(viewport.width);
      }
    });

    test('should handle special characters and unicode in project data', async ({ page }) => {
      // TDD: Test special characters
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'project-1',
                name: 'Proyecto con émojis 🚀💻🎯',
                description: 'Descripción con caracteres especiales: áéíóú ñÑ @#$%&*()[]{}',
                status: 'active',
                priority: 'high'
              },
              {
                id: 'project-2',
                name: '中文项目名称',
                description: 'Проект с русскими символами',
                status: 'completed',
                priority: 'medium'
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
            onHoldProjects: 0,
            totalProjects: 2
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify special characters are displayed correctly
      await expect(page.getByText('Proyecto con émojis 🚀💻🎯')).toBeVisible();
      await expect(page.getByText('中文项目名称')).toBeVisible();
      await expect(page.getByText('áéíóú ñÑ @#$%&*()')).toBeVisible();
    });
  });

  test.describe('Browser and Environment Edge Cases', () => {
    test('should handle offline/online state changes', async ({ page }) => {
      // TDD: Test offline handling
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Simulate going offline
      await page.context().setOffline(true);
      
      // Try to refresh or perform an action
      await page.reload();
      
      // Verify offline handling
      await expect(page.getByText(/sin conexión|offline/i).or(page.getByText(/error.*conexión/i))).toBeVisible({ timeout: 10000 });
      
      // Go back online
      await page.context().setOffline(false);
    });

    test('should handle slow network conditions', async ({ page }) => {
      // TDD: Test slow network
      await page.route('**/api/projects', async route => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Verify loading state is shown during slow requests
      await expect(page.getByText(/cargando|loading/i).or(page.locator('[data-testid="loading"]'))).toBeVisible();
      
      // Wait for content to load
      await expect(page.getByText('Proyectos')).toBeVisible({ timeout: 10000 });
    });

    test('should handle browser back/forward navigation errors', async ({ page }) => {
      // TDD: Test navigation edge cases
      await page.route('**/api/projects', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Navigate away and back
      await page.goto('http://localhost:3000/es');
      await page.goBack();
      
      // Verify page still works after navigation
      await expect(page.getByText('Proyectos')).toBeVisible();
    });
  });

  test.describe('Concurrent Operations and Race Conditions', () => {
    test('should handle multiple simultaneous API calls', async ({ page }) => {
      // TDD: Test concurrent requests
      let callCount = 0;
      
      await page.route('**/api/projects', async route => {
        callCount++;
        // Simulate varying response times
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            data: [],
            callNumber: callCount
          })
        });
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Trigger multiple rapid refreshes
      await Promise.all([
        page.reload(),
        page.reload(),
        page.reload()
      ]);
      
      // Verify page still functions correctly
      await expect(page.getByText('Proyectos')).toBeVisible();
    });

    test('should handle form submission during page refresh', async ({ page }) => {
      // TDD: Test race condition during form submission
      await page.route('**/api/projects', async route => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] })
          });
        } else if (route.request().method() === 'POST') {
          // Simulate slow form submission
          await new Promise(resolve => setTimeout(resolve, 3000));
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, id: 'new-project' })
          });
        }
      });
      
      await page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: 0,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: 0
          })
        });
      });
      
      await authPage.loginAsValidUser();
      await projectsPage.goto();
      
      // Start form submission
      await projectsPage.clickCreateProjectButton();
      await projectsPage.fillProjectForm({
        name: 'Proyecto Test',
        description: 'Descripción',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        priority: 'medium'
      });
      
      // Submit form and immediately refresh page
      await Promise.all([
        projectsPage.submitProjectForm(),
        page.reload()
      ]);
      
      // Verify no errors occur and page loads correctly
      await expect(page.getByText('Proyectos')).toBeVisible();
    });
  });
});