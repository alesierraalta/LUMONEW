import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base-page'

export interface Category {
  id?: string
  name: string
  description?: string
  color: string
}

export class CategoriesListPage extends BasePage {
  readonly url = '/categories'
  readonly pageTitle = 'Categories'
  
  // Main elements
  readonly heading: Locator
  readonly addCategoryButton: Locator
  readonly importButton: Locator
  readonly exportButton: Locator
  
  // Search and filters
  readonly searchInput: Locator
  readonly sortByNameButton: Locator
  readonly sortByItemCountButton: Locator
  readonly sortByCreatedAtButton: Locator
  
  // Table elements
  readonly categoriesTable: Locator
  readonly tableRows: Locator
  readonly selectAllCheckbox: Locator
  readonly bulkActionsPanel: Locator
  readonly bulkDeleteButton: Locator
  readonly exportSelectedButton: Locator
  
  // Loading and error states
  readonly loadingSpinner: Locator
  readonly errorMessage: Locator
  readonly emptyState: Locator

  constructor(page: Page) {
    super(page)
    
    // Main elements
    this.heading = page.getByRole('heading', { name: 'Categories' })
    this.addCategoryButton = page.getByRole('button', { name: /add category/i })
    this.importButton = page.getByRole('button', { name: /import/i })
    this.exportButton = page.getByRole('button', { name: /export/i })
    
    // Search and filters
    this.searchInput = page.getByPlaceholder('Search categories...')
    this.sortByNameButton = page.getByRole('button', { name: /name/i })
    this.sortByItemCountButton = page.getByRole('button', { name: /item count/i })
    this.sortByCreatedAtButton = page.getByRole('button', { name: /created/i })
    
    // Table elements
    this.categoriesTable = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.selectAllCheckbox = page.locator('thead input[type="checkbox"]')
    this.bulkActionsPanel = page.locator('.bg-blue-50')
    this.bulkDeleteButton = page.getByRole('button', { name: /delete selected/i })
    this.exportSelectedButton = page.getByRole('button', { name: /export selected/i })
    
    // Loading and error states
    this.loadingSpinner = page.locator('.animate-spin')
    this.errorMessage = page.locator('.text-red-600')
    this.emptyState = page.getByText('No categories found')
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url)
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  async searchCategories(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm)
    await this.page.waitForTimeout(500) // Wait for debounced search
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear()
    await this.page.waitForTimeout(500)
  }

  async sortBy(field: 'name' | 'itemCount' | 'createdAt'): Promise<void> {
    switch (field) {
      case 'name':
        await this.sortByNameButton.click()
        break
      case 'itemCount':
        await this.sortByItemCountButton.click()
        break
      case 'createdAt':
        await this.sortByCreatedAtButton.click()
        break
    }
    await this.page.waitForTimeout(300)
  }

  async getCategoryRows(): Promise<Locator[]> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 5000 })
    return await this.tableRows.all()
  }

  async getCategoryByName(name: string): Promise<Locator> {
    return this.page.locator(`tr:has-text("${name}")`)
  }

  async selectCategory(name: string): Promise<void> {
    const row = await this.getCategoryByName(name)
    const checkbox = row.locator('input[type="checkbox"]')
    await checkbox.check()
  }

  async selectAllCategories(): Promise<void> {
    await this.selectAllCheckbox.check()
  }

  async deselectAllCategories(): Promise<void> {
    await this.selectAllCheckbox.uncheck()
  }

  async getSelectedCategoriesCount(): Promise<number> {
    const selectedText = await this.bulkActionsPanel.locator('.text-blue-800').textContent()
    const match = selectedText?.match(/(\d+) categories selected/)
    return match ? parseInt(match[1]) : 0
  }

  async bulkDeleteCategories(): Promise<void> {
    await this.bulkDeleteButton.click()
    // Handle confirmation dialog
    this.page.on('dialog', async dialog => {
      await dialog.accept()
    })
  }

  async exportSelectedCategories(): Promise<void> {
    await this.exportSelectedButton.click()
  }

  async editCategory(name: string): Promise<void> {
    const row = await this.getCategoryByName(name)
    const editButton = row.getByRole('button').filter({ hasText: /edit/i })
    await editButton.click()
  }

  async deleteCategory(name: string): Promise<void> {
    const row = await this.getCategoryByName(name)
    const deleteButton = row.locator('button:has(.lucide-trash-2)')
    await deleteButton.click()
    
    // Handle confirmation dialog
    this.page.on('dialog', async dialog => {
      await dialog.accept()
    })
  }

  async viewCategory(name: string): Promise<void> {
    const row = await this.getCategoryByName(name)
    const viewButton = row.locator('button:has(.lucide-eye)')
    await viewButton.click()
  }

  async getCategoryData(name: string): Promise<any> {
    const row = await this.getCategoryByName(name)
    const cells = await row.locator('td').all()
    
    return {
      name: await cells[1].textContent(),
      description: await cells[2].textContent(),
      created: await cells[3].textContent(),
      updated: await cells[4].textContent()
    }
  }

  async waitForCategoriesLoad(): Promise<void> {
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.animate-spin')
      return !spinner || (spinner as HTMLElement).offsetParent === null
    })
  }

  async verifyCategoryExists(name: string): Promise<boolean> {
    try {
      const row = await this.getCategoryByName(name)
      await expect(row).toBeVisible()
      return true
    } catch {
      return false
    }
  }

  async verifyCategoryNotExists(name: string): Promise<boolean> {
    try {
      const row = await this.getCategoryByName(name)
      await expect(row).not.toBeVisible()
      return true
    } catch {
      return true
    }
  }

  async getTableRowCount(): Promise<number> {
    return await this.tableRows.count()
  }

  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible()
  }

  async verifyLoadingState(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible()
  }

  async verifyErrorState(): Promise<void> {
    await expect(this.errorMessage).toBeVisible()
  }
}

