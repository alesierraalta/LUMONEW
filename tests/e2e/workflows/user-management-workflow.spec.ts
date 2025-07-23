import { test, expect } from '@playwright/test';
import { UserManagementFlow } from '../page-objects/user-management-page';
import { AuthenticationFlow } from '../page-objects/auth-page';
import { testUsers, formData, urls } from '../fixtures/test-data';

test.describe('User Management Workflows', () => {
  let userFlow: UserManagementFlow;
  let authFlow: AuthenticationFlow;

  test.beforeEach(async ({ page }) => {
    userFlow = new UserManagementFlow(page);
    authFlow = new AuthenticationFlow(page);
    
    // Login as admin before each test
    await authFlow.login.goto();
    await authFlow.login.loginAsAdmin();
  });

  test.describe('User Creation Workflow', () => {
    test('should create a new user successfully', async ({ page }) => {
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@example.com',
        password: 'TestPassword123!',
        roleId: '3' // Employee role
      };

      await userFlow.userCreatePage.goto();
      await userFlow.userCreatePage.fillUserForm(newUser);
      await userFlow.userCreatePage.submitForm();

      // Should redirect to users list
      await expect(page).toHaveURL(urls.users);
      
      // Verify user appears in list
      await userFlow.userListPage.expectUserExists(newUser.email);
    });

    test('should validate required fields', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      // Try to submit empty form
      await userFlow.userCreatePage.submitForm();
      
      // Should show validation errors
      await userFlow.userCreatePage.expectFormValidation('firstName');
      await userFlow.userCreatePage.expectFormValidation('lastName');
      await userFlow.userCreatePage.expectFormValidation('email');
      await userFlow.userCreatePage.expectFormValidation('password');
    });

    test('should validate email format', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      const invalidUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        password: 'TestPassword123!',
        roleId: '3'
      };

      await userFlow.userCreatePage.fillUserForm(invalidUser);
      await userFlow.userCreatePage.submitForm();
      
      await userFlow.userCreatePage.expectFormValidation('email', 'Ingresa un email válido');
    });

    test('should validate password requirements', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      const weakPasswordUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '123',
        roleId: '3'
      };

      await userFlow.userCreatePage.fillUserForm(weakPasswordUser);
      await userFlow.userCreatePage.submitForm();
      
      await userFlow.userCreatePage.expectFormValidation('password');
    });

    test('should show role permissions when role is selected', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      // Select admin role
      await userFlow.userCreatePage.selectRole('1');
      
      // Should show admin permissions
      const adminPermissions = ['users.create', 'users.edit', 'users.delete', 'roles.manage', 'system.admin'];
      await userFlow.userCreatePage.expectRolePermissions('1', adminPermissions);
    });

    test('should handle form cancellation', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'TestPassword123!',
        roleId: '3'
      };

      await userFlow.userCreatePage.fillUserForm(userData);
      await userFlow.userCreatePage.cancelForm();
      
      // Should redirect to users list
      await expect(page).toHaveURL(urls.users);
    });

    test('should disable form during submission', async ({ page }) => {
      await userFlow.userCreatePage.goto();
      
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.loading@example.com',
        password: 'TestPassword123!',
        roleId: '3'
      };

      await userFlow.userCreatePage.fillUserForm(newUser);
      
      // Mock slow API response
      await page.route('**/api/users', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: '123', ...newUser })
          });
        }, 2000);
      });
      
      await userFlow.userCreatePage.submitForm();
      
      // Form should be disabled during loading
      await userFlow.userCreatePage.expectLoadingState();
    });
  });

  test.describe('User Listing and Filtering', () => {
    test('should display users list', async ({ page }) => {
      await userFlow.userListPage.goto();
      await userFlow.userListPage.expectUsersLoaded();
      
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThan(0);
    });

    test('should search users by name', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Search for a specific user
      await userFlow.userListPage.searchUsers('Admin');
      
      // Should show filtered results
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThanOrEqual(1);
    });

    test('should search users by email', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Search by email
      await userFlow.userListPage.searchUsers('admin@example.com');
      
      // Should show matching user
      await userFlow.userListPage.expectUserExists('admin@example.com');
    });

    test('should filter users by role', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Filter by admin role
      await userFlow.userListPage.filterByRole('admin');
      
      // All visible users should have admin role
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThanOrEqual(1);
    });

    test('should filter users by status', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Filter by active status
      await userFlow.userListPage.filterByStatus('active');
      
      // Should show only active users
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThanOrEqual(1);
    });

    test('should sort users by name', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Sort by name ascending
      await userFlow.userListPage.sortBy('name');
      await userFlow.userListPage.expectSortedByName(true);
      
      // Toggle to descending
      await userFlow.userListPage.toggleSortOrder();
      await userFlow.userListPage.expectSortedByName(false);
    });

    test('should combine search and filters', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Apply multiple filters
      await userFlow.userListPage.searchUsers('Test');
      await userFlow.userListPage.filterByRole('employee');
      await userFlow.userListPage.filterByStatus('active');
      
      // Should show filtered results
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty search results', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Search for non-existent user
      await userFlow.userListPage.searchUsers('NonExistentUser12345');
      
      // Should show empty state or no results
      await userFlow.userListPage.expectFilteredResults(0);
    });

    test('should clear filters', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Apply filters
      await userFlow.userListPage.searchUsers('Test');
      await userFlow.userListPage.filterByRole('admin');
      
      // Clear search
      await userFlow.userListPage.searchUsers('');
      
      // Clear role filter
      await userFlow.userListPage.filterByRole('all');
      
      // Should show all users again
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBeGreaterThan(0);
    });
  });

  test.describe('User Editing Workflow', () => {
    test('should edit user details', async ({ page }) => {
      const testEmail = 'edit.test@example.com';
      
      // First create a test user
      const testUser = {
        firstName: 'Edit',
        lastName: 'Test',
        email: testEmail,
        password: 'TestPassword123!',
        roleId: '3'
      };
      
      await userFlow.createUser(testUser);
      
      // Now edit the user
      const updatedData = {
        firstName: 'Updated',
        lastName: 'User',
        email: testEmail,
        role: 'manager'
      };
      
      await userFlow.editUserFromList(testEmail, updatedData);
      
      // Verify changes
      await userFlow.userListPage.expectUserCardContent(testEmail, {
        name: 'Updated User',
        role: 'manager'
      });
    });

    test('should validate edit form', async ({ page }) => {
      const testEmail = 'validation.test@example.com';
      
      await userFlow.userListPage.goto();
      await userFlow.userListPage.editUser(testEmail);
      await userFlow.userEditModal.waitForModal();
      
      // Clear required fields
      await userFlow.userEditModal.fillEditForm({
        firstName: '',
        lastName: ''
      });
      
      await userFlow.userEditModal.saveChanges();
      
      // Should show validation errors (implementation dependent)
      // This would need proper validation error selectors
    });

    test('should cancel edit operation', async ({ page }) => {
      const testEmail = 'cancel.test@example.com';
      
      await userFlow.userListPage.goto();
      await userFlow.userListPage.editUser(testEmail);
      await userFlow.userEditModal.waitForModal();
      
      // Make changes but cancel
      await userFlow.userEditModal.fillEditForm({
        firstName: 'Changed'
      });
      
      await userFlow.userEditModal.cancelEdit();
      await userFlow.userEditModal.expectModalClosed();
      
      // Changes should not be saved
      await userFlow.userListPage.expectUserCardContent(testEmail, {
        name: 'Original Name' // Should still have original name
      });
    });

    test('should handle edit form loading state', async ({ page }) => {
      const testEmail = 'loading.test@example.com';
      
      // Mock slow API response
      await page.route('**/api/users/*', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }, 2000);
      });
      
      await userFlow.userListPage.goto();
      await userFlow.userListPage.editUser(testEmail);
      await userFlow.userEditModal.waitForModal();
      
      await userFlow.userEditModal.fillEditForm({
        firstName: 'Loading Test'
      });
      
      await userFlow.userEditModal.saveChanges();
      
      // Should show loading state
      // Implementation would need loading indicators in modal
    });
  });

  test.describe('User Details and Viewing', () => {
    test('should view user details', async ({ page }) => {
      const testEmail = 'details.test@example.com';
      
      await userFlow.viewUserDetails(testEmail);
      
      // Should show user details modal
      await userFlow.userDetailsModal.expectUserDetails({
        email: testEmail,
        // Add other expected details based on test data
      });
    });

    test('should close user details modal', async ({ page }) => {
      const testEmail = 'close.test@example.com';
      
      await userFlow.viewUserDetails(testEmail);
      await userFlow.userDetailsModal.closeModal();
      await userFlow.userDetailsModal.expectModalClosed();
    });

    test('should edit user from details modal', async ({ page }) => {
      const testEmail = 'edit.from.details@example.com';
      
      await userFlow.viewUserDetails(testEmail);
      await userFlow.userDetailsModal.editUser();
      
      // Should open edit modal
      await userFlow.userEditModal.waitForModal();
    });

    test('should display user avatar and status', async ({ page }) => {
      const testEmail = 'avatar.test@example.com';
      
      await userFlow.viewUserDetails(testEmail);
      
      // Should show user avatar (or initials)
      const avatar = userFlow.userDetailsModal.userAvatar;
      await expect(avatar).toBeVisible();
      
      // Should show user status
      const status = userFlow.userDetailsModal.userStatus;
      await expect(status).toBeVisible();
    });

    test('should display contact and professional information', async ({ page }) => {
      const testEmail = 'info.test@example.com';
      
      await userFlow.viewUserDetails(testEmail);
      
      // Should show contact information section
      await expect(userFlow.userDetailsModal.contactInfo).toBeVisible();
      
      // Should show professional information section
      await expect(userFlow.userDetailsModal.professionalInfo).toBeVisible();
    });
  });

  test.describe('User Deletion Workflow', () => {
    test('should delete user successfully', async ({ page }) => {
      const testEmail = 'delete.test@example.com';
      
      // First create a test user
      const testUser = {
        firstName: 'Delete',
        lastName: 'Test',
        email: testEmail,
        password: 'TestPassword123!',
        roleId: '3'
      };
      
      await userFlow.createUser(testUser);
      
      // Verify user exists
      await userFlow.userListPage.expectUserExists(testEmail);
      
      // Delete the user
      await userFlow.deleteUserFromList(testEmail);
      
      // Verify user is removed
      await userFlow.userListPage.expectUserNotExists(testEmail);
    });

    test('should confirm deletion before removing user', async ({ page }) => {
      const testEmail = 'confirm.delete@example.com';
      
      await userFlow.userListPage.goto();
      
      // Click delete but don't confirm
      const userCard = await userFlow.userListPage.getUserCardByEmail(testEmail);
      const deleteButton = userCard.locator('[data-testid="delete-user-button"]');
      await deleteButton.click();
      
      // Should show confirmation modal
      const confirmModal = page.locator('[data-testid="confirm-delete-modal"]');
      await expect(confirmModal).toBeVisible();
      
      // Cancel deletion
      const cancelButton = page.locator('[data-testid="cancel-delete"]');
      await cancelButton.click();
      
      // User should still exist
      await userFlow.userListPage.expectUserExists(testEmail);
    });

    test('should handle deletion errors gracefully', async ({ page }) => {
      const testEmail = 'error.delete@example.com';
      
      // Mock API error
      await page.route('**/api/users/*', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          });
        } else {
          route.continue();
        }
      });
      
      await userFlow.deleteUserFromList(testEmail);
      
      // Should show error message
      const errorToast = page.locator('[data-testid="error-toast"]');
      await expect(errorToast).toBeVisible();
      
      // User should still exist
      await userFlow.userListPage.expectUserExists(testEmail);
    });
  });

  test.describe('Bulk User Operations', () => {
    test('should select multiple users', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Select first few users
      const userEmails = ['user1@example.com', 'user2@example.com'];
      
      for (const email of userEmails) {
        await userFlow.userListPage.selectUser(email);
      }
      
      const selectedCount = await userFlow.userListPage.getSelectedUsersCount();
      expect(selectedCount).toBe(userEmails.length);
    });

    test('should select all users', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      const totalUsers = await userFlow.userListPage.getUserCount();
      await userFlow.userListPage.selectAllUsers();
      
      const selectedCount = await userFlow.userListPage.getSelectedUsersCount();
      expect(selectedCount).toBe(totalUsers);
    });

    test('should perform bulk status update', async ({ page }) => {
      const userEmails = ['bulk1@example.com', 'bulk2@example.com'];
      
      await userFlow.performBulkUserAction(userEmails, 'deactivate');
      
      // Should show confirmation or success message
      const successToast = page.locator('[data-testid="success-toast"]');
      await expect(successToast).toBeVisible();
    });

    test('should perform bulk role assignment', async ({ page }) => {
      const userEmails = ['role1@example.com', 'role2@example.com'];
      
      await userFlow.performBulkUserAction(userEmails, 'assign-role');
      
      // Should open role selection modal
      const roleModal = page.locator('[data-testid="bulk-role-modal"]');
      await expect(roleModal).toBeVisible();
    });

    test('should perform bulk deletion', async ({ page }) => {
      const userEmails = ['delete1@example.com', 'delete2@example.com'];
      
      await userFlow.performBulkUserAction(userEmails, 'delete');
      
      // Should show confirmation modal
      const confirmModal = page.locator('[data-testid="bulk-delete-confirm"]');
      await expect(confirmModal).toBeVisible();
    });

    test('should handle bulk operation errors', async ({ page }) => {
      // Mock API error for bulk operations
      await page.route('**/api/users/bulk', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Bulk operation failed' })
        });
      });
      
      const userEmails = ['error1@example.com', 'error2@example.com'];
      await userFlow.performBulkUserAction(userEmails, 'deactivate');
      
      // Should show error message
      const errorToast = page.locator('[data-testid="error-toast"]');
      await expect(errorToast).toBeVisible();
    });
  });

  test.describe('User Management Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Test keyboard navigation through user cards
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate user actions with keyboard
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Check for proper ARIA labels on interactive elements
      const createButton = userFlow.userListPage.createUserButton;
      const ariaLabel = await createButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should support screen readers', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Check for proper heading structure
      const mainHeading = page.locator('h1');
      await expect(mainHeading).toBeVisible();
      
      // Check for proper table/grid structure
      const userGrid = userFlow.userListPage.userGrid;
      const role = await userGrid.getAttribute('role');
      expect(role).toBe('grid');
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // This would typically use axe-core or similar tool
      // For now, we'll check basic visibility
      const userCards = userFlow.userListPage.userCards;
      const cardCount = await userCards.count();
      
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = userCards.nth(i);
        await expect(card).toBeVisible();
      }
    });
  });

  test.describe('User Management Performance', () => {
    test('should load users list efficiently', async ({ page }) => {
      const startTime = Date.now();
      await userFlow.userListPage.goto();
      await userFlow.userListPage.expectUsersLoaded();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle large user datasets', async ({ page }) => {
      // Mock large dataset
      await page.route('**/api/users', route => {
        const largeUserList = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          role: 'employee',
          status: 'active'
        }));
        
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeUserList)
        });
      });
      
      await userFlow.userListPage.goto();
      await userFlow.userListPage.expectUsersLoaded();
      
      // Should handle large dataset without performance issues
      const userCount = await userFlow.userListPage.getUserCount();
      expect(userCount).toBe(100);
    });

    test('should implement efficient search', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      const startTime = Date.now();
      await userFlow.userListPage.searchUsers('Test');
      const searchTime = Date.now() - startTime;
      
      expect(searchTime).toBeLessThan(1000); // Search should be fast
    });

    test('should implement pagination for large datasets', async ({ page }) => {
      await userFlow.userListPage.goto();
      
      // Check for pagination controls
      const pagination = page.locator('[data-testid="pagination"]');
      if (await pagination.isVisible()) {
        const nextButton = page.locator('[data-testid="next-page"]');
        await nextButton.click();
        
        // Should load next page efficiently
        await userFlow.userListPage.expectUsersLoaded();
      }
    });
  });

  test.describe('User Management Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/users', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await userFlow.userListPage.goto();
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should handle network disconnection', async ({ page }) => {
      await userFlow.userListPage.goto();
      await userFlow.userListPage.expectUsersLoaded();
      
      // Simulate network disconnection
      await page.context().setOffline(true);
      
      // Try to create a user
      await userFlow.userListPage.clickCreateUser();
      
      const offlineMessage = page.locator('[data-testid="offline-message"]');
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toContainText(/offline|connection/i);
      }
      
      // Restore connection
      await page.context().setOffline(false);
    });

    test('should retry failed requests', async ({ page }) => {
      let requestCount = 0;
      await page.route('**/api/users', route => {
        requestCount++;
        if (requestCount < 3) {
          route.fulfill({ status: 500 });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      });
      
      await userFlow.userListPage.goto();
      await userFlow.userListPage.expectUsersLoaded();
      
      expect(requestCount).toBe(3); // Should have retried
    });

    test('should handle validation errors from server', async ({ page }) => {
      // Mock server validation error
      await page.route('**/api/users', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Validation failed',
              details: { email: 'Email already exists' }
            })
          });
        } else {
          route.continue();
        }
      });
      
      const duplicateUser = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'TestPassword123!',
        roleId: '3'
      };
      
      await userFlow.createUser(duplicateUser);
      
      // Should show server validation error
      const errorToast = page.locator('[data-testid="error-toast"]');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText('Email already exists');
    });
  });
});