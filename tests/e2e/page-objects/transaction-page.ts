import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class TransactionBuilderModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly dialogTitle: Locator;
  readonly transactionTypeSelect: Locator;
  readonly barcodeInput: Locator;
  readonly addProductButton: Locator;
  readonly productSearchCard: Locator;
  readonly searchInput: Locator;
  readonly productList: Locator;
  readonly lineItemsContainer: Locator;
  readonly lineItems: Locator;
  readonly taxRateInput: Locator;
  readonly notesInput: Locator;
  readonly subtotalAmount: Locator;
  readonly taxAmount: Locator;
  readonly totalAmount: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]').filter({ hasText: 'Transaction Builder' });
    this.dialogTitle = this.modal.locator('[data-testid="dialog-title"]');
    this.transactionTypeSelect = this.modal.locator('select, [role="combobox"]').first();
    this.barcodeInput = this.modal.locator('input[placeholder*="barcode"]');
    this.addProductButton = this.modal.locator('button:has-text("Add Product")');
    this.productSearchCard = this.modal.locator('[data-testid="product-search-card"]');
    this.searchInput = this.modal.locator('input[placeholder*="Search products"]');
    this.productList = this.modal.locator('[data-testid="product-list"]');
    this.lineItemsContainer = this.modal.locator('[data-testid="line-items-container"]');
    this.lineItems = this.modal.locator('[data-testid="line-item"]');
    this.taxRateInput = this.modal.locator('input[type="number"]').filter({ hasText: 'Tax Rate' });
    this.notesInput = this.modal.locator('input[placeholder*="notes"], textarea[placeholder*="notes"]');
    this.subtotalAmount = this.modal.locator('[data-testid="subtotal-amount"]');
    this.taxAmount = this.modal.locator('[data-testid="tax-amount"]');
    this.totalAmount = this.modal.locator('[data-testid="total-amount"]');
    this.saveButton = this.modal.locator('button:has-text("Save Transaction")');
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');
    this.loadingIndicator = this.modal.locator('[data-testid="loading"]');
    this.errorMessage = this.modal.locator('[data-testid="error-message"]');
  }

  async waitForModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
    await expect(this.dialogTitle).toBeVisible();
  }

  async selectTransactionType(type: 'sale' | 'stock_addition'): Promise<void> {
    await this.transactionTypeSelect.click();
    const option = this.page.locator(`[role="option"]:has-text("${type === 'sale' ? 'Sale' : 'Stock Addition'}")`);
    await option.click();
  }

  async scanBarcode(barcode: string): Promise<void> {
    await this.barcodeInput.fill(barcode);
    await this.barcodeInput.press('Enter');
  }

  async openProductSearch(): Promise<void> {
    await this.addProductButton.click();
    await expect(this.productSearchCard).toBeVisible();
  }

  async searchProducts(searchTerm: string): Promise<void> {
    await this.openProductSearch();
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Wait for search debounce
  }

  async addProductByName(productName: string, quantity?: number): Promise<void> {
    await this.searchProducts(productName);
    
    const productItem = this.productList.locator(`[data-testid="product-item"]:has-text("${productName}")`);
    await expect(productItem).toBeVisible();
    await productItem.click();
    
    if (quantity && quantity > 1) {
      // Update quantity after adding
      const lineItem = this.getLineItemByProductName(productName);
      await this.updateLineItemQuantity(lineItem, quantity);
    }
  }

  async addProductBySku(sku: string, quantity?: number): Promise<void> {
    await this.searchProducts(sku);
    
    const productItem = this.productList.locator(`[data-testid="product-item"]:has-text("${sku}")`);
    await expect(productItem).toBeVisible();
    await productItem.click();
    
    if (quantity && quantity > 1) {
      const lineItem = this.getLineItemByProductName(sku);
      await this.updateLineItemQuantity(lineItem, quantity);
    }
  }

  getLineItemByProductName(productName: string): Locator {
    return this.lineItems.filter({ hasText: productName });
  }

  async updateLineItemQuantity(lineItem: Locator, quantity: number): Promise<void> {
    const quantityInput = lineItem.locator('input[type="number"]').filter({ hasText: 'Quantity' });
    await quantityInput.fill(quantity.toString());
  }

  async updateLineItemUnitPrice(lineItem: Locator, unitPrice: number): Promise<void> {
    const priceInput = lineItem.locator('input[type="number"]').filter({ hasText: 'Unit Price' });
    await priceInput.fill(unitPrice.toFixed(2));
  }

  async removeLineItem(lineItem: Locator): Promise<void> {
    const removeButton = lineItem.locator('button[data-testid="remove-item"]');
    await removeButton.click();
  }

  async setTaxRate(taxRate: number): Promise<void> {
    await this.taxRateInput.fill((taxRate * 100).toString());
  }

  async setNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  async saveTransaction(): Promise<void> {
    await this.saveButton.click();
  }

  async cancelTransaction(): Promise<void> {
    await this.cancelButton.click();
  }

  async getLineItemsCount(): Promise<number> {
    return await this.lineItems.count();
  }

  async getSubtotal(): Promise<string> {
    return await this.subtotalAmount.textContent() || '';
  }

  async getTax(): Promise<string> {
    return await this.taxAmount.textContent() || '';
  }

  async getTotal(): Promise<string> {
    return await this.totalAmount.textContent() || '';
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }

  async expectTransactionType(type: 'sale' | 'stock_addition'): Promise<void> {
    const expectedText = type === 'sale' ? 'Sale' : 'Stock Addition';
    await expect(this.dialogTitle).toContainText(expectedText);
  }

  async expectProductInList(productName: string): Promise<void> {
    const productItem = this.productList.locator(`[data-testid="product-item"]:has-text("${productName}")`);
    await expect(productItem).toBeVisible();
  }

  async expectLineItemExists(productName: string): Promise<void> {
    const lineItem = this.getLineItemByProductName(productName);
    await expect(lineItem).toBeVisible();
  }

  async expectLineItemQuantity(productName: string, expectedQuantity: number): Promise<void> {
    const lineItem = this.getLineItemByProductName(productName);
    const quantityInput = lineItem.locator('input[type="number"]').filter({ hasText: 'Quantity' });
    await expect(quantityInput).toHaveValue(expectedQuantity.toString());
  }

  async expectCalculatedTotals(expectedSubtotal: number, expectedTax: number, expectedTotal: number): Promise<void> {
    // Allow for small rounding differences
    const subtotalText = await this.getSubtotal();
    const taxText = await this.getTax();
    const totalText = await this.getTotal();
    
    // Extract numeric values from currency formatted strings
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.-]+/g, ''));
    const tax = parseFloat(taxText.replace(/[^0-9.-]+/g, ''));
    const total = parseFloat(totalText.replace(/[^0-9.-]+/g, ''));
    
    expect(Math.abs(subtotal - expectedSubtotal)).toBeLessThan(0.01);
    expect(Math.abs(tax - expectedTax)).toBeLessThan(0.01);
    expect(Math.abs(total - expectedTotal)).toBeLessThan(0.01);
  }

  async expectSaveButtonEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }

  async expectSaveButtonDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoadingState(): Promise<void> {
    await expect(this.loadingIndicator).toBeVisible();
  }
}