export class CategoryEditPage {
  readonly url = '/categories/edit'
  readonly pageTitle = 'Editar Categoría'
  readonly page: Page
  
  // Form elements
  readonly heading: Locator
  readonly backButton: Locator
  readonly nameInput: Locator
  readonly descriptionTextarea: Locator
  readonly colorSelect: Locator
  readonly colorPreview: Locator
  readonly previewSection: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  
  // Error elements
  readonly nameError: Locator
  readonly colorError: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    
    this.heading = page.getByRole('heading', { name: /editar categoría/i })
    this.backButton = page.getByRole('button', { name: /volver a categorías/i })
    this.nameInput = page.locator('#name')
    this.descriptionTextarea = page.locator('#description')
    this.colorSelect = page.locator('#color')
    this.colorPreview = page.locator('.w-8.h-8.rounded-full')
    this.previewSection = page.locator('.bg-gray-50')
    this.cancelButton = page.getByRole('button', { name: /cancelar/i })
    this.saveButton = page.getByRole('button', { name: /actualizar categoría/i })
    
    this.nameError = page.locator('.text-red-600').filter({ hasText: /nombre/i })
    this.colorError = page.locator('.text-red-600').filter({ hasText: /color/i })
    this.loadingSpinner = page.locator('.animate-spin')
  }

  async goto(categoryId: string): Promise<void> {
    await this.page.goto(`${this.url}/${categoryId}`)
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  async fillForm(category: Partial<Category>): Promise<void> {
    if (category.name !== undefined) {
      await this.nameInput.fill(category.name)
    }
    
    if (category.description !== undefined) {
      await this.descriptionTextarea.fill(category.description)
    }
    
    if (category.color !== undefined) {
      await this.colorSelect.selectOption(category.color)
    }
  }

  async updateCategory(category: Partial<Category>): Promise<void> {
    await this.fillForm(category)
    await this.saveButton.click()
  }

  async cancelEdit(): Promise<void> {
    await this.cancelButton.click()
  }

  async goBack(): Promise<void> {
    await this.backButton.click()
  }

  async verifyFormData(category: Partial<Category>): Promise<void> {
    if (category.name !== undefined) {
      await expect(this.nameInput).toHaveValue(category.name)
    }
    
    if (category.description !== undefined) {
      await expect(this.descriptionTextarea).toHaveValue(category.description)
    }
    
    if (category.color !== undefined) {
      await expect(this.colorSelect).toHaveValue(category.color)
    }
  }

  async verifyPreview(category: Partial<Category>): Promise<void> {
    if (category.name) {
      await expect(this.previewSection).toContainText(category.name)
    }
    
    if (category.description) {
      await expect(this.previewSection).toContainText(category.description)
    }
  }

  async verifyValidationErrors(): Promise<void> {
    await expect(this.nameError).toBeVisible()
  }

  async verifyLoadingState(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible()
    await expect(this.saveButton).toContainText(/actualizando/i)
  }

  async waitForSave(): Promise<void> {
    await this.page.waitForURL('/categories')
  }
}

export class CategoriesWorkflow {
  constructor(
    private page: Page,
    public categoriesListPage: CategoriesListPage,
    public categoryEditPage: CategoryEditPage
  ) {}

  static create(page: Page): CategoriesWorkflow {
    return new CategoriesWorkflow(
      page,
      new CategoriesListPage(page),
      new CategoryEditPage(page)
    )
  }

  async navigateToCategories(): Promise<void> {
    await this.categoriesListPage.goto()
  }

  async createCategoryWorkflow(category: Category): Promise<void> {
    await this.categoriesListPage.goto()
    await this.categoriesListPage.addCategoryButton.click()
    // Note: Create page implementation would go here when available
  }

  async editCategoryWorkflow(currentName: string, updatedCategory: Partial<Category>): Promise<void> {
    await this.categoriesListPage.goto()
    await this.categoriesListPage.editCategory(currentName)
    await this.categoryEditPage.updateCategory(updatedCategory)
    await this.categoryEditPage.waitForSave()
  }

  async deleteCategoryWorkflow(name: string): Promise<void> {
    await this.categoriesListPage.goto()
    await this.categoriesListPage.deleteCategory(name)
    await this.categoriesListPage.waitForCategoriesLoad()
  }

  async bulkDeleteCategoriesWorkflow(categoryNames: string[]): Promise<void> {
    await this.categoriesListPage.goto()
    
    for (const name of categoryNames) {
      await this.categoriesListPage.selectCategory(name)
    }
    
    await this.categoriesListPage.bulkDeleteCategories()
    await this.categoriesListPage.waitForCategoriesLoad()
  }

  async searchCategoriesWorkflow(searchTerm: string): Promise<void> {
    await this.categoriesListPage.goto()
    await this.categoriesListPage.searchCategories(searchTerm)
  }

  async sortCategoriesWorkflow(field: 'name' | 'itemCount' | 'createdAt'): Promise<void> {
    await this.categoriesListPage.goto()
    await this.categoriesListPage.sortBy(field)
  }
}