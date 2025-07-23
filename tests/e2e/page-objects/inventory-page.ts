import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { selectors, urls, formData } from '../fixtures/test-data';

export class InventoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.inventory);
    await this.waitForPageLoad();
  }

  async expectInventoryPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(urls.inventory);
    await this.waitForElement(selectors.inventory.createButton);
    await this.waitForElement(selectors.tables.table);
  }

  async clickCreateInventory(): Promise<void> {
    await this.click(selectors.inventory.createButton);
    await this.page.waitForURL(urls.inventoryCreate);
  }

  async searchInventory(searchTerm: string): Promise<void> {
    await this.searchTable(searchTerm, selectors.inventory.searchInput);
  }

  async getInventoryItemsCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  async selectInventoryItem(index: number): Promise<void> {
    const checkbox = this.page.locator(`${selectors.inventory.itemRow}:nth-child(${index + 1}) input[type="checkbox"]`);
    await checkbox.check();
  }

  async selectAllInventoryItems(): Promise<void> {
    await this.click(selectors.inventory.bulkSelectAll);
  }

  async performBulkAction(action: string): Promise<void> {
    await this.helpers.performBulkAction(action);
  }

  async editInventoryItem(index: number): Promise<void> {
    const editButton = this.page.locator(`${selectors.inventory.itemRow}:nth-child(${index + 1}) ${selectors.inventory.editButton}`);
    await editButton.click();
  }

  async deleteInventoryItem(index: number): Promise<void> {
    const deleteButton = this.page.locator(`${selectors.inventory.itemRow}:nth-child(${index + 1}) ${selectors.inventory.deleteButton}`);
    await deleteButton.click();
    await this.confirmAction();
  }

  async quickStockAdjustment(index: number): Promise<void> {
    const quickStockButton = this.page.locator(`${selectors.inventory.itemRow}:nth-child(${index + 1}) ${selectors.inventory.quickStockButton}`);
    await quickStockButton.click();
  }

  async filterByCategory(category: string): Promise<void> {
    await this.click(selectors.inventory.filterButton);
    await this.helpers.selectOption('[data-testid="category-filter"]', category);
    await this.click('[data-testid="apply-filter"]');
  }

  async filterByLocation(location: string): Promise<void> {
    await this.click(selectors.inventory.filterButton);
    await this.helpers.selectOption('[data-testid="location-filter"]', location);
    await this.click('[data-testid="apply-filter"]');
  }

  async filterByStockLevel(level: 'low' | 'normal' | 'high'): Promise<void> {
    await this.click(selectors.inventory.filterButton);
    await this.helpers.selectOption('[data-testid="stock-level-filter"]', level);
    await this.click('[data-testid="apply-filter"]');
  }

  async clearFilters(): Promise<void> {
    await this.click('[data-testid="clear-filters"]');
  }

  async sortByColumn(column: string): Promise<void> {
    const sortButton = this.page.locator(`[data-testid="sort-${column}"]`);
    await sortButton.click();
  }

  async expectInventoryItemVisible(itemName: string): Promise<void> {
    const table = this.page.locator(selectors.tables.table);
    await expect(table).toContainText(itemName);
  }

  async expectInventoryItemNotVisible(itemName: string): Promise<void> {
    const table = this.page.locator(selectors.tables.table);
    await expect(table).not.toContainText(itemName);
  }

  async getInventoryItemDetails(index: number): Promise<any> {
    const row = this.page.locator(`${selectors.inventory.itemRow}:nth-child(${index + 1})`);
    
    return {
      name: await row.locator('[data-testid="item-name"]').textContent(),
      sku: await row.locator('[data-testid="item-sku"]').textContent(),
      quantity: await row.locator('[data-testid="item-quantity"]').textContent(),
      price: await row.locator('[data-testid="item-price"]').textContent(),
      category: await row.locator('[data-testid="item-category"]').textContent(),
      location: await row.locator('[data-testid="item-location"]').textContent()
    };
  }

  async expectLowStockWarning(itemName: string): Promise<void> {
    const warningIcon = this.page.locator(`[data-testid="low-stock-warning-${itemName}"]`);
    await expect(warningIcon).toBeVisible();
  }

  async navigateToPage(pageNumber: number): Promise<void> {
    const pageButton = this.page.locator(`[data-testid="page-${pageNumber}"]`);
    await pageButton.click();
    await this.waitForPageLoad();
  }

  async expectPaginationVisible(): Promise<void> {
    const pagination = this.page.locator(selectors.tables.pagination);
    await expect(pagination).toBeVisible();
  }
}