export class TransactionHistoryModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly searchInput: Locator;
  readonly typeFilter: Locator;
  readonly statusFilter: Locator;
  readonly userFilter: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly amountMinInput: Locator;
  readonly amountMaxInput: Locator;
  readonly sortFieldSelect: Locator;
  readonly sortDirectionSelect: Locator;
  readonly advancedFiltersToggle: Locator;
  readonly advancedFiltersPanel: Locator;
  readonly exportButton: Locator;
  readonly resetFiltersButton: Locator;
  readonly resetHistoryButton: Locator;
  readonly transactionCards: Locator;
  readonly summaryCards: Locator;
  readonly paginationControls: Locator;
  readonly itemsPerPageSelect: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]').filter({ hasText: 'Transaction History' });
    this.searchInput = this.modal.locator('input[placeholder*="Search transactions"]');
    this.typeFilter = this.modal.locator('select').filter({ hasText: 'All Types' });
    this.statusFilter = this.modal.locator('select').filter({ hasText: 'All Status' });
    this.userFilter = this.modal.locator('select').filter({ hasText: 'All Users' });
    this.dateFromInput = this.modal.locator('input[type="date"]').first();
    this.dateToInput = this.modal.locator('input[type="date"]').last();
    this.amountMinInput = this.modal.locator('input[placeholder*="0.00"]');
    this.amountMaxInput = this.modal.locator('input[placeholder*="999999"]');
    this.sortFieldSelect = this.modal.locator('select').filter({ hasText: 'Date' });
    this.sortDirectionSelect = this.modal.locator('select').filter({ hasText: 'Descending' });
    this.advancedFiltersToggle = this.modal.locator('button:has-text("More Filters")');
    this.advancedFiltersPanel = this.modal.locator('[data-testid="advanced-filters"]');
    this.exportButton = this.modal.locator('button:has-text("Export")');
    this.resetFiltersButton = this.modal.locator('button:has-text("Reset")');
    this.resetHistoryButton = this.modal.locator('button:has-text("Reset History")');
    this.transactionCards = this.modal.locator('[data-testid="transaction-card"]');
    this.summaryCards = this.modal.locator('[data-testid="summary-card"]');
    this.paginationControls = this.modal.locator('[data-testid="pagination"]');
    this.itemsPerPageSelect = this.modal.locator('select').filter({ hasText: 'per page' });
    this.closeButton = this.modal.locator('button[data-testid="close-modal"]');
  }

  async waitForModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async searchTransactions(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500);
  }

  async filterByType(type: 'all' | 'sale' | 'stock_addition'): Promise<void> {
    await this.typeFilter.selectOption(type);
  }

  async filterByStatus(status: 'all' | 'completed' | 'pending' | 'cancelled'): Promise<void> {
    await this.statusFilter.selectOption(status);
  }

  async filterByUser(user: string): Promise<void> {
    await this.userFilter.selectOption(user);
  }

  async filterByDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.showAdvancedFilters();
    await this.dateFromInput.fill(fromDate);
    await this.dateToInput.fill(toDate);
  }

  async filterByAmountRange(minAmount: number, maxAmount: number): Promise<void> {
    await this.showAdvancedFilters();
    await this.amountMinInput.fill(minAmount.toString());
    await this.amountMaxInput.fill(maxAmount.toString());
  }

  async sortBy(field: 'createdAt' | 'total' | 'createdBy' | 'type', direction: 'asc' | 'desc'): Promise<void> {
    await this.showAdvancedFilters();
    await this.sortFieldSelect.selectOption(field);
    await this.sortDirectionSelect.selectOption(direction);
  }

  async showAdvancedFilters(): Promise<void> {
    if (!(await this.advancedFiltersPanel.isVisible())) {
      await this.advancedFiltersToggle.click();
    }
  }

  async hideAdvancedFilters(): Promise<void> {
    if (await this.advancedFiltersPanel.isVisible()) {
      await this.advancedFiltersToggle.click();
    }
  }

  async exportTransactions(): Promise<void> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.exportButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/transactions.*\.csv$/);
  }

  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.click();
  }

  async resetHistory(): Promise<void> {
    await this.resetHistoryButton.click();
    
    // Handle confirmation dialog
    const confirmButton = this.page.locator('button:has-text("Reset History")').last();
    await confirmButton.click();
  }

  async viewTransactionDetails(transactionId: string): Promise<void> {
    const transactionCard = this.getTransactionCard(transactionId);
    const viewButton = transactionCard.locator('button:has-text("View"), button[data-testid="view-transaction"]');
    await viewButton.click();
  }

  async setItemsPerPage(itemsPerPage: number): Promise<void> {
    await this.showAdvancedFilters();
    await this.itemsPerPageSelect.selectOption(itemsPerPage.toString());
  }

  async navigateToPage(pageNumber: number): Promise<void> {
    const pageButton = this.paginationControls.locator(`button:has-text("${pageNumber}")`);
    await pageButton.click();
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  getTransactionCard(transactionId: string): Locator {
    return this.transactionCards.filter({ hasText: transactionId });
  }

  async getTransactionCount(): Promise<number> {
    return await this.transactionCards.count();
  }

  async getSummaryValue(metric: 'totalTransactions' | 'totalSales' | 'totalStockAdditions' | 'totalValue'): Promise<string> {
    const summaryCard = this.summaryCards.filter({ hasText: metric });
    return await summaryCard.locator('[data-testid="summary-value"]').textContent() || '';
  }

  async expectTransactionExists(transactionId: string): Promise<void> {
    const transactionCard = this.getTransactionCard(transactionId);
    await expect(transactionCard).toBeVisible();
  }

  async expectTransactionNotExists(transactionId: string): Promise<void> {
    const transactionCard = this.getTransactionCard(transactionId);
    await expect(transactionCard).not.toBeVisible();
  }

  async expectFilteredResults(expectedCount: number): Promise<void> {
    await expect(this.transactionCards).toHaveCount(expectedCount);
  }

  async expectSummaryMetric(metric: string, expectedValue: string): Promise<void> {
    const summaryCard = this.summaryCards.filter({ hasText: metric });
    await expect(summaryCard).toContainText(expectedValue);
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }

  async expectAdvancedFiltersVisible(): Promise<void> {
    await expect(this.advancedFiltersPanel).toBeVisible();
  }

  async expectAdvancedFiltersHidden(): Promise<void> {
    await expect(this.advancedFiltersPanel).not.toBeVisible();
  }
}

