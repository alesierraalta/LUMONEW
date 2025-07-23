import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class UserListPage extends BasePage {
  readonly createUserButton: Locator;
  readonly searchInput: Locator;
  readonly roleFilter: Locator;
  readonly statusFilter: Locator;
  readonly sortBySelect: Locator;
  readonly sortOrderButton: Locator;
  readonly userGrid: Locator;
  readonly userCards: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly bulkActionsButton: Locator;
  readonly selectAllCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.createUserButton = page.locator('[data-testid="create-user-button"]');
    this.searchInput = page.locator('input[placeholder*="Search users"]');
    this.roleFilter = page.locator('select').filter({ hasText: 'All Roles' });
    this.statusFilter = page.locator('select').filter({ hasText: 'All Status' });
    this.sortBySelect = page.locator('select').filter({ hasText: 'Sort by' });
    this.sortOrderButton = page.locator('[data-testid="sort-order-button"]');
    this.userGrid = page.locator('[data-testid="user-grid"]');
    this.userCards = page.locator('[data-testid="user-card"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.bulkActionsButton = page.locator('[data-testid="bulk-actions"]');
    this.selectAllCheckbox = page.locator('[data-testid="select-all-users"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.userGrid).toBeVisible();
  }

  async searchUsers(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByRole(role: string): Promise<void> {
    await this.roleFilter.selectOption(role);
    await this.page.waitForTimeout(500);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(500);
  }

  async sortBy(field: string): Promise<void> {
    await this.sortBySelect.selectOption(field);
    await this.page.waitForTimeout(500);
  }

  async toggleSortOrder(): Promise<void> {
    await this.sortOrderButton.click();
    await this.page.waitForTimeout(500);
  }

  async getUserCount(): Promise<number> {
    return await this.userCards.count();
  }

  async getUserCardByEmail(email: string): Promise<Locator> {
    return this.userCards.filter({ hasText: email });
  }

  async clickCreateUser(): Promise<void> {
    await this.createUserButton.click();
  }

  async editUser(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    const editButton = userCard.locator('[data-testid="edit-user-button"]');
    await editButton.click();
  }

  async deleteUser(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    const deleteButton = userCard.locator('[data-testid="delete-user-button"]');
    await deleteButton.click();
    
    // Confirm deletion in modal
    const confirmButton = this.page.locator('[data-testid="confirm-delete"]');
    await confirmButton.click();
  }

  async viewUserDetails(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    const viewButton = userCard.locator('[data-testid="view-user-button"]');
    await viewButton.click();
  }

  async selectUser(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    const checkbox = userCard.locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async selectAllUsers(): Promise<void> {
    await this.selectAllCheckbox.check();
  }

  async getSelectedUsersCount(): Promise<number> {
    const selectedCheckboxes = this.userCards.locator('input[type="checkbox"]:checked');
    return await selectedCheckboxes.count();
  }

  async performBulkAction(action: string): Promise<void> {
    await this.bulkActionsButton.click();
    const actionButton = this.page.locator(`[data-testid="bulk-${action}"]`);
    await actionButton.click();
  }

  async expectUserExists(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    await expect(userCard).toBeVisible();
  }

  async expectUserNotExists(email: string): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    await expect(userCard).not.toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
    await expect(this.userCards).toHaveCount(0);
  }

  async expectLoadingState(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async expectUsersLoaded(): Promise<void> {
    await expect(this.loadingSpinner).not.toBeVisible();
    await expect(this.userGrid).toBeVisible();
  }

  async expectFilteredResults(expectedCount: number): Promise<void> {
    await expect(this.userCards).toHaveCount(expectedCount);
  }

  async expectSortedByName(ascending: boolean = true): Promise<void> {
    const userNames = await this.userCards.locator('[data-testid="user-name"]').allTextContents();
    const sortedNames = [...userNames].sort();
    if (!ascending) {
      sortedNames.reverse();
    }
    expect(userNames).toEqual(sortedNames);
  }

  async expectUserCardContent(email: string, expectedData: any): Promise<void> {
    const userCard = await this.getUserCardByEmail(email);
    
    if (expectedData.name) {
      const nameElement = userCard.locator('[data-testid="user-name"]');
      await expect(nameElement).toContainText(expectedData.name);
    }
    
    if (expectedData.role) {
      const roleElement = userCard.locator('[data-testid="user-role"]');
      await expect(roleElement).toContainText(expectedData.role);
    }
    
    if (expectedData.status) {
      const statusElement = userCard.locator('[data-testid="user-status"]');
      await expect(statusElement).toContainText(expectedData.status);
    }
  }
}

export class UserCreatePage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleRadios: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;
  readonly formValidationErrors: Locator;
  readonly rolePermissions: Locator;
  readonly loadingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('input[name="firstName"], input[placeholder*="Nombre"]');
    this.lastNameInput = page.locator('input[name="lastName"], input[placeholder*="Apellido"]');
    this.emailInput = page.locator('input[name="email"], input[type="email"]');
    this.passwordInput = page.locator('input[name="password"], input[type="password"]');
    this.roleRadios = page.locator('input[type="radio"][name="role"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button:has-text("Cancelar")');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.formValidationErrors = page.locator('[data-testid="validation-error"]');
    this.rolePermissions = page.locator('[data-testid="role-permissions"]');
    this.loadingButton = page.locator('[data-testid="loading-button"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/users/create');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.firstNameInput).toBeVisible();
  }

  async fillUserForm(userData: any): Promise<void> {
    await this.firstNameInput.fill(userData.firstName);
    await this.lastNameInput.fill(userData.lastName);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    
    if (userData.roleId) {
      const roleRadio = this.page.locator(`input[type="radio"][name="role"][value="${userData.roleId}"]`);
      await roleRadio.check();
    }
  }

  async selectRole(roleId: string): Promise<void> {
    const roleRadio = this.page.locator(`input[type="radio"][name="role"][value="${roleId}"]`);
    await roleRadio.check();
    
    // Wait for role permissions to update
    await this.page.waitForTimeout(500);
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  async expectFormValidation(field: string, errorMessage?: string): Promise<void> {
    const fieldError = this.page.locator(`[data-testid="validation-error-${field}"]`);
    await expect(fieldError).toBeVisible();
    
    if (errorMessage) {
      await expect(fieldError).toContainText(errorMessage);
    }
  }

  async expectRolePermissions(roleId: string, expectedPermissions: string[]): Promise<void> {
    await this.selectRole(roleId);
    
    for (const permission of expectedPermissions) {
      const permissionElement = this.rolePermissions.locator(`text=${permission}`);
      await expect(permissionElement).toBeVisible();
    }
  }

  async expectFormDisabled(): Promise<void> {
    await expect(this.firstNameInput).toBeDisabled();
    await expect(this.lastNameInput).toBeDisabled();
    await expect(this.emailInput).toBeDisabled();
    await expect(this.passwordInput).toBeDisabled();
    await expect(this.submitButton).toBeDisabled();
  }

  async expectFormEnabled(): Promise<void> {
    await expect(this.firstNameInput).toBeEnabled();
    await expect(this.lastNameInput).toBeEnabled();
    await expect(this.emailInput).toBeEnabled();
    await expect(this.passwordInput).toBeEnabled();
  }

  async expectSubmitButtonState(enabled: boolean): Promise<void> {
    if (enabled) {
      await expect(this.submitButton).toBeEnabled();
    } else {
      await expect(this.submitButton).toBeDisabled();
    }
  }

  async expectLoadingState(): Promise<void> {
    await expect(this.loadingButton).toBeVisible();
    await expect(this.submitButton).toBeDisabled();
  }
}

export class UserEditModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="user-edit-modal"]');
    this.firstNameInput = this.modal.locator('input[name="firstName"]');
    this.lastNameInput = this.modal.locator('input[name="lastName"]');
    this.emailInput = this.modal.locator('input[name="email"]');
    this.roleSelect = this.modal.locator('select[name="role"]');
    this.saveButton = this.modal.locator('button[type="submit"]');
    this.cancelButton = this.modal.locator('button:has-text("Cancelar")');
    this.closeButton = this.modal.locator('[data-testid="close-modal"]');
  }

  async waitForModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async fillEditForm(userData: any): Promise<void> {
    if (userData.firstName) {
      await this.firstNameInput.fill(userData.firstName);
    }
    if (userData.lastName) {
      await this.lastNameInput.fill(userData.lastName);
    }
    if (userData.email) {
      await this.emailInput.fill(userData.email);
    }
    if (userData.role) {
      await this.roleSelect.selectOption(userData.role);
    }
  }

  async saveChanges(): Promise<void> {
    await this.saveButton.click();
  }

  async cancelEdit(): Promise<void> {
    await this.cancelButton.click();
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }

  async expectFormValues(userData: any): Promise<void> {
    if (userData.firstName) {
      await expect(this.firstNameInput).toHaveValue(userData.firstName);
    }
    if (userData.lastName) {
      await expect(this.lastNameInput).toHaveValue(userData.lastName);
    }
    if (userData.email) {
      await expect(this.emailInput).toHaveValue(userData.email);
    }
    if (userData.role) {
      await expect(this.roleSelect).toHaveValue(userData.role);
    }
  }
}