export class InventoryCreatePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(urls.inventoryCreate);
    await this.waitForPageLoad();
  }

  async fillInventoryForm(data: any): Promise<void> {
    await this.fillField(selectors.forms.nameInput, data.name);
    await this.fillField(selectors.forms.descriptionInput, data.description);
    await this.fillField(selectors.forms.skuInput, data.sku);
    await this.fillField(selectors.forms.quantityInput, data.quantity);
    await this.fillField(selectors.forms.priceInput, data.price);
    
    if (data.category) {
      await this.helpers.selectOption(selectors.forms.categorySelect, data.category);
    }
    
    if (data.location) {
      await this.helpers.selectOption(selectors.forms.locationSelect, data.location);
    }
    
    if (data.minStockLevel) {
      await this.fillField('[data-testid="min-stock-input"]', data.minStockLevel);
    }
    
    if (data.maxStockLevel) {
      await this.fillField('[data-testid="max-stock-input"]', data.maxStockLevel);
    }
  }

  async saveInventoryItem(): Promise<void> {
    await this.click(selectors.forms.saveButton);
  }

  async cancelInventoryCreation(): Promise<void> {
    await this.click(selectors.forms.cancelButton);
  }

  async createInventoryItem(data: any): Promise<void> {
    await this.fillInventoryForm(data);
    await this.saveInventoryItem();
    await this.waitForToast('Inventory item created successfully');
  }

  async expectValidationErrors(fields: string[]): Promise<void> {
    for (const field of fields) {
      const errorMessage = this.page.locator(`[data-testid="${field}-error"]`);
      await expect(errorMessage).toBeVisible();
    }
  }

  async expectFormPreFilled(data: any): Promise<void> {
    if (data.name) {
      await expect(this.page.locator(selectors.forms.nameInput)).toHaveValue(data.name);
    }
    if (data.sku) {
      await expect(this.page.locator(selectors.forms.skuInput)).toHaveValue(data.sku);
    }
    if (data.quantity) {
      await expect(this.page.locator(selectors.forms.quantityInput)).toHaveValue(data.quantity);
    }
  }

  async uploadImage(imagePath: string): Promise<void> {
    const fileInput = this.page.locator('[data-testid="image-upload"]');
    await fileInput.setInputFiles(imagePath);
  }

  async expectImagePreview(): Promise<void> {
    const imagePreview = this.page.locator('[data-testid="image-preview"]');
    await expect(imagePreview).toBeVisible();
  }
}

export class InventoryEditPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    // This will be called with itemId parameter in gotoEdit method
    await this.waitForPageLoad();
  }

  async gotoEdit(itemId: string): Promise<void> {
    await this.page.goto(urls.inventoryEdit(itemId));
    await this.waitForPageLoad();
  }

  async updateInventoryItem(data: any): Promise<void> {
    if (data.name) {
      await this.fillField(selectors.forms.nameInput, data.name);
    }
    if (data.description) {
      await this.fillField(selectors.forms.descriptionInput, data.description);
    }
    if (data.quantity) {
      await this.fillField(selectors.forms.quantityInput, data.quantity);
    }
    if (data.price) {
      await this.fillField(selectors.forms.priceInput, data.price);
    }
    
    await this.click(selectors.forms.saveButton);
    await this.waitForToast('Inventory item updated successfully');
  }

  async expectFormPreFilled(): Promise<void> {
    // Check that form fields are pre-filled with existing data
    const nameInput = this.page.locator(selectors.forms.nameInput);
    const skuInput = this.page.locator(selectors.forms.skuInput);
    const quantityInput = this.page.locator(selectors.forms.quantityInput);
    
    await expect(nameInput).not.toHaveValue('');
    await expect(skuInput).not.toHaveValue('');
    await expect(quantityInput).not.toHaveValue('');
  }

  async deleteInventoryItem(): Promise<void> {
    await this.click('[data-testid="delete-item-button"]');
    await this.confirmAction();
    await this.waitForToast('Inventory item deleted successfully');
  }
}

export class QuickStockModal extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    // Modal doesn't have a direct URL, it's opened from inventory page
    throw new Error('QuickStockModal is opened from inventory page, not navigated to directly');
  }

  async expectModalVisible(): Promise<void> {
    const modal = this.page.locator('[data-testid="quick-stock-modal"]');
    await expect(modal).toBeVisible();
  }

  async adjustStock(quantity: string, type: 'in' | 'out', notes?: string): Promise<void> {
    await this.fillField('[data-testid="stock-quantity"]', quantity);
    await this.helpers.selectOption('[data-testid="stock-type"]', type);
    
    if (notes) {
      await this.fillField('[data-testid="stock-notes"]', notes);
    }
    
    await this.click('[data-testid="apply-stock-adjustment"]');
    await this.waitForToast('Stock adjusted successfully');
  }

  async closeModal(): Promise<void> {
    await this.click('[data-testid="close-modal"]');
  }
}

