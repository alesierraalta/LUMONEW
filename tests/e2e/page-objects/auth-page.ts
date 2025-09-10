import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { selectors, urls, testUsers } from '../fixtures/test-data';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.login);
    await this.waitForPageLoad();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillField(selectors.auth.emailInput, email);
    await this.fillField(selectors.auth.passwordInput, password);
    await this.click(selectors.auth.loginButton);
  }

  async loginAsAdmin(): Promise<void> {
    const admin = testUsers.admin;
    await this.login(admin.email, admin.password);
    await this.page.waitForURL(urls.dashboard);
  }

  async loginAsUser(): Promise<void> {
    const user = testUsers.user;
    await this.login(user.email, user.password);
    await this.page.waitForURL(urls.dashboard);
  }

  async expectLoginError(): Promise<void> {
    const errorMessage = this.page.locator('[data-testid="login-error"]');
    await expect(errorMessage).toBeVisible();
  }

  async goToSignup(): Promise<void> {
    await this.click('[data-testid="signup-link"]');
    await this.page.waitForURL(urls.signup);
  }

  async goToResetPassword(): Promise<void> {
    await this.click('[data-testid="reset-password-link"]');
    await this.page.waitForURL(urls.resetPassword);
  }

  async goToAdminSignup(): Promise<void> {
    await this.click(selectors.auth.adminSignupLink);
    await this.page.waitForURL(urls.adminSignup);
  }
}

export class SignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.signup);
    await this.waitForPageLoad();
  }

  async signup(email: string, password: string, fullName: string): Promise<void> {
    await this.fillField(selectors.auth.emailInput, email);
    await this.fillField(selectors.auth.passwordInput, password);
    await this.fillField('[data-testid="confirm-password-input"]', password);
    await this.fillField('[data-testid="full-name-input"]', fullName);
    await this.click(selectors.auth.signupButton);
  }

  async expectSignupSuccess(): Promise<void> {
    await this.waitForToast('Account created successfully');
  }

  async expectSignupError(errorMessage: string): Promise<void> {
    const error = this.page.locator('[data-testid="signup-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(errorMessage);
  }

  async goToLogin(): Promise<void> {
    await this.click('[data-testid="login-link"]');
    await this.page.waitForURL(urls.login);
  }
}

export class AdminSignupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.adminSignup);
    await this.waitForPageLoad();
  }

  async signupAsAdmin(email: string, password: string, fullName: string, adminCode: string): Promise<void> {
    await this.fillField(selectors.auth.emailInput, email);
    await this.fillField(selectors.auth.passwordInput, password);
    await this.fillField('[data-testid="confirm-password-input"]', password);
    await this.fillField('[data-testid="full-name-input"]', fullName);
    await this.fillField('[data-testid="admin-code-input"]', adminCode);
    await this.click(selectors.auth.signupButton);
  }

  async expectAdminSignupSuccess(): Promise<void> {
    await this.waitForToast('Admin account created successfully');
  }

  async expectInvalidAdminCode(): Promise<void> {
    const error = this.page.locator('[data-testid="admin-code-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Invalid admin code');
  }
}

export class ResetPasswordPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.resetPassword);
    await this.waitForPageLoad();
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.fillField(selectors.auth.emailInput, email);
    await this.click(selectors.auth.resetPasswordButton);
  }

  async expectResetEmailSent(): Promise<void> {
    await this.waitForToast('Password reset email sent');
  }

  async expectEmailNotFound(): Promise<void> {
    const error = this.page.locator('[data-testid="email-error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Email not found');
  }

  async goToLogin(): Promise<void> {
    await this.click('[data-testid="back-to-login"]');
    await this.page.waitForURL(urls.login);
  }
}

export class AuthenticationFlow {
  private loginPage: LoginPage;
  private signupPage: SignupPage;
  private adminSignupPage: AdminSignupPage;
  private resetPasswordPage: ResetPasswordPage;

  constructor(private page: Page) {
    this.loginPage = new LoginPage(page);
    this.signupPage = new SignupPage(page);
    this.adminSignupPage = new AdminSignupPage(page);
    this.resetPasswordPage = new ResetPasswordPage(page);
  }

  get login(): LoginPage {
    return this.loginPage;
  }

  get signup(): SignupPage {
    return this.signupPage;
  }

  get adminSignup(): AdminSignupPage {
    return this.adminSignupPage;
  }

  get resetPassword(): ResetPasswordPage {
    return this.resetPasswordPage;
  }

  async logout(): Promise<void> {
    await this.page.click(selectors.nav.userMenu);
    await this.page.click(selectors.auth.logoutButton);
    await this.page.waitForURL(urls.login);
  }

  async expectUserLoggedIn(): Promise<void> {
    await expect(this.page).toHaveURL(urls.dashboard);
    const userMenu = this.page.locator(selectors.nav.userMenu);
    await expect(userMenu).toBeVisible();
  }

  async expectUserLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL(urls.login);
    const loginForm = this.page.locator('[data-testid="login-form"]');
    await expect(loginForm).toBeVisible();
  }

  async checkSessionPersistence(): Promise<void> {
    // Refresh the page and check if user is still logged in
    await this.page.reload();
    await this.expectUserLoggedIn();
  }

  async testInvalidCredentials(): Promise<void> {
    await this.loginPage.goto();
    await this.loginPage.login('invalid@email.com', 'wrongpassword');
    await this.loginPage.expectLoginError();
  }

  async testEmptyFields(): Promise<void> {
    await this.loginPage.goto();
    await this.loginPage.login('', '');
    
    // Check for validation errors
    const emailError = this.page.locator('[data-testid="email-error"]');
    const passwordError = this.page.locator('[data-testid="password-error"]');
    
    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  }

  async testPasswordStrengthValidation(): Promise<void> {
    await this.signupPage.goto();
    
    // Test weak password
    await this.signupPage.signup('test@example.com', '123', 'Test User');
    
    const passwordError = this.page.locator('[data-testid="password-strength-error"]');
    await expect(passwordError).toBeVisible();
  }

  async testEmailValidation(): Promise<void> {
    await this.signupPage.goto();
    
    // Test invalid email format
    await this.signupPage.signup('invalid-email', 'StrongPassword123!', 'Test User');
    
    const emailError = this.page.locator('[data-testid="email-format-error"]');
    await expect(emailError).toBeVisible();
  }
}

// Simple AuthPage class for basic authentication in tests
export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.goto(urls.login);
    await this.waitForPageLoad();
    await this.fillField(selectors.auth.emailInput, email);
    await this.fillField(selectors.auth.passwordInput, password);
    await this.click(selectors.auth.loginButton);
    await this.page.waitForURL(urls.dashboard);
  }

  async logout(): Promise<void> {
    await this.page.click(selectors.nav.userMenu);
    await this.page.click(selectors.auth.logoutButton);
    await this.page.waitForURL(urls.login);
  }
}
