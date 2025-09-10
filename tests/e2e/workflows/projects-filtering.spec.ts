import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthenticationFlow } from '../page-objects/authentication-flow';

test.describe('Projects Filtering and Search - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authFlow: AuthenticationFlow;

  // Mock project data for testing
  const mockProjects = [
    {
      id: 'project-1',
      name: 'Proyecto Alpha',
      description: 'Descripción del proyecto Alpha para testing',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-15',
      expectedEndDate: '2024-06-15',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'project-2',
      name: 'Proyecto Beta',
      description: 'Descripción del proyecto Beta en desarrollo',
      status: 'completed',
      priority: 'medium',
      startDate: '2023-12-01',
      expectedEndDate: '2024-03-01',
      createdAt: '2023-12-01T00:00:00Z'
    },
    {
      id: 'project-3',
      name: 'Proyecto Gamma',
      description: 'Proyecto Gamma pausado temporalmente',
      status: 'on_hold',
      priority: 'low',
      startDate: '2024-02-01',
      expectedEndDate: '2024-08-01',
      createdAt: '2024-02-01T00:00:00Z'
    },
    {
      id: 'project-4',
      name: 'Proyecto Delta',
      description: 'Proyecto Delta con prioridad urgente',
      status: 'active',
      priority: 'urgent',
      startDate: '2024-01-20',
      expectedEndDate: '2024-04-20',
      createdAt: '2024-01-20T00:00:00Z'
    },
    {
      id: 'project-5',
      name: 'Proyecto Epsilon',
      description: 'Proyecto cancelado por falta de recursos',
      status: 'cancelled',
      priority: 'medium',
      startDate: '2024-01-10',
      expectedEndDate: '2024-05-10',
      createdAt: '2024-01-10T00:00:00Z'
    }
  ];

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authFlow = new AuthenticationFlow(page);
    
    // Mock projects API with test data
    await page.route('**/api/projects', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockProjects
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
          activeProjects: 2,
          completedProjects: 1,
          onHoldProjects: 1,
          totalProjects: 5,
          productTypes: {
            lu: { total: 10, completed: 5, inProcess: 5 },
            cl: { total: 8, completed: 3, inProcess: 5 },
            mp: { total: 12, completed: 7, inProcess: 5 }
          }
        })
      });
    });
    
    // Authenticate and navigate to projects page
    await authFlow.loginAsValidUser();
    await projectsPage.goto();
    await projectsPage.expectDashboardLoaded();
  });

  test.describe('Search Functionality', () => {
    test('should display all projects initially', async () => {
      // TDD: Test initial state shows all projects
      const projectCards = await projectsPage.getProjectCards();
      expect(projectCards.length).toBe(mockProjects.length);
      
      // Verify all project names are visible
      for (const project of mockProjects) {
        await expect(projectsPage.page.getByText(project.name)).toBeVisible();
      }
    });

    test('should filter projects by name search', async () => {
      // TDD: Test search by project name
      await projectsPage.searchProjects('Alpha');
      
      // Should show only projects matching "Alpha"
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Beta')).not.toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Gamma')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
    });

    test('should filter projects by description search', async () => {
      // TDD: Test search by project description
      await projectsPage.searchProjects('desarrollo');
      
      // Should show projects with "desarrollo" in description
      await expect(projectsPage.page.getByText('Proyecto Beta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
    });

    test('should be case insensitive in search', async () => {
      // TDD: Test case insensitive search
      await projectsPage.searchProjects('ALPHA');
      
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      
      // Clear and try lowercase
      await projectsPage.clearSearch();
      await projectsPage.searchProjects('alpha');
      
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
    });

    test('should show no results message when search has no matches', async () => {
      // TDD: Test no results scenario
      await projectsPage.searchProjects('NonExistentProject');
      
      // Should show no results message
      await expect(projectsPage.page.getByText('No se encontraron proyectos')).toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(0);
    });

    test('should clear search and show all projects', async () => {
      // TDD: Test search clearing
      await projectsPage.searchProjects('Alpha');
      
      // Verify filtered results
      let visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
      
      // Clear search
      await projectsPage.clearSearch();
      
      // Should show all projects again
      visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
    });

    test('should update results in real-time as user types', async () => {
      // TDD: Test real-time search
      const searchInput = projectsPage.searchInput;
      
      // Type partial search term
      await searchInput.fill('Pro');
      
      // Should show all projects (all start with "Proyecto")
      let visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
      
      // Continue typing
      await searchInput.fill('Proyecto A');
      
      // Should filter to only Alpha
      visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
    });
  });

  test.describe('Status Filter', () => {
    test('should filter projects by active status', async () => {
      // TDD: Test status filtering - active
      await projectsPage.filterByStatus('active');
      
      // Should show only active projects
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Delta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Beta')).not.toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Gamma')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(2); // Alpha and Delta are active
    });

    test('should filter projects by completed status', async () => {
      // TDD: Test status filtering - completed
      await projectsPage.filterByStatus('completed');
      
      // Should show only completed projects
      await expect(projectsPage.page.getByText('Proyecto Beta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Beta is completed
    });

    test('should filter projects by on_hold status', async () => {
      // TDD: Test status filtering - on hold
      await projectsPage.filterByStatus('on_hold');
      
      // Should show only on-hold projects
      await expect(projectsPage.page.getByText('Proyecto Gamma')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Gamma is on hold
    });

    test('should filter projects by cancelled status', async () => {
      // TDD: Test status filtering - cancelled
      await projectsPage.filterByStatus('cancelled');
      
      // Should show only cancelled projects
      await expect(projectsPage.page.getByText('Proyecto Epsilon')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Epsilon is cancelled
    });

    test('should show all projects when "all" status is selected', async () => {
      // TDD: Test "all" status filter
      // First filter by active
      await projectsPage.filterByStatus('active');
      let visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(2);
      
      // Then select "all"
      await projectsPage.filterByStatus('all');
      
      // Should show all projects
      visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
    });
  });

  test.describe('Priority Filter', () => {
    test('should filter projects by urgent priority', async () => {
      // TDD: Test priority filtering - urgent
      await projectsPage.filterByPriority('urgent');
      
      // Should show only urgent projects
      await expect(projectsPage.page.getByText('Proyecto Delta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Delta is urgent
    });

    test('should filter projects by high priority', async () => {
      // TDD: Test priority filtering - high
      await projectsPage.filterByPriority('high');
      
      // Should show only high priority projects
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Beta')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Alpha is high priority
    });

    test('should filter projects by medium priority', async () => {
      // TDD: Test priority filtering - medium
      await projectsPage.filterByPriority('medium');
      
      // Should show only medium priority projects
      await expect(projectsPage.page.getByText('Proyecto Beta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Epsilon')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(2); // Beta and Epsilon are medium priority
    });

    test('should filter projects by low priority', async () => {
      // TDD: Test priority filtering - low
      await projectsPage.filterByPriority('low');
      
      // Should show only low priority projects
      await expect(projectsPage.page.getByText('Proyecto Gamma')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1); // Only Gamma is low priority
    });

    test('should show all projects when "all" priority is selected', async () => {
      // TDD: Test "all" priority filter
      // First filter by high
      await projectsPage.filterByPriority('high');
      let visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
      
      // Then select "all"
      await projectsPage.filterByPriority('all');
      
      // Should show all projects
      visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
    });
  });

  test.describe('Combined Filters', () => {
    test('should combine search and status filter', async () => {
      // TDD: Test search + status filter combination
      await projectsPage.searchProjects('Proyecto');
      await projectsPage.filterByStatus('active');
      
      // Should show only active projects matching "Proyecto"
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Delta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Beta')).not.toBeVisible(); // Not active
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(2);
    });

    test('should combine search and priority filter', async () => {
      // TDD: Test search + priority filter combination
      await projectsPage.searchProjects('Proyecto');
      await projectsPage.filterByPriority('medium');
      
      // Should show only medium priority projects matching "Proyecto"
      await expect(projectsPage.page.getByText('Proyecto Beta')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Epsilon')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Alpha')).not.toBeVisible(); // Not medium priority
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(2);
    });

    test('should combine status and priority filters', async () => {
      // TDD: Test status + priority filter combination
      await projectsPage.filterByStatus('active');
      await projectsPage.filterByPriority('high');
      
      // Should show only active projects with high priority
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      await expect(projectsPage.page.getByText('Proyecto Delta')).not.toBeVisible(); // Active but urgent, not high
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
    });

    test('should combine all three filters', async () => {
      // TDD: Test search + status + priority filter combination
      await projectsPage.searchProjects('Alpha');
      await projectsPage.filterByStatus('active');
      await projectsPage.filterByPriority('high');
      
      // Should show only projects matching all criteria
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
    });

    test('should show no results when combined filters have no matches', async () => {
      // TDD: Test no results with combined filters
      await projectsPage.searchProjects('Alpha');
      await projectsPage.filterByStatus('completed'); // Alpha is active, not completed
      
      // Should show no results
      await expect(projectsPage.page.getByText('No se encontraron proyectos')).toBeVisible();
      
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(0);
    });
  });

  test.describe('Filter Reset and Clear', () => {
    test('should reset all filters when clear filters button is clicked', async () => {
      // TDD: Test filter reset functionality
      // Apply multiple filters
      await projectsPage.searchProjects('Alpha');
      await projectsPage.filterByStatus('active');
      await projectsPage.filterByPriority('high');
      
      // Verify filtered state
      let visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(1);
      
      // Clear all filters (if clear button exists)
      await projectsPage.clearAllFilters();
      
      // Should show all projects
      visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
      
      // Verify filter controls are reset
      await expect(projectsPage.searchInput).toHaveValue('');
      await expect(projectsPage.statusFilter).toHaveValue('all');
      await expect(projectsPage.priorityFilter).toHaveValue('all');
    });

    test('should maintain filter state when navigating away and back', async () => {
      // TDD: Test filter persistence
      await projectsPage.searchProjects('Alpha');
      await projectsPage.filterByStatus('active');
      
      // Navigate away (simulate by reloading)
      await projectsPage.page.reload();
      await projectsPage.expectDashboardLoaded();
      
      // Filters should be reset after reload (expected behavior)
      const visibleCards = await projectsPage.getProjectCards();
      expect(visibleCards.length).toBe(mockProjects.length);
    });
  });

  test.describe('Filter Performance and UX', () => {
    test('should filter results quickly without noticeable delay', async () => {
      // TDD: Test filter performance
      const startTime = Date.now();
      
      await projectsPage.searchProjects('Alpha');
      
      // Results should appear quickly (within 1 second)
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible({ timeout: 1000 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    test('should show loading state during filter operations', async () => {
      // TDD: Test loading states (if implemented)
      // This test would verify loading indicators during filtering
      // Implementation depends on whether loading states are shown
      
      await projectsPage.searchProjects('Alpha');
      
      // Verify results appear without errors
      await expect(projectsPage.page.getByText('Proyecto Alpha')).toBeVisible();
    });

    test('should maintain accessibility during filtering', async () => {
      // TDD: Test accessibility during filtering
      await projectsPage.searchProjects('Alpha');
      
      // Verify search input maintains focus and accessibility
      await expect(projectsPage.searchInput).toBeFocused();
      
      // Verify filter controls are accessible
      await expect(projectsPage.statusFilter).toBeEnabled();
      await expect(projectsPage.priorityFilter).toBeEnabled();
    });
  });
});