export class BulkOperationsModal extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    // Modal doesn't have a direct URL, it's opened from inventory page
    throw new Error('BulkOperationsModal is opened from inventory page, not navigated to directly');
  }

  async expectModalVisible(): Promise<void> {
    const modal = this.page.locator('[data-testid="bulk-operations-modal"]');
    await expect(modal).toBeVisible();
  }

  async performBulkUpdate(field: string, value: string): Promise<void> {
    await this.helpers.selectOption('[data-testid="bulk-field"]', field);
    await this.fillField('[data-testid="bulk-value"]', value);
    await this.click('[data-testid="apply-bulk-update"]');
    await this.confirmAction();
    await this.waitForToast('Bulk update completed successfully');
  }

  async performBulkDelete(): Promise<void> {
    await this.click('[data-testid="bulk-delete"]');
    await this.confirmAction();
    await this.waitForToast('Items deleted successfully');
  }

  async expectSelectedItemsCount(count: number): Promise<void> {
    const selectedCount = this.page.locator('[data-testid="selected-items-count"]');
    await expect(selectedCount).toContainText(count.toString());
  }
}

export class InventoryFlow {
  private inventoryPage: InventoryPage;
  private createPage: InventoryCreatePage;
  private editPage: InventoryEditPage;
  private quickStockModal: QuickStockModal;
  private bulkOperationsModal: BulkOperationsModal;

  constructor(private page: Page) {
    this.inventoryPage = new InventoryPage(page);
    this.createPage = new InventoryCreatePage(page);
    this.editPage = new InventoryEditPage(page);
    this.quickStockModal = new QuickStockModal(page);
    this.bulkOperationsModal = new BulkOperationsModal(page);
  }

  get inventory(): InventoryPage {
    return this.inventoryPage;
  }

  get create(): InventoryCreatePage {
    return this.createPage;
  }

  get edit(): InventoryEditPage {
    return this.editPage;
  }

  get quickStock(): QuickStockModal {
    return this.quickStockModal;
  }

  get bulkOperations(): BulkOperationsModal {
    return this.bulkOperationsModal;
  }

  async createNewInventoryItem(): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.clickCreateInventory();
    await this.createPage.createInventoryItem(formData.newInventoryItem);
    await this.page.waitForURL(urls.inventory);
    await this.inventoryPage.expectInventoryItemVisible(formData.newInventoryItem.name);
  }

  async editExistingInventoryItem(): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.editInventoryItem(0);
    await this.editPage.gotoEdit('test-item-1');
    await this.editPage.updateInventoryItem(formData.editInventoryItem);
    await this.page.waitForURL(urls.inventory);
  }

  async performQuickStockOperation(): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.quickStockAdjustment(0);
    await this.quickStockModal.expectModalVisible();
    await this.quickStockModal.adjustStock('10', 'in', 'Test stock adjustment');
  }

  async performBulkOperations(): Promise<void> {
    await this.inventoryPage.goto();
    await this.inventoryPage.selectAllInventoryItems();
    await this.inventoryPage.performBulkAction('update');
    await this.bulkOperationsModal.expectModalVisible();
    await this.bulkOperationsModal.performBulkUpdate('price', '25.99');
  }

  async testSearchAndFilter(): Promise<void> {
    await this.inventoryPage.goto();
    
    // Test search
    await this.inventoryPage.searchInventory('Test');
    
    // Test category filter
    await this.inventoryPage.filterByCategory('Electronics');
    
    // Test location filter
    await this.inventoryPage.filterByLocation('Warehouse A');
    
    // Test stock level filter
    await this.inventoryPage.filterByStockLevel('low');
    
    // Clear filters
    await this.inventoryPage.clearFilters();
  }

  async testSortingAndPagination(): Promise<void> {
    await this.inventoryPage.goto();
    
    // Test sorting
    await this.inventoryPage.sortByColumn('name');
    await this.inventoryPage.sortByColumn('quantity');
    await this.inventoryPage.sortByColumn('price');
    
    // Test pagination if available
    const itemsCount = await this.inventoryPage.getInventoryItemsCount();
    if (itemsCount > 10) {
      await this.inventoryPage.expectPaginationVisible();
      await this.inventoryPage.navigateToPage(2);
    }
  }
}