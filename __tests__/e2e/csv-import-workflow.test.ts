import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

test.describe('CSV Import Workflow E2E', () => {
  const testCSVContent = `name,sku,category,location,quantity,min_quantity,unit_price,status
Test Item 1,E2E-001,Electronics,Warehouse A,10,5,25.99,active
Test Item 2,E2E-002,Furniture,Warehouse B,15,3,45.50,active
Test Item 3,E2E-003,Electronics,Warehouse A,8,10,12.75,active`

  const invalidCSVContent = `name,sku,category,location,quantity,min_quantity,unit_price,status
,E2E-004,Electronics,Warehouse A,10,5,25.99,active
Test Item Invalid,E2E-005,,Warehouse B,invalid,3,45.50,active`

  let testCSVPath: string
  let invalidCSVPath: string

  test.beforeAll(async () => {
    // Create test CSV files
    testCSVPath = path.join(__dirname, 'test-import.csv')
    invalidCSVPath = path.join(__dirname, 'invalid-import.csv')
    
    fs.writeFileSync(testCSVPath, testCSVContent)
    fs.writeFileSync(invalidCSVPath, invalidCSVContent)
  })

  test.afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(testCSVPath)) {
      fs.unlinkSync(testCSVPath)
    }
    if (fs.existsSync(invalidCSVPath)) {
      fs.unlinkSync(invalidCSVPath)
    }
  })

  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
    
    await page.click('text=Stock')
    await page.waitForURL('**/inventory')
    await page.waitForSelector('[data-testid="inventory-table"]', { timeout: 10000 })
  })

  test('should open CSV import modal', async ({ page }) => {
    // Click import button
    await page.click('[data-testid="import-button"]')
    
    // Verify import modal opens
    await expect(page.locator('[data-testid="csv-import-modal"]')).toBeVisible()
    await expect(page.locator('text=Import Inventory')).toBeVisible()
    
    // Verify file upload area is visible
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="csv-import-modal"]')).not.toBeVisible()
  })

  test('should upload and validate CSV file', async ({ page }) => {
    // Open import modal
    await page.click('[data-testid="import-button"]')
    await expect(page.locator('[data-testid="csv-import-modal"]')).toBeVisible()
    
    // Upload CSV file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    // Wait for file processing
    await expect(page.locator('[data-testid="file-processing"]')).toBeVisible()
    await expect(page.locator('[data-testid="file-processing"]')).not.toBeVisible({ timeout: 10000 })
    
    // Verify file validation results
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible()
    await expect(page.locator('text=File validated successfully')).toBeVisible()
    
    // Verify file stats
    await expect(page.locator('[data-testid="file-stats"]')).toContainText('3 rows')
    await expect(page.locator('[data-testid="file-stats"]')).toContainText('test-import.csv')
  })

  test('should show column mapping interface', async ({ page }) => {
    // Upload file and proceed to mapping
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    // Wait for validation and click next
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    
    // Verify column mapping interface
    await expect(page.locator('[data-testid="column-mapping"]')).toBeVisible()
    await expect(page.locator('text=Map Columns')).toBeVisible()
    
    // Verify CSV columns are detected
    await expect(page.locator('[data-testid="csv-column"]')).toHaveCount(8)
    
    // Verify auto-mapping suggestions
    await expect(page.locator('[data-testid="mapping-suggestion"]')).toHaveCount.toBeGreaterThan(0)
    
    // Test manual column mapping
    const firstMapping = page.locator('[data-testid="column-mapping-select"]').first()
    await firstMapping.click()
    await page.click('[data-testid="mapping-option-name"]')
    
    // Verify mapping is applied
    await expect(page.locator('[data-testid="mapped-column"]')).toHaveCount.toBeGreaterThan(0)
  })

  test('should generate and display import preview', async ({ page }) => {
    // Upload file and proceed through mapping
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    
    // Accept auto-mapping and proceed to preview
    await page.click('[data-testid="next-step-button"]')
    
    // Verify preview interface
    await expect(page.locator('[data-testid="import-preview"]')).toBeVisible()
    await expect(page.locator('text=Import Preview')).toBeVisible()
    
    // Verify preview table
    await expect(page.locator('[data-testid="preview-table"]')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3) // 3 test items
    
    // Verify preview statistics
    await expect(page.locator('[data-testid="preview-stats"]')).toBeVisible()
    await expect(page.locator('text=3 valid rows')).toBeVisible()
    await expect(page.locator('text=0 errors')).toBeVisible()
    
    // Verify individual row data
    await expect(page.locator('tbody tr:first-child')).toContainText('Test Item 1')
    await expect(page.locator('tbody tr:first-child')).toContainText('E2E-001')
  })

  test('should complete successful import', async ({ page }) => {
    // Get initial inventory count
    const initialRowCount = await page.locator('[data-testid="inventory-table"] tbody tr').count()
    
    // Upload and import file
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    // Navigate through import steps
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    await page.click('[data-testid="next-step-button"]')
    
    // Start import
    await page.click('[data-testid="start-import-button"]')
    
    // Verify import progress
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()
    
    // Wait for import completion
    await expect(page.locator('text=Import completed successfully')).toBeVisible({ timeout: 15000 })
    
    // Verify import results
    await expect(page.locator('[data-testid="import-results"]')).toBeVisible()
    await expect(page.locator('text=3 items imported')).toBeVisible()
    await expect(page.locator('text=0 errors')).toBeVisible()
    
    // Close import modal
    await page.click('[data-testid="close-import-button"]')
    await expect(page.locator('[data-testid="csv-import-modal"]')).not.toBeVisible()
    
    // Verify items were added to inventory
    await page.waitForTimeout(2000) // Wait for table refresh
    const finalRowCount = await page.locator('[data-testid="inventory-table"] tbody tr').count()
    expect(finalRowCount).toBe(initialRowCount + 3)
    
    // Verify imported items are visible
    await expect(page.locator('text=Test Item 1')).toBeVisible()
    await expect(page.locator('text=E2E-001')).toBeVisible()
  })

  test('should handle invalid CSV file', async ({ page }) => {
    // Upload invalid CSV file
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(invalidCSVPath)
    
    // Wait for validation
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible({ timeout: 10000 })
    
    // Verify validation errors are shown
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible()
    await expect(page.locator('text=Validation errors found')).toBeVisible()
    
    // Verify specific errors are displayed
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Category is required')).toBeVisible()
    await expect(page.locator('text=Invalid quantity')).toBeVisible()
    
    // Verify next button is disabled
    await expect(page.locator('[data-testid="next-step-button"]')).toBeDisabled()
  })

  test('should handle file type validation', async ({ page }) => {
    // Create a non-CSV file
    const textFilePath = path.join(__dirname, 'test.txt')
    fs.writeFileSync(textFilePath, 'This is not a CSV file')
    
    try {
      // Try to upload non-CSV file
      await page.click('[data-testid="import-button"]')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(textFilePath)
      
      // Verify file type error
      await expect(page.locator('[data-testid="file-error"]')).toBeVisible()
      await expect(page.locator('text=Invalid file type')).toBeVisible()
      
    } finally {
      // Clean up
      if (fs.existsSync(textFilePath)) {
        fs.unlinkSync(textFilePath)
      }
    }
  })

  test('should handle large file upload', async ({ page }) => {
    // Create a large CSV file
    const largeCSVPath = path.join(__dirname, 'large-import.csv')
    let largeContent = 'name,sku,category,location,quantity,min_quantity,unit_price,status\\n'
    
    // Generate 1000 rows
    for (let i = 1; i <= 1000; i++) {
      largeContent += `Large Item ${i},LARGE-${i.toString().padStart(3, '0')},Electronics,Warehouse A,${i},5,${(Math.random() * 100).toFixed(2)},active\\n`
    }
    
    fs.writeFileSync(largeCSVPath, largeContent)
    
    try {
      // Upload large file
      await page.click('[data-testid="import-button"]')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(largeCSVPath)
      
      // Verify file processing with progress indicator
      await expect(page.locator('[data-testid="file-processing"]')).toBeVisible()
      
      // Wait for processing to complete (may take longer)
      await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 30000 })
      
      // Verify large file stats
      await expect(page.locator('text=1000 rows')).toBeVisible()
      
    } finally {
      // Clean up
      if (fs.existsSync(largeCSVPath)) {
        fs.unlinkSync(largeCSVPath)
      }
    }
  })

  test('should allow import cancellation', async ({ page }) => {
    // Upload file and proceed to import
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    await page.click('[data-testid="next-step-button"]')
    
    // Start import
    await page.click('[data-testid="start-import-button"]')
    
    // Cancel import while in progress
    await page.click('[data-testid="cancel-import-button"]')
    
    // Verify cancellation
    await expect(page.locator('text=Import cancelled')).toBeVisible()
    await expect(page.locator('[data-testid="import-progress"]')).not.toBeVisible()
  })

  test('should show import history', async ({ page }) => {
    // Navigate to import history
    await page.click('[data-testid="import-button"]')
    await page.click('[data-testid="import-history-tab"]')
    
    // Verify history interface
    await expect(page.locator('[data-testid="import-history"]')).toBeVisible()
    await expect(page.locator('text=Import History')).toBeVisible()
    
    // Verify history entries if any exist
    const historyEntries = page.locator('[data-testid="history-entry"]')
    if (await historyEntries.count() > 0) {
      // Verify history entry details
      await expect(historyEntries.first()).toContainText('Import')
      await expect(historyEntries.first()).toContainText(/\\d+ items/)
      
      // Test viewing import details
      await historyEntries.first().click()
      await expect(page.locator('[data-testid="import-details"]')).toBeVisible()
    }
  })

  test('should handle duplicate SKU detection', async ({ page }) => {
    // First, import the test file
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    await page.click('[data-testid="next-step-button"]')
    await page.click('[data-testid="start-import-button"]')
    
    await expect(page.locator('text=Import completed successfully')).toBeVisible({ timeout: 15000 })
    await page.click('[data-testid="close-import-button"]')
    
    // Try to import the same file again
    await page.click('[data-testid="import-button"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('[data-testid="validation-results"]')).toBeVisible({ timeout: 10000 })
    
    // Verify duplicate detection
    await expect(page.locator('text=Duplicate SKUs detected')).toBeVisible()
    await expect(page.locator('[data-testid="duplicate-warning"]')).toBeVisible()
    
    // Verify options for handling duplicates
    await expect(page.locator('[data-testid="duplicate-options"]')).toBeVisible()
    await expect(page.locator('text=Skip duplicates')).toBeVisible()
    await expect(page.locator('text=Update existing')).toBeVisible()
  })

  test('should export import template', async ({ page }) => {
    // Open import modal
    await page.click('[data-testid="import-button"]')
    
    // Click download template button
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-template-button"]')
    
    // Verify template download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/inventory.*template.*\\.csv/)
    
    // Verify template content (if we can read it)
    const downloadPath = await download.path()
    if (downloadPath) {
      const templateContent = fs.readFileSync(downloadPath, 'utf8')
      expect(templateContent).toContain('name,sku,category')
    }
  })

  test('should handle network errors during import', async ({ page }) => {
    // Upload file and proceed to import
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    await page.click('[data-testid="next-step-button"]')
    
    // Intercept import request to simulate network error
    await page.route('**/api/inventory/import', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' })
      })
    })
    
    // Start import
    await page.click('[data-testid="start-import-button"]')
    
    // Verify error handling
    await expect(page.locator('text=Import failed')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible()
    
    // Verify retry option
    await expect(page.locator('[data-testid="retry-import-button"]')).toBeVisible()
  })

  test('should validate required fields mapping', async ({ page }) => {
    // Upload file
    await page.click('[data-testid="import-button"]')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testCSVPath)
    
    await expect(page.locator('text=File validated successfully')).toBeVisible({ timeout: 10000 })
    await page.click('[data-testid="next-step-button"]')
    
    // Clear required field mappings
    const nameMapping = page.locator('[data-testid="column-mapping-select"]:has-text("name")')
    await nameMapping.click()
    await page.click('[data-testid="mapping-option-none"]')
    
    // Try to proceed
    await page.click('[data-testid="next-step-button"]')
    
    // Verify validation error
    await expect(page.locator('[data-testid="mapping-error"]')).toBeVisible()
    await expect(page.locator('text=Required field not mapped')).toBeVisible()
    
    // Verify next button is disabled
    await expect(page.locator('[data-testid="next-step-button"]')).toBeDisabled()
  })
})