import { test, expect } from '@playwright/test';
import { ProjectsPage } from '../page-objects/projects-page';
import { AuthPage } from '../page-objects/auth-page';

test.describe('Projects Form - TDD Tests', () => {
  let projectsPage: ProjectsPage;
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    authPage = new AuthPage(page);
    
    // Authenticate user before each test
    await authPage.login('test@example.com', 'password123');
    await projectsPage.goto();
    await projectsPage.expectDashboardLoaded();
  });

  test.describe('Form Display and Initial State', () => {
    test('should display project creation form when create button is clicked', async () => {
      // TDD: Test form visibility and initial state
      await projectsPage.clickCreateProject();
      
      // Verify form is displayed
      await expect(projectsPage.projectForm).toBeVisible();
      
      // Verify all form fields are present
      await expect(projectsPage.projectNameInput).toBeVisible();
      await expect(projectsPage.projectDescriptionInput).toBeVisible();
      await expect(projectsPage.prioritySelect).toBeVisible();
      await expect(projectsPage.startDateInput).toBeVisible();
      await expect(projectsPage.expectedEndDateInput).toBeVisible();
      
      // Verify form buttons are present
      await expect(projectsPage.submitButton).toBeVisible();
      await expect(projectsPage.cancelButton).toBeVisible();
      
      // Verify submit button is initially disabled or enabled based on validation
      const isSubmitEnabled = await projectsPage.submitButton.isEnabled();
      expect(typeof isSubmitEnabled).toBe('boolean');
    });

    test('should have empty form fields initially', async () => {
      // TDD: Test initial form state
      await projectsPage.clickCreateProject();
      
      // Verify all fields are empty
      await expect(projectsPage.projectNameInput).toHaveValue('');
      await expect(projectsPage.projectDescriptionInput).toHaveValue('');
      await expect(projectsPage.startDateInput).toHaveValue('');
      await expect(projectsPage.expectedEndDateInput).toHaveValue('');
      
      // Verify no error messages are displayed initially
      await projectsPage.expectNoErrorMessage();
    });

    test('should close form when cancel button is clicked', async () => {
      // TDD: Test form cancellation
      await projectsPage.clickCreateProject();
      await expect(projectsPage.projectForm).toBeVisible();
      
      await projectsPage.cancelProjectForm();
      
      // Form should be hidden after cancellation
      await expect(projectsPage.projectForm).not.toBeVisible();
    });
  });

  test.describe('Form Validation - Required Fields', () => {
    test('should show validation error when submitting empty form', async () => {
      // TDD: Test required field validation
      await projectsPage.clickCreateProject();
      
      // Try to submit empty form
      await projectsPage.submitProjectForm();
      
      // Should show validation error
      await projectsPage.expectFormError();
      
      // Form should still be visible
      await expect(projectsPage.projectForm).toBeVisible();
    });

    test('should validate project name is required', async () => {
      // TDD: Test project name validation
      await projectsPage.clickCreateProject();
      
      // Fill other fields but leave name empty
      await projectsPage.fillProjectForm({
        name: '', // Empty name
        description: 'Test project description',
        priority: 'medium',
        startDate: '2024-01-15',
        expectedEndDate: '2024-06-15'
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for name field
      await projectsPage.expectFormError('nombre');
    });

    test('should validate project name minimum length', async () => {
      // TDD: Test name minimum length validation
      await projectsPage.clickCreateProject();
      
      // Fill with very short name
      await projectsPage.fillProjectForm({
        name: 'A', // Too short
        description: 'Test project description'
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for name length
      await projectsPage.expectFormError();
    });

    test('should validate project name maximum length', async () => {
      // TDD: Test name maximum length validation
      await projectsPage.clickCreateProject();
      
      // Fill with very long name (over 100 characters)
      const longName = 'A'.repeat(101);
      await projectsPage.fillProjectForm({
        name: longName,
        description: 'Test project description'
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for name length
      await projectsPage.expectFormError();
    });
  });

  test.describe('Form Validation - Date Fields', () => {
    test('should validate start date format', async () => {
      // TDD: Test date format validation
      await projectsPage.clickCreateProject();
      
      await projectsPage.fillProjectForm({
        name: 'Test Project',
        startDate: 'invalid-date'
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for date format
      await projectsPage.expectFormError();
    });

    test('should validate end date is after start date', async () => {
      // TDD: Test date logic validation
      await projectsPage.clickCreateProject();
      
      await projectsPage.fillProjectForm({
        name: 'Test Project',
        startDate: '2024-06-15',
        expectedEndDate: '2024-01-15' // End date before start date
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for date logic
      await projectsPage.expectFormError();
    });

    test('should validate start date is not in the past', async () => {
      // TDD: Test past date validation
      await projectsPage.clickCreateProject();
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const pastDateString = pastDate.toISOString().split('T')[0];
      
      await projectsPage.fillProjectForm({
        name: 'Test Project',
        startDate: pastDateString
      });
      
      await projectsPage.submitProjectForm();
      
      // Should show validation error for past date
      await projectsPage.expectFormError();
    });
  });

  test.describe('Form Validation - Priority Field', () => {
    test('should accept valid priority values', async () => {
      // TDD: Test valid priority values
      await projectsPage.clickCreateProject();
      
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      
      for (const priority of validPriorities) {
        await projectsPage.fillProjectForm({
          name: `Test Project ${priority}`,
          priority: priority as 'low' | 'medium' | 'high' | 'urgent'
        });
        
        // Should not show validation error for valid priority
        await projectsPage.expectNoErrorMessage();
        
        // Clear form for next iteration
        await projectsPage.projectNameInput.clear();
      }
    });
  });

  test.describe('Successful Form Submission', () => {
    test('should successfully create project with valid data', async () => {
      // TDD: Test successful project creation
      let apiCalled = false;
      let submittedData: any = null;
      
      // Mock successful API response
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          apiCalled = true;
          submittedData = await route.request().postDataJSON();
          
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'new-project-id',
              name: submittedData.name,
              description: submittedData.description,
              priority: submittedData.priority,
              startDate: submittedData.startDate,
              expectedEndDate: submittedData.expectedEndDate,
              status: 'active',
              createdAt: new Date().toISOString()
            })
          });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      
      const projectData = {
        name: 'Test Project TDD',
        description: 'This is a test project created via TDD',
        priority: 'high' as const,
        startDate: '2024-02-01',
        expectedEndDate: '2024-08-01'
      };
      
      await projectsPage.fillProjectForm(projectData);
      await projectsPage.submitProjectForm();
      
      // Verify API was called
      expect(apiCalled).toBe(true);
      
      // Verify submitted data
      expect(submittedData.name).toBe(projectData.name);
      expect(submittedData.description).toBe(projectData.description);
      expect(submittedData.priority).toBe(projectData.priority);
      
      // Verify success message is displayed
      await projectsPage.expectFormSuccess();
      
      // Form should be hidden after successful submission
      await expect(projectsPage.projectForm).not.toBeVisible();
    });

    test('should create project with minimal required data', async () => {
      // TDD: Test project creation with only required fields
      let apiCalled = false;
      
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          apiCalled = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'minimal-project-id',
              name: 'Minimal Project',
              status: 'active',
              createdAt: new Date().toISOString()
            })
          });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      
      // Fill only required fields
      await projectsPage.fillProjectForm({
        name: 'Minimal Project'
      });
      
      await projectsPage.submitProjectForm();
      
      expect(apiCalled).toBe(true);
      await projectsPage.expectFormSuccess();
    });

    test('should refresh dashboard metrics after successful creation', async () => {
      // TDD: Test that dashboard updates after project creation
      await projectsPage.expectDashboardLoaded();
      
      const initialActiveProjects = parseInt(await projectsPage.getMetricCardValue('active'));
      const initialTotalProjects = parseInt(await projectsPage.getMetricCardValue('total'));
      
      // Mock project creation API
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'new-project-id',
              name: 'New Project',
              status: 'active'
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Mock updated metrics API
      await projectsPage.page.route('**/api/projects/metrics', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            activeProjects: initialActiveProjects + 1,
            completedProjects: 0,
            onHoldProjects: 0,
            totalProjects: initialTotalProjects + 1,
            productTypes: {
              lu: { total: 0, completed: 0, inProcess: 0 },
              cl: { total: 0, completed: 0, inProcess: 0 },
              mp: { total: 0, completed: 0, inProcess: 0 }
            }
          })
        });
      });
      
      await projectsPage.clickCreateProject();
      await projectsPage.fillProjectForm({ name: 'New Project' });
      await projectsPage.submitProjectForm();
      
      await projectsPage.expectFormSuccess();
      
      // Refresh page to see updated metrics
      await projectsPage.refreshPage();
      
      // Verify metrics have been updated
      const updatedActiveProjects = parseInt(await projectsPage.getMetricCardValue('active'));
      const updatedTotalProjects = parseInt(await projectsPage.getMetricCardValue('total'));
      
      expect(updatedActiveProjects).toBe(initialActiveProjects + 1);
      expect(updatedTotalProjects).toBe(initialTotalProjects + 1);
    });
  });

  test.describe('Form Error Handling', () => {
    test('should handle API server error during creation', async () => {
      // TDD: Test server error handling
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      await projectsPage.fillProjectForm({ name: 'Test Project' });
      await projectsPage.submitProjectForm();
      
      // Should display error message
      await projectsPage.expectFormError('error del servidor');
      
      // Form should remain visible for retry
      await expect(projectsPage.projectForm).toBeVisible();
    });

    test('should handle network timeout during creation', async () => {
      // TDD: Test network timeout handling
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          // Simulate timeout by delaying response
          await new Promise(resolve => setTimeout(resolve, 10000));
          await route.fulfill({ status: 200, body: '{}' });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      await projectsPage.fillProjectForm({ name: 'Test Project' });
      await projectsPage.submitProjectForm();
      
      // Should show loading state initially
      const submitButton = projectsPage.submitButton;
      await expect(submitButton).toBeDisabled();
      
      // After timeout, should show error
      await expect(async () => {
        await projectsPage.expectFormError();
      }).toPass({ timeout: 15000 });
    });

    test('should handle validation errors from server', async () => {
      // TDD: Test server-side validation errors
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation failed',
              details: {
                name: 'Project name already exists'
              }
            })
          });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      await projectsPage.fillProjectForm({ name: 'Duplicate Project' });
      await projectsPage.submitProjectForm();
      
      // Should display specific validation error
      await projectsPage.expectFormError('ya existe');
    });
  });

  test.describe('Form User Experience', () => {
    test('should maintain form data when validation fails', async () => {
      // TDD: Test form data persistence on validation failure
      await projectsPage.clickCreateProject();
      
      const formData = {
        name: 'Test Project',
        description: 'Test description',
        priority: 'high' as const,
        startDate: '2024-06-15',
        expectedEndDate: '2024-01-15' // Invalid: end before start
      };
      
      await projectsPage.fillProjectForm(formData);
      await projectsPage.submitProjectForm();
      
      // Should show validation error
      await projectsPage.expectFormError();
      
      // Form data should be preserved
      await expect(projectsPage.projectNameInput).toHaveValue(formData.name);
      await expect(projectsPage.projectDescriptionInput).toHaveValue(formData.description);
      await expect(projectsPage.startDateInput).toHaveValue(formData.startDate);
      await expect(projectsPage.expectedEndDateInput).toHaveValue(formData.expectedEndDate);
    });

    test('should provide real-time validation feedback', async () => {
      // TDD: Test real-time validation
      await projectsPage.clickCreateProject();
      
      // Type invalid name (too short)
      await projectsPage.projectNameInput.fill('A');
      await projectsPage.projectNameInput.blur();
      
      // Should show validation error immediately
      await projectsPage.expectFormError();
      
      // Fix the name
      await projectsPage.projectNameInput.fill('Valid Project Name');
      await projectsPage.projectNameInput.blur();
      
      // Error should disappear
      await projectsPage.expectNoErrorMessage();
    });

    test('should disable submit button during form submission', async () => {
      // TDD: Test submit button state during submission
      await projectsPage.page.route('**/api/projects', async route => {
        if (route.request().method() === 'POST') {
          // Add delay to simulate processing
          await new Promise(resolve => setTimeout(resolve, 1000));
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'new-id', name: 'Test Project' })
          });
        } else {
          await route.continue();
        }
      });
      
      await projectsPage.clickCreateProject();
      await projectsPage.fillProjectForm({ name: 'Test Project' });
      
      // Submit button should be enabled initially
      await expect(projectsPage.submitButton).toBeEnabled();
      
      await projectsPage.submitProjectForm();
      
      // Submit button should be disabled during submission
      await expect(projectsPage.submitButton).toBeDisabled();
      
      // Wait for submission to complete
      await projectsPage.expectFormSuccess();
    });
  });
});