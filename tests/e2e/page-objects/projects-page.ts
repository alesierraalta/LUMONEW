import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ProjectsPage extends BasePage {
  // Main page elements
  readonly pageTitle: Locator;
  readonly createProjectButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly projectsGrid: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  
  // Dashboard metrics cards
  readonly activeProjectsCard: Locator;
  readonly completedProjectsCard: Locator;
  readonly onHoldProjectsCard: Locator;
  readonly totalProjectsCard: Locator;
  
  // Product type metrics cards
  readonly luItemsCard: Locator;
  readonly clItemsCard: Locator;
  readonly mpItemsCard: Locator;
  
  // Project form elements
  readonly projectForm: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescriptionInput: Locator;
  readonly prioritySelect: Locator;
  readonly startDateInput: Locator;
  readonly expectedEndDateInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly formErrorMessage: Locator;
  readonly formSuccessMessage: Locator;
  
  // Modal elements
  readonly luImportModal: Locator;
  readonly addItemModal: Locator;
  readonly modalCloseButton: Locator;
  readonly modalOverlay: Locator;
  
  // Workflow tracker elements
  readonly workflowTracker: Locator;
  readonly workflowSteps: Locator;
  readonly currentStep: Locator;
  
  // Inventory dashboard elements
  readonly inventoryDashboard: Locator;
  readonly inventoryItems: Locator;
  readonly inventoryFilters: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Main page elements
    this.pageTitle = page.locator('h1').filter({ hasText: 'Gestión de Proyectos' });
    this.createProjectButton = page.locator('button').filter({ hasText: 'Nuevo Proyecto' });
    this.searchInput = page.locator('[data-testid="search-input"], input[placeholder*="buscar"], input[placeholder*="search"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"], select[name="filter"]');
    this.projectsGrid = page.locator('[data-testid="projects-grid"], .projects-grid');
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"], .loading, .spinner');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-destructive');
    
    // Dashboard metrics cards
    this.activeProjectsCard = page.locator('[data-testid="active-projects-card"]').or(page.locator('p').filter({ hasText: 'Proyectos Activos' }).locator('..'));
    this.completedProjectsCard = page.locator('[data-testid="completed-projects-card"]').or(page.locator('p').filter({ hasText: 'Proyectos Completados' }).locator('..'));
    this.onHoldProjectsCard = page.locator('[data-testid="on-hold-projects-card"]').or(page.locator('p').filter({ hasText: 'En Pausa' }).locator('..'));
    this.totalProjectsCard = page.locator('[data-testid="total-projects-card"]').or(page.locator('p').filter({ hasText: 'Total Proyectos' }).locator('..'));
    
    // Product type metrics cards
    this.luItemsCard = page.locator('h3').filter({ hasText: 'Productos LU' }).locator('..');
    this.clItemsCard = page.locator('h3').filter({ hasText: 'Productos CL' }).locator('..');
    this.mpItemsCard = page.locator('h3').filter({ hasText: 'Productos MP' }).locator('..');
    
    // Project form elements
    this.projectForm = page.locator('form, [data-testid="project-form"]');
    this.projectNameInput = page.locator('input[name="name"], input[id="name"], #name');
    this.projectDescriptionInput = page.locator('textarea[name="description"], textarea[id="description"], #description');
    this.prioritySelect = page.locator('select[name="priority"], [data-testid="priority-select"]');
    this.startDateInput = page.locator('input[name="startDate"], input[id="startDate"], #startDate');
    this.expectedEndDateInput = page.locator('input[name="expectedEndDate"], input[id="expectedEndDate"], #expectedEndDate');
    this.submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: 'Crear Proyecto' }));
    this.cancelButton = page.locator('button').filter({ hasText: 'Cancelar' });
    this.formErrorMessage = page.locator('.text-destructive, .error, [data-testid="form-error"]');
    this.formSuccessMessage = page.locator('.text-green-800, .success, [data-testid="form-success"]');
    
    // Modal elements
    this.luImportModal = page.locator('[data-testid="lu-import-modal"], .modal').filter({ hasText: 'Importar LU' });
    this.addItemModal = page.locator('[data-testid="add-item-modal"], .modal').filter({ hasText: 'Agregar Item' });
    this.modalCloseButton = page.locator('.modal button[aria-label="Close"], .modal .close, [data-testid="modal-close"]');
    this.modalOverlay = page.locator('.modal-overlay, .backdrop, [data-testid="modal-overlay"]');
    
    // Workflow tracker elements
    this.workflowTracker = page.locator('[data-testid="workflow-tracker"], .workflow-tracker');
    this.workflowSteps = page.locator('[data-testid="workflow-step"], .workflow-step');
    this.currentStep = page.locator('[data-testid="current-step"], .current-step, .active-step');
    
    // Inventory dashboard elements
    this.inventoryDashboard = page.locator('[data-testid="inventory-dashboard"], .inventory-dashboard');
    this.inventoryItems = page.locator('[data-testid="inventory-item"], .inventory-item');
    this.inventoryFilters = page.locator('[data-testid="inventory-filters"], .inventory-filters');
  }
  
  async goto() {
    await this.page.goto('/es/projects');
    await this.waitForPageLoad();
  }
  
  async waitForPageLoad() {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }
  
  // Dashboard metrics methods
  async expectDashboardLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.createProjectButton).toBeVisible();
    await expect(this.activeProjectsCard).toBeVisible();
    await expect(this.completedProjectsCard).toBeVisible();
    await expect(this.onHoldProjectsCard).toBeVisible();
    await expect(this.totalProjectsCard).toBeVisible();
  }
  
  async getMetricCardValue(cardType: 'active' | 'completed' | 'onHold' | 'total'): Promise<string> {
    let card: Locator;
    switch (cardType) {
      case 'active':
        card = this.activeProjectsCard;
        break;
      case 'completed':
        card = this.completedProjectsCard;
        break;
      case 'onHold':
        card = this.onHoldProjectsCard;
        break;
      case 'total':
        card = this.totalProjectsCard;
        break;
    }
    
    const valueElement = card.locator('p.text-3xl, .metric-value, [data-testid="metric-value"]');
    return await valueElement.textContent() || '0';
  }
  
  async expectProductTypeMetrics() {
    await expect(this.luItemsCard).toBeVisible();
    await expect(this.clItemsCard).toBeVisible();
    await expect(this.mpItemsCard).toBeVisible();
  }
  
  async getProductTypeMetric(type: 'lu' | 'cl' | 'mp', metric: 'total' | 'completed' | 'inProcess'): Promise<string> {
    let card: Locator;
    switch (type) {
      case 'lu':
        card = this.luItemsCard;
        break;
      case 'cl':
        card = this.clItemsCard;
        break;
      case 'mp':
        card = this.mpItemsCard;
        break;
    }
    
    let selector: string;
    switch (metric) {
      case 'total':
        selector = 'span:has-text("Total:") + span';
        break;
      case 'completed':
        selector = 'span:has-text("Completados:") + span, span:has-text("Usados:") + span';
        break;
      case 'inProcess':
        selector = 'span:has-text("En Proceso:") + span';
        break;
    }
    
    const valueElement = card.locator(selector);
    return await valueElement.textContent() || '0';
  }
  
  // Project creation methods
  async clickCreateProject() {
    await this.createProjectButton.click();
    await expect(this.projectForm).toBeVisible();
  }
  
  async fillProjectForm(data: {
    name: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    startDate?: string;
    expectedEndDate?: string;
  }) {
    await this.projectNameInput.fill(data.name);
    
    if (data.description) {
      await this.projectDescriptionInput.fill(data.description);
    }
    
    if (data.priority) {
      // Handle both select and custom dropdown
      if (await this.prioritySelect.locator('option').count() > 0) {
        await this.prioritySelect.selectOption(data.priority);
      } else {
        // Custom dropdown
        await this.prioritySelect.click();
        await this.page.locator(`[data-value="${data.priority}"]`).click();
      }
    }
    
    if (data.startDate) {
      await this.startDateInput.fill(data.startDate);
    }
    
    if (data.expectedEndDate) {
      await this.expectedEndDateInput.fill(data.expectedEndDate);
    }
  }
  
  async submitProjectForm() {
    await this.submitButton.click();
  }
  
  async cancelProjectForm() {
    await this.cancelButton.click();
  }
  
  async expectFormError(message?: string) {
    await expect(this.formErrorMessage).toBeVisible();
    if (message) {
      await expect(this.formErrorMessage).toContainText(message);
    }
  }
  
  async expectFormSuccess(message?: string) {
    await expect(this.formSuccessMessage).toBeVisible();
    if (message) {
      await expect(this.formSuccessMessage).toContainText(message);
    }
  }
  
  // Search and filter methods
  async searchProjects(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Wait for search results
  }
  
  async filterProjects(filterValue: string) {
    await this.filterDropdown.selectOption(filterValue);
    await this.page.waitForTimeout(500); // Wait for filter results
  }
  
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
  }
  
  // Modal interaction methods
  async openLUImportModal() {
    const importButton = this.page.locator('button').filter({ hasText: 'Importar LU' });
    await importButton.click();
    await expect(this.luImportModal).toBeVisible();
  }
  
  async openAddItemModal() {
    const addItemButton = this.page.locator('button').filter({ hasText: 'Agregar Item' });
    await addItemButton.click();
    await expect(this.addItemModal).toBeVisible();
  }
  
  async closeModal() {
    await this.modalCloseButton.click();
    await expect(this.luImportModal).not.toBeVisible();
    await expect(this.addItemModal).not.toBeVisible();
  }
  
  async closeModalByOverlay() {
    await this.modalOverlay.click();
    await this.page.waitForTimeout(300);
  }
  
  // Workflow tracker methods
  async expectWorkflowTracker() {
    await expect(this.workflowTracker).toBeVisible();
    await expect(this.workflowSteps).toHaveCount(3, { timeout: 5000 });
  }
  
  async getCurrentWorkflowStep(): Promise<string> {
    return await this.currentStep.textContent() || '';
  }
  
  async clickWorkflowStep(stepIndex: number) {
    await this.workflowSteps.nth(stepIndex).click();
  }
  
  // Inventory dashboard methods
  async expectInventoryDashboard() {
    await expect(this.inventoryDashboard).toBeVisible();
  }
  
  async getInventoryItemsCount(): Promise<number> {
    return await this.inventoryItems.count();
  }
  
  async filterInventoryItems(filterValue: string) {
    const filterSelect = this.inventoryFilters.locator('select, [role="combobox"]');
    await filterSelect.selectOption(filterValue);
  }
  
  // Error handling methods
  async expectErrorMessage(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
  
  async expectNoErrorMessage() {
    await expect(this.errorMessage).not.toBeVisible();
  }
  
  // Loading state methods
  async expectLoadingState() {
    await expect(this.loadingIndicator).toBeVisible();
  }
  
  async expectLoadingComplete() {
    await expect(this.loadingIndicator).not.toBeVisible();
  }
  
  // Responsive design methods
  async checkMobileLayout() {
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.expectDashboardLoaded();
    
    // Check that elements are properly stacked on mobile
    const metricsCards = this.page.locator('.grid > div');
    const firstCard = metricsCards.first();
    const secondCard = metricsCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    if (firstCardBox && secondCardBox) {
      // On mobile, cards should be stacked vertically
      expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
    }
  }
  
  async checkTabletLayout() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.expectDashboardLoaded();
  }
  
  async checkDesktopLayout() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.expectDashboardLoaded();
  }
  
  // Accessibility methods
  async checkKeyboardNavigation() {
    await this.createProjectButton.focus();
    await expect(this.createProjectButton).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    // Check that focus moves to next interactive element
    const focusedElement = await this.page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  }
  
  async checkAriaLabels() {
    // Check that important elements have proper ARIA labels
    await expect(this.createProjectButton).toHaveAttribute('aria-label');
    await expect(this.searchInput).toHaveAttribute('aria-label');
  }
  
  async checkHeadingStructure() {
    const h1 = this.page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('Gestión de Proyectos');
    
    const h2Elements = this.page.locator('h2');
    const h2Count = await h2Elements.count();
    expect(h2Count).toBeGreaterThanOrEqual(0);
  }
  
  // Performance methods
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.goto();
    await this.expectDashboardLoaded();
    return Date.now() - startTime;
  }
  
  async simulateSlowNetwork() {
    await this.page.context().route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.continue();
    });
  }
  
  // Data validation methods
  async validateMetricsData() {
    const activeProjects = await this.getMetricCardValue('active');
    const completedProjects = await this.getMetricCardValue('completed');
    const onHoldProjects = await this.getMetricCardValue('onHold');
    const totalProjects = await this.getMetricCardValue('total');
    
    // Validate that all values are numeric
    expect(parseInt(activeProjects)).toBeGreaterThanOrEqual(0);
    expect(parseInt(completedProjects)).toBeGreaterThanOrEqual(0);
    expect(parseInt(onHoldProjects)).toBeGreaterThanOrEqual(0);
    expect(parseInt(totalProjects)).toBeGreaterThanOrEqual(0);
    
    // Validate that total equals sum of other metrics
    const calculatedTotal = parseInt(activeProjects) + parseInt(completedProjects) + parseInt(onHoldProjects);
    expect(parseInt(totalProjects)).toBe(calculatedTotal);
  }
  
  async refreshPage() {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}

export { ProjectsPage };