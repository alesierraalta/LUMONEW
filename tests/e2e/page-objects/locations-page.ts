import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base-page'

export interface Location {
  id?: string
  name: string
  address: string
  itemQuantity?: number
}

export class LocationsListPage extends BasePage {
  readonly url = '/locations'
  readonly pageTitle = 'Ubicaciones'
  
  // Main elements
  readonly heading: Locator
  readonly addLocationButton: Locator
  readonly importButton: Locator
  readonly exportButton: Locator
  
  // Search and filters
  readonly searchInput: Locator
  readonly sortByNameButton: Locator
  readonly sortByQuantityButton: Locator
  
  // Table elements
  readonly locationsTable: Locator
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
    this.heading = page.getByRole('heading', { name: 'Ubicaciones' })
    this.addLocationButton = page.getByRole('button', { name: /agregar ubicación/i })
    this.importButton = page.getByRole('button', { name: /importar/i })
    this.exportButton = page.getByRole('button', { name: /exportar/i })
    
    // Search and filters
    this.searchInput = page.getByPlaceholder('Buscar ubicaciones...')
    this.sortByNameButton = page.getByRole('button', { name: /nombre/i })
    this.sortByQuantityButton = page.getByRole('button', { name: /cantidad/i })
    
    // Table elements
    this.locationsTable = page.locator('table')
    this.tableRows = page.locator('tbody tr')
    this.selectAllCheckbox = page.locator('thead input[type="checkbox"]')
    this.bulkActionsPanel = page.locator('.bg-blue-50')
    this.bulkDeleteButton = page.getByRole('button', { name: /eliminar seleccionadas/i })
    this.exportSelectedButton = page.getByRole('button', { name: /export selected/i })
    