export class TransactionDetailsModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly transactionInfo: Locator;
  readonly lineItemsList: Locator;
  readonly transactionSummary: Locator;
  readonly notesSection: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="dialog"]').filter({ hasText: 'Transaction Details' });
    this.transactionInfo = this.modal.locator('[data-testid="transaction-info"]');
    this.lineItemsList = this.modal.locator('[data-testid="line-items-list"]');
    this.transactionSummary = this.modal.locator('[data-testid="transaction-summary"]');
    this.notesSection = this.modal.locator('[data-testid="notes-section"]');
    this.closeButton = this.modal.locator('button[data-testid="close-modal"]');
  }

  async waitForModal(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
  }

  async expectTransactionDetails(expectedDetails: any): Promise<void> {
    if (expectedDetails.id) {
      await expect(this.modal).toContainText(expectedDetails.id);
    }
    if (expectedDetails.type) {
      await expect(this.transactionInfo).toContainText(expectedDetails.type);
    }
    if (expectedDetails.status) {
      await expect(this.transactionInfo).toContainText(expectedDetails.status);
    }
    if (expectedDetails.createdBy) {
      await expect(this.transactionInfo).toContainText(expectedDetails.createdBy);
    }
    if (expectedDetails.total) {
      await expect(this.transactionSummary).toContainText(expectedDetails.total);
    }
  }

  async expectLineItemsCount(expectedCount: number): Promise<void> {
    const lineItems = this.lineItemsList.locator('[data-testid="line-item"]');
    await expect(lineItems).toHaveCount(expectedCount);
  }

  async expectLineItemDetails(productName: string, quantity: number, unitPrice: number): Promise<void> {
    const lineItem = this.lineItemsList.locator(`[data-testid="line-item"]:has-text("${productName}")`);
    await expect(lineItem).toBeVisible();
    await expect(lineItem).toContainText(quantity.toString());
    await expect(lineItem).toContainText(unitPrice.toFixed(2));
  }

  async expectNotes(expectedNotes: string): Promise<void> {
    await expect(this.notesSection).toBeVisible();
    await expect(this.notesSection).toContainText(expectedNotes);
  }

  async expectModalClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible();
  }
}