export class UserDetailsModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly userRole: Locator;
  readonly userStatus: Locator;
  readonly contactInfo: Locator;
  readonly professionalInfo: Locator;
  readonly biography: Locator;
  readonly closeButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="user-details-modal"]');
    this.userAvatar = this.modal.locator('[data-testid="user-avatar"]');
    this.userName = this.modal.locator('[data-testid="user-name"]');
    this.userRole = this.modal.locator('[data-testid="user-role"]');
    this.userStatus = this.modal.locator('[data-testid="user-status"]');
    this.contactInfo = this.modal.locator('[data-testid="contact-info"]');
    this.professionalInfo = this.modal.locator('[data-testid="professional-info"]');
    this.biography = this.modal.locator('[data-testid="biography"]');
    this.closeButton = this.modal.locator('[data-testid="close-modal"]');
    this.editButton = this.modal.locator('[data-testid="edit-user"]');
  }

  async waitForModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  async editUser(): Promise<void> {
    await this.editButton.click();
  }

  async expectUserDetails(userData: any): Promise<void> {
    if (userData.name) {
      await expect(this.userName).toContainText(userData.name);
    }
    if (userData.role) {
      await expect(this.userRole).toContainText(userData.role);
    }
    if (userData.status) {
      await expect(this.userStatus).toContainText(userData.status);
    }
    if (userData.email) {
      await expect(this.contactInfo).toContainText(userData.email);
    }
    if (userData.phone) {
      await expect(this.contactInfo).toContainText(userData.phone);
    }
    if (userData.department) {
      await expect(this.professionalInfo).toContainText(userData.department);
    }
    if (userData.location) {
      await expect(this.professionalInfo).toContainText(userData.location);
    }
    if (userData.bio) {
      await expect(this.biography).toContainText(userData.bio);
    }
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }
}