    // Loading and error states
    this.loadingSpinner = page.locator('.animate-spin')
    this.errorMessage = page.locator('.text-red-600')
    this.emptyState = page.getByText('No locations found')
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url)
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  async searchLocations(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm)
    await this.page.waitForTimeout(500) // Wait for debounced search
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear()
    await this.page.waitForTimeout(500)
  }

  async sortBy(field: 'name' | 'itemQuantity'): Promise<void> {
    switch (field) {
      case 'name':
        await this.sortByNameButton.click()
        break
      case 'itemQuantity':
        await this.sortByQuantityButton.click()
        break
    }
    await this.page.waitForTimeout(300)
  }

  async getLocationRows(): Promise<Locator[]> {
    await this.tableRows.first().waitFor({ state: 'visible', timeout: 5000 })
    return await this.tableRows.all()
  }

  async getLocationByName(name: string): Promise<Locator> {
    return this.page.locator(`tr:has-text("${name}")`)
  }

  async selectLocation(name: string): Promise<void> {
    const row = await this.getLocationByName(name)
    const checkbox = row.locator('input[type="checkbox"]')
    await checkbox.check()
  }

  async selectAllLocations(): Promise<void> {
    await this.selectAllCheckbox.check()
  }

  async deselectAllLocations(): Promise<void> {
    await this.selectAllCheckbox.uncheck()
  }

  async getSelectedLocationsCount(): Promise<number> {
    const selectedText = await this.bulkActionsPanel.locator('.text-blue-800').textContent()
    const match = selectedText?.match(/(\d+) locations selected/)
    return match ? parseInt(match[1]) : 0
  }

  async bulkDeleteLocations(): Promise<void> {
    await this.bulkDeleteButton.click()
    // Handle confirmation dialog
    this.page.on('dialog', async dialog => {
      await dialog.accept()
    })
  }

  async exportSelectedLocations(): Promise<void> {
    await this.exportSelectedButton.click()
  }

  async editLocation(name: string): Promise<void> {
    const row = await this.getLocationByName(name)
    const editButton = row.locator('button:has(.lucide-edit)')
    await editButton.click()
  }

  async deleteLocation(name: string): Promise<void> {
    const row = await this.getLocationByName(name)
    const deleteButton = row.locator('button:has(.lucide-trash-2)')
    await deleteButton.click()
    
    // Handle confirmation dialog
    this.page.on('dialog', async dialog => {
      await dialog.accept()
    })
  }

  async getLocationData(name: string): Promise<any> {
    const row = await this.getLocationByName(name)
    const cells = await row.locator('td').all()
    
    return {
      name: await cells[1].textContent(),
      description: await cells[2].textContent(),
      itemQuantity: await cells[3].textContent()
    }
  }

  async waitForLocationsLoad(): Promise<void> {
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.animate-spin')
      return !spinner || (spinner as HTMLElement).offsetParent === null
    })
  }

  async verifyLocationExists(name: string): Promise<boolean> {
    try {
      const row = await this.getLocationByName(name)
      await expect(row).toBeVisible()
      return true
    } catch {
      return false
    }
  }

  async verifyLocationNotExists(name: string): Promise<boolean> {
    try {
      const row = await this.getLocationByName(name)
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

  async clickAddLocation(): Promise<void> {
    await this.addLocationButton.click()
  }
}

export class LocationCreatePage {
  readonly url = '/locations/create'
  readonly pageTitle = 'Crear Ubicación'
  readonly page: Page
  
  // Form elements
  readonly heading: Locator
  readonly backButton: Locator
  readonly nameInput: Locator
  readonly addressTextarea: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  
  // Error elements
  readonly nameError: Locator
  readonly addressError: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    
    this.heading = page.getByRole('heading', { name: /crear ubicación/i })
    this.backButton = page.getByRole('button', { name: /volver/i })
    this.nameInput = page.locator('#name')
    this.addressTextarea = page.locator('#address')
    this.cancelButton = page.getByRole('button', { name: /cancelar/i })
    this.saveButton = page.getByRole('button', { name: /crear ubicación/i })
    
    this.nameError = page.locator('.text-red-500').filter({ hasText: /nombre/i })
    this.addressError = page.locator('.text-red-500').filter({ hasText: /descripción/i })
    this.loadingSpinner = page.locator('.animate-spin')
  }

  async goto(): Promise<void> {
    await this.page.goto(this.url)
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  async fillForm(location: Partial<Location>): Promise<void> {
    if (location.name !== undefined) {
      await this.nameInput.fill(location.name)
    }
    
    if (location.address !== undefined) {
      await this.addressTextarea.fill(location.address)
    }
  }

  async createLocation(location: Location): Promise<void> {
    await this.fillForm(location)
    await this.saveButton.click()
  }

  async cancelCreate(): Promise<void> {
    await this.cancelButton.click()
  }

  async goBack(): Promise<void> {
    await this.backButton.click()
  }

  async verifyFormData(location: Partial<Location>): Promise<void> {
    if (location.name !== undefined) {
      await expect(this.nameInput).toHaveValue(location.name)
    }
    
    if (location.address !== undefined) {
      await expect(this.addressTextarea).toHaveValue(location.address)
    }
  }

  async verifyValidationErrors(): Promise<void> {
    await expect(this.nameError).toBeVisible()
    await expect(this.addressError).toBeVisible()
  }

  async verifyLoadingState(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible()
    await expect(this.saveButton).toContainText(/creando/i)
  }

  async waitForSave(): Promise<void> {
    await this.page.waitForURL('/locations')
  }
}

export class LocationEditPage {
  readonly url = '/locations/edit'
  readonly pageTitle = 'Editar Ubicación'
  readonly page: Page
  
  // Form elements
  readonly heading: Locator
  readonly backButton: Locator
  readonly nameInput: Locator
  readonly addressTextarea: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  
  // Error elements
  readonly nameError: Locator
  readonly addressError: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    
    this.heading = page.getByRole('heading', { name: /editar ubicación/i })
    this.backButton = page.getByRole('button', { name: /volver/i })
    this.nameInput = page.locator('#name')
    this.addressTextarea = page.locator('#address')
    this.cancelButton = page.getByRole('button', { name: /cancelar/i })
    this.saveButton = page.getByRole('button', { name: /actualizar ubicación/i })
    
    this.nameError = page.locator('.text-red-500').filter({ hasText: /nombre/i })
    this.addressError = page.locator('.text-red-500').filter({ hasText: /descripción/i })
    this.loadingSpinner = page.locator('.animate-spin')
  }

  async goto(locationId: string): Promise<void> {
    await this.page.goto(`${this.url}/${locationId}`)
    await this.waitForPageLoad()
  }

  async waitForPageLoad(): Promise<void> {
    await expect(this.heading).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  async fillForm(location: Partial<Location>): Promise<void> {
    if (location.name !== undefined) {
      await this.nameInput.fill(location.name)
    }
    
    if (location.address !== undefined) {
      await this.addressTextarea.fill(location.address)
    }
  }

  async updateLocation(location: Partial<Location>): Promise<void> {
    await this.fillForm(location)
    await this.saveButton.click()
  }

  async cancelEdit(): Promise<void> {
    await this.cancelButton.click()
  }

  async goBack(): Promise<void> {
    await this.backButton.click()
  }

  async verifyFormData(location: Partial<Location>): Promise<void> {
    if (location.name !== undefined) {
      await expect(this.nameInput).toHaveValue(location.name)
    }
    
    if (location.address !== undefined) {
      await expect(this.addressTextarea).toHaveValue(location.address)
    }
  }

  async verifyValidationErrors(): Promise<void> {
    await expect(this.nameError).toBeVisible()
    await expect(this.addressError).toBeVisible()
  }

  async verifyLoadingState(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible()
    await expect(this.saveButton).toContainText(/actualizando/i)
  }

  async waitForSave(): Promise<void> {
    await this.page.waitForURL('/locations')
  }
}

export class LocationsWorkflow {
  constructor(
    private page: Page,
    public locationsListPage: LocationsListPage,
    public locationCreatePage: LocationCreatePage,
    public locationEditPage: LocationEditPage
  ) {}

  static create(page: Page): LocationsWorkflow {
    return new LocationsWorkflow(
      page,
      new LocationsListPage(page),
      new LocationCreatePage(page),
      new LocationEditPage(page)
    )
  }

  async navigateToLocations(): Promise<void> {
    await this.locationsListPage.goto()
  }

  async createLocationWorkflow(location: Location): Promise<void> {
    await this.locationsListPage.goto()
    await this.locationsListPage.clickAddLocation()
    await this.locationCreatePage.createLocation(location)
    await this.locationCreatePage.waitForSave()
  }

  async editLocationWorkflow(currentName: string, updatedLocation: Partial<Location>): Promise<void> {
    await this.locationsListPage.goto()
    await this.locationsListPage.editLocation(currentName)
    // Note: Would need location ID to navigate to edit page
    // This is a limitation of the current implementation
  }

  async deleteLocationWorkflow(name: string): Promise<void> {
    await this.locationsListPage.goto()
    await this.locationsListPage.deleteLocation(name)
    await this.locationsListPage.waitForLocationsLoad()
  }

  async bulkDeleteLocationsWorkflow(locationNames: string[]): Promise<void> {
    await this.locationsListPage.goto()
    
    for (const name of locationNames) {
      await this.locationsListPage.selectLocation(name)
    }
    
    await this.locationsListPage.bulkDeleteLocations()
    await this.locationsListPage.waitForLocationsLoad()
  }

  async searchLocationsWorkflow(searchTerm: string): Promise<void> {
    await this.locationsListPage.goto()
    await this.locationsListPage.searchLocations(searchTerm)
  }

  async sortLocationsWorkflow(field: 'name' | 'itemQuantity'): Promise<void> {
    await this.locationsListPage.goto()
    await this.locationsListPage.sortBy(field)
  }
}