export class InventoryPageWithTransactions extends BasePage {
  readonly transactionBuilderButton: Locator;
  readonly transactionHistoryButton: Locator;
  readonly transactionModeToggle: Locator;
  readonly transactionBuilder: TransactionBuilderModal;
  readonly transactionHistory: TransactionHistoryModal;
  readonly transactionDetails: TransactionDetailsModal;

  constructor(page: Page) {
    super(page);
    this.transactionBuilderButton = page.locator('button:has-text("New Transaction"), button[data-testid="new-transaction"]');
    this.transactionHistoryButton = page.locator('button:has-text("Transaction History"), button[data-testid="transaction-history"]');
    this.transactionModeToggle = page.locator('[data-testid="transaction-mode-toggle"]');
    this.transactionBuilder = new TransactionBuilderModal(page);
    this.transactionHistory = new TransactionHistoryModal(page);
    this.transactionDetails = new TransactionDetailsModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.transactionBuilderButton).toBeVisible();
  }

  async openTransactionBuilder(mode?: 'sale' | 'stock_addition'): Promise<void> {
    if (mode) {
      await this.setTransactionMode(mode);
    }
    await this.transactionBuilderButton.click();
    await this.transactionBuilder.waitForModal();
  }

  async openTransactionHistory(): Promise<void> {
    await this.transactionHistoryButton.click();
    await this.transactionHistory.waitForModal();
  }

  async setTransactionMode(mode: 'sale' | 'stock_addition'): Promise<void> {
    if (await this.transactionModeToggle.isVisible()) {
      await this.transactionModeToggle.selectOption(mode);
    }
  }

  async expectTransactionButtonsVisible(): Promise<void> {
    await expect(this.transactionBuilderButton).toBeVisible();
    await expect(this.transactionHistoryButton).toBeVisible();
  }
}