export class UserManagementFlow {
  readonly userListPage: UserListPage;
  readonly userCreatePage: UserCreatePage;
  readonly userEditModal: UserEditModal;
  readonly userDetailsModal: UserDetailsModal;

  constructor(page: Page) {
    this.userListPage = new UserListPage(page);
    this.userCreatePage = new UserCreatePage(page);
    this.userEditModal = new UserEditModal(page);
    this.userDetailsModal = new UserDetailsModal(page);
  }

  async createUser(userData: any): Promise<void> {
    await this.userListPage.goto();
    await this.userListPage.clickCreateUser();
    await this.userCreatePage.waitForPageLoad();
    await this.userCreatePage.fillUserForm(userData);
    await this.userCreatePage.submitForm();
  }

  async editUserFromList(email: string, newData: any): Promise<void> {
    await this.userListPage.goto();
    await this.userListPage.editUser(email);
    await this.userEditModal.waitForModal();
    await this.userEditModal.fillEditForm(newData);
    await this.userEditModal.saveChanges();
  }

  async viewUserDetails(email: string): Promise<void> {
    await this.userListPage.goto();
    await this.userListPage.viewUserDetails(email);
    await this.userDetailsModal.waitForModal();
  }

  async deleteUserFromList(email: string): Promise<void> {
    await this.userListPage.goto();
    await this.userListPage.deleteUser(email);
  }

  async searchAndFilterUsers(searchTerm?: string, role?: string, status?: string): Promise<void> {
    await this.userListPage.goto();
    
    if (searchTerm) {
      await this.userListPage.searchUsers(searchTerm);
    }
    if (role) {
      await this.userListPage.filterByRole(role);
    }
    if (status) {
      await this.userListPage.filterByStatus(status);
    }
  }

  async performBulkUserAction(emails: string[], action: string): Promise<void> {
    await this.userListPage.goto();
    
    for (const email of emails) {
      await this.userListPage.selectUser(email);
    }
    
    await this.userListPage.performBulkAction(action);
  }
}