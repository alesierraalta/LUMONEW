import { test, expect } from '@playwright/test';
import { AuthenticationFlow } from '../page-objects/auth-page';
import { DashboardPage } from '../page-objects/dashboard-page';
import { testUsers, urls } from '../fixtures/test-data';

test.describe('Authentication Workflows', () => {
  let authFlow: AuthenticationFlow;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authFlow = new AuthenticationFlow(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('User Login Flow', () => {
    test('should login successfully with valid admin credentials', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await authFlow.expectUserLoggedIn();
      await dashboardPage.expectDashboardLoaded();
    });

    test('should login successfully with valid user credentials', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsUser();
      await authFlow.expectUserLoggedIn();
      await dashboardPage.expectDashboardLoaded();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.login('invalid@email.com', 'wrongpassword');
      await authFlow.login.expectLoginError();
      await expect(page).toHaveURL(urls.login);
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await authFlow.testEmptyFields();
    });

    test('should redirect to dashboard after successful login', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await expect(page).toHaveURL(urls.dashboard);
    });

    test('should persist session after page refresh', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await authFlow.checkSessionPersistence();
    });

    test('should handle multiple failed login attempts', async ({ page }) => {
      await authFlow.login.goto();
      
      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        await authFlow.login.login('test@example.com', 'wrongpassword');
        await authFlow.login.expectLoginError();
      }
      
      // Check if account is locked or rate limited
      const rateLimitMessage = page.locator('[data-testid="rate-limit-error"]');
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toContainText('Too many failed attempts');
      }
    });
  });

  test.describe('User Registration Flow', () => {
    test('should register new user successfully', async ({ page }) => {
      const newUser = testUsers.newUser;
      
      await authFlow.signup.goto();
      await authFlow.signup.signup(newUser.email, newUser.password, newUser.fullName);
      await authFlow.signup.expectSignupSuccess();
    });

    test('should show error for duplicate email', async ({ page }) => {
      const existingUser = testUsers.admin;
      
      await authFlow.signup.goto();
      await authFlow.signup.signup(existingUser.email, 'NewPassword123!', 'Test User');
      await authFlow.signup.expectSignupError('Email already exists');
    });

    test('should validate password strength', async ({ page }) => {
      await authFlow.testPasswordStrengthValidation();
    });

    test('should validate email format', async ({ page }) => {
      await authFlow.testEmailValidation();
    });

    test('should require password confirmation match', async ({ page }) => {
      await authFlow.signup.goto();
      
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'StrongPassword123!');
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPassword123!');
      await page.fill('[data-testid="full-name-input"]', 'Test User');
      await page.click('[data-testid="signup-button"]');
      
      const passwordMismatchError = page.locator('[data-testid="password-mismatch-error"]');
      await expect(passwordMismatchError).toBeVisible();
    });

    test('should navigate between login and signup pages', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.goToSignup();
      await expect(page).toHaveURL(urls.signup);
      
      await authFlow.signup.goToLogin();
      await expect(page).toHaveURL(urls.login);
    });
  });

  test.describe('Admin Signup Flow', () => {
    test('should register admin with valid admin code', async ({ page }) => {
      await authFlow.adminSignup.goto();
      await authFlow.adminSignup.signupAsAdmin(
        'newadmin@test.com',
        'AdminPassword123!',
        'New Admin',
        'ADMIN_CODE_123'
      );
      await authFlow.adminSignup.expectAdminSignupSuccess();
    });

    test('should reject invalid admin code', async ({ page }) => {
      await authFlow.adminSignup.goto();
      await authFlow.adminSignup.signupAsAdmin(
        'newadmin@test.com',
        'AdminPassword123!',
        'New Admin',
        'INVALID_CODE'
      );
      await authFlow.adminSignup.expectInvalidAdminCode();
    });

    test('should navigate to admin signup from login page', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.goToAdminSignup();
      await expect(page).toHaveURL(urls.adminSignup);
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should send reset email for valid email', async ({ page }) => {
      await authFlow.resetPassword.goto();
      await authFlow.resetPassword.requestPasswordReset(testUsers.admin.email);
      await authFlow.resetPassword.expectResetEmailSent();
    });

    test('should show error for non-existent email', async ({ page }) => {
      await authFlow.resetPassword.goto();
      await authFlow.resetPassword.requestPasswordReset('nonexistent@email.com');
      await authFlow.resetPassword.expectEmailNotFound();
    });

    test('should navigate to reset password from login page', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.goToResetPassword();
      await expect(page).toHaveURL(urls.resetPassword);
    });

    test('should navigate back to login from reset password', async ({ page }) => {
      await authFlow.resetPassword.goto();
      await authFlow.resetPassword.goToLogin();
      await expect(page).toHaveURL(urls.login);
    });
  });

  test.describe('Session Management and Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await authFlow.expectUserLoggedIn();
      
      await authFlow.logout();
      await authFlow.expectUserLoggedOut();
    });

    test('should clear session data on logout', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await authFlow.expectUserLoggedIn();
      
      await authFlow.logout();
      
      // Try to access protected page
      await page.goto(urls.dashboard);
      await expect(page).toHaveURL(urls.login);
    });

    test('should handle session expiration', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.loginAsAdmin();
      await authFlow.expectUserLoggedIn();
      
      // Simulate session expiration by clearing cookies
      await page.context().clearCookies();
      
      // Try to access protected page
      await page.goto(urls.dashboard);
      await expect(page).toHaveURL(urls.login);
    });

    test('should maintain session across browser tabs', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();
      
      const authFlow1 = new AuthenticationFlow(page1);
      const authFlow2 = new AuthenticationFlow(page2);
      
      // Login in first tab
      await authFlow1.login.goto();
      await authFlow1.login.loginAsAdmin();
      await authFlow1.expectUserLoggedIn();
      
      // Check if logged in in second tab
      await page2.goto(urls.dashboard);
      await expect(page2).toHaveURL(urls.dashboard);
      
      // Logout from first tab
      await authFlow1.logout();
      
      // Check if logged out in second tab
      await page2.reload();
      await expect(page2).toHaveURL(urls.login);
      
      await page1.close();
      await page2.close();
    });
  });

  test.describe('Authentication Security', () => {
    test('should prevent SQL injection in login form', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.login("admin'; DROP TABLE users; --", 'password');
      await authFlow.login.expectLoginError();
    });

    test('should prevent XSS in login form', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.login('<script>alert("xss")</script>', 'password');
      await authFlow.login.expectLoginError();
    });

    test('should enforce HTTPS in production', async ({ page }) => {
      // This test would check if the app redirects to HTTPS in production
      // For now, we'll just verify the current protocol
      const url = page.url();
      if (process.env.NODE_ENV === 'production') {
        expect(url).toMatch(/^https:/);
      }
    });

    test('should have secure password requirements', async ({ page }) => {
      await authFlow.signup.goto();
      
      const weakPasswords = ['123', 'password', 'abc123', '12345678'];
      
      for (const weakPassword of weakPasswords) {
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', weakPassword);
        await page.fill('[data-testid="confirm-password-input"]', weakPassword);
        await page.fill('[data-testid="full-name-input"]', 'Test User');
        await page.click('[data-testid="signup-button"]');
        
        const passwordError = page.locator('[data-testid="password-strength-error"]');
        await expect(passwordError).toBeVisible();
        
        // Clear form for next iteration
        await page.reload();
      }
    });
  });

  test.describe('Authentication Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await authFlow.login.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
      
      // Submit form with Enter key
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await authFlow.login.goto();
      
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const loginButton = page.locator('[data-testid="login-button"]');
      
      await expect(emailInput).toHaveAttribute('aria-label');
      await expect(passwordInput).toHaveAttribute('aria-label');
      await expect(loginButton).toHaveAttribute('aria-label');
    });

    test('should announce form errors to screen readers', async ({ page }) => {
      await authFlow.login.goto();
      await authFlow.login.login('', '');
      
      const emailError = page.locator('[data-testid="email-error"]');
      const passwordError = page.locator('[data-testid="password-error"]');
      
      await expect(emailError).toHaveAttribute('role', 'alert');
      await expect(passwordError).toHaveAttribute('role', 'alert');
    });
  });

  test.describe('Authentication Performance', () => {
    test('should load login page quickly', async ({ page }) => {
      const startTime = Date.now();
      await authFlow.login.goto();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should handle login request efficiently', async ({ page }) => {
      await authFlow.login.goto();
      
      const startTime = Date.now();
      await authFlow.login.loginAsAdmin();
      const loginTime = Date.now() - startTime;
      
      expect(loginTime).toBeLessThan(5000); // Should login within 5 seconds
    });
  });
});