export class TransactionWorkflow {
  readonly inventoryPage: InventoryPageWithTransactions;

  constructor(page: Page) {
    this.inventoryPage = new InventoryPageWithTransactions(page);
  }

  async createSaleTransaction(products: Array<{ name: string; quantity: number; unitPrice?: number }>, options?: { taxRate?: number; notes?: string }): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.openTransactionBuilder('sale');
    
    // Add products
    for (const product of products) {
      await this.inventoryPage.transactionBuilder.addProductByName(product.name, product.quantity);
      
      if (product.unitPrice) {
        const lineItem = this.inventoryPage.transactionBuilder.getLineItemByProductName(product.name);
        await this.inventoryPage.transactionBuilder.updateLineItemUnitPrice(lineItem, product.unitPrice);
      }
    }
    
    // Set options
    if (options?.taxRate) {
      await this.inventoryPage.transactionBuilder.setTaxRate(options.taxRate);
    }
    if (options?.notes) {
      await this.inventoryPage.transactionBuilder.setNotes(options.notes);
    }
    
    // Save transaction
    await this.inventoryPage.transactionBuilder.saveTransaction();
    await this.inventoryPage.transactionBuilder.expectModalClosed();
  }

  async createStockAdditionTransaction(products: Array<{ name: string; quantity: number; unitPrice?: number }>, options?: { taxRate?: number; notes?: string }): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.openTransactionBuilder('stock_addition');
    
    // Add products
    for (const product of products) {
      await this.inventoryPage.transactionBuilder.addProductByName(product.name, product.quantity);
      
      if (product.unitPrice) {
        const lineItem = this.inventoryPage.transactionBuilder.getLineItemByProductName(product.name);
        await this.inventoryPage.transactionBuilder.updateLineItemUnitPrice(lineItem, product.unitPrice);
      }
    }
    
    // Set options
    if (options?.taxRate) {
      await this.inventoryPage.transactionBuilder.setTaxRate(options.taxRate);
    }
    if (options?.notes) {
      await this.inventoryPage.transactionBuilder.setNotes(options.notes);
    }
    
    // Save transaction
    await this.inventoryPage.transactionBuilder.saveTransaction();
    await this.inventoryPage.transactionBuilder.expectModalClosed();
  }

  async viewTransactionHistory(): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.openTransactionHistory();
  }

  async searchTransactionHistory(searchTerm: string): Promise<void> {
    await this.viewTransactionHistory();
    await this.inventoryPage.transactionHistory.searchTransactions(searchTerm);
  }

  async filterTransactionHistory(filters: { type?: string; status?: string; user?: string; dateFrom?: string; dateTo?: string }): Promise<void> {
    await this.viewTransactionHistory();
    
    if (filters.type) {
      await this.inventoryPage.transactionHistory.filterByType(filters.type as any);
    }
    if (filters.status) {
      await this.inventoryPage.transactionHistory.filterByStatus(filters.status as any);
    }
    if (filters.user) {
      await this.inventoryPage.transactionHistory.filterByUser(filters.user);
    }
    if (filters.dateFrom && filters.dateTo) {
      await this.inventoryPage.transactionHistory.filterByDateRange(filters.dateFrom, filters.dateTo);
    }
  }

  async exportTransactionHistory(): Promise<void> {
    await this.viewTransactionHistory();
    await this.inventoryPage.transactionHistory.exportTransactions();
  }

  async viewTransactionDetails(transactionId: string): Promise<void> {
    await this.viewTransactionHistory();
    await this.inventoryPage.transactionHistory.viewTransactionDetails(transactionId);
    await this.inventoryPage.transactionDetails.waitForModal();
  }
}