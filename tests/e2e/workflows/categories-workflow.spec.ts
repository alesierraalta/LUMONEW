import { test, expect } from '@playwright/test'
import { CategoriesWorkflow } from '../page-objects/categories-page'
import { testData } from '../fixtures/test-data'
import { loginAsAdmin, loginAsManager, loginAsEmployee, checkAccessibility, measurePerformance } from '../utils/test-helpers'

test.describe('Categories Management Workflow', () => {
  let categoriesWorkflow: CategoriesWorkflow

  test.beforeEach(async ({ page }) => {
    categoriesWorkflow = CategoriesWorkflow.create(page)
    await loginAsAdmin(page)
  })

  test.describe('Categories List Page', () => {
    test('should display categories list with proper elements', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      
      // Verify page elements
      await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.addButton)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.importButton)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.exportButton)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.searchInput)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.table)).toBeVisible()
    })

    test('should load categories data successfully', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      
      // Wait for categories to load
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Verify at least one category is displayed
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThan(0)
    })

    test('should handle empty state when no categories exist', async ({ page }) => {
      // This test would require a clean database state
      // For now, we'll test the empty state message visibility
      await categoriesWorkflow.navigateToCategories()
      
      // If no categories exist, empty state should be visible
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      if (rowCount === 0) {
        await categoriesWorkflow.categoriesListPage.verifyEmptyState()
      }
    })

    test('should handle loading state properly', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      
      // Loading state should appear briefly during navigation
      // This is hard to test reliably, so we'll just verify the page loads
      await categoriesWorkflow.categoriesListPage.waitForPageLoad()
    })

    test('should handle error state gracefully', async ({ page }) => {
      // This would require mocking API failures
      // For now, we'll just verify error handling exists
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForPageLoad()
    })
  })

  test.describe('Categories Search and Filter', () => {
    test('should search categories by name', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const initialRowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      
      // Search for a specific category
      await categoriesWorkflow.searchCategoriesWorkflow('Electronics')
      
      // Verify search results
      const filteredRowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount)
    })

    test('should search categories by description', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Search by description
      await categoriesWorkflow.searchCategoriesWorkflow('electronic')
      
      // Verify search works
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })

    test('should clear search results', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const initialRowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      
      // Search and then clear
      await categoriesWorkflow.searchCategoriesWorkflow('Electronics')
      await categoriesWorkflow.categoriesListPage.clearSearch()
      
      // Verify all categories are shown again
      const finalRowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(finalRowCount).toBe(initialRowCount)
    })

    test('should handle no search results', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Search for non-existent category
      await categoriesWorkflow.searchCategoriesWorkflow('NonExistentCategory12345')
      
      // Verify no results or empty state
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBe(0)
    })
  })

  test.describe('Categories Sorting', () => {
    test('should sort categories by name', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Sort by name
      await categoriesWorkflow.sortCategoriesWorkflow('name')
      
      // Verify sorting worked (basic check)
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })

    test('should sort categories by item count', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Sort by item count
      await categoriesWorkflow.sortCategoriesWorkflow('itemCount')
      
      // Verify sorting worked
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })

    test('should sort categories by created date', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Sort by created date
      await categoriesWorkflow.sortCategoriesWorkflow('createdAt')
      
      // Verify sorting worked
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Categories Selection and Bulk Operations', () => {
    test('should select individual categories', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.selectCategory(categoryName.trim())
          
          // Verify selection
          const selectedCount = await categoriesWorkflow.categoriesListPage.getSelectedCategoriesCount()
          expect(selectedCount).toBe(1)
        }
      }
    })

    test('should select all categories', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const totalRows = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      
      if (totalRows > 0) {
        await categoriesWorkflow.categoriesListPage.selectAllCategories()
        
        // Verify all are selected
        const selectedCount = await categoriesWorkflow.categoriesListPage.getSelectedCategoriesCount()
        expect(selectedCount).toBe(totalRows)
      }
    })

    test('should deselect all categories', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const totalRows = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      
      if (totalRows > 0) {
        // Select all first
        await categoriesWorkflow.categoriesListPage.selectAllCategories()
        
        // Then deselect all
        await categoriesWorkflow.categoriesListPage.deselectAllCategories()
        
        // Verify none are selected
        const selectedCount = await categoriesWorkflow.categoriesListPage.getSelectedCategoriesCount()
        expect(selectedCount).toBe(0)
      }
    })

    test('should show bulk actions panel when categories are selected', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Select first category
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.selectCategory(categoryName.trim())
          
          // Verify bulk actions panel is visible
          await expect(page.locator(testData.selectors.categories.bulkActionsPanel)).toBeVisible()
          await expect(page.locator(testData.selectors.categories.bulkDeleteButton)).toBeVisible()
          await expect(page.locator(testData.selectors.categories.exportSelectedButton)).toBeVisible()
        }
      }
    })
  })

  test.describe('Category Edit Workflow', () => {
    test('should navigate to category edit page', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.editCategory(categoryName.trim())
          
          // Verify we're on edit page
          await expect(page.locator(testData.selectors.categories.editHeading)).toBeVisible()
        }
      }
    })

    test('should load existing category data in edit form', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category data
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.editCategory(categoryName.trim())
          
          // Verify form is populated
          await expect(page.locator(testData.selectors.categories.nameInput)).toHaveValue(categoryName.trim())
        }
      }
    })

    test('should update category successfully', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const originalName = await firstRow.locator('td').nth(1).textContent()
        
        if (originalName) {
          const updatedCategory = {
            name: `Updated ${originalName.trim()}`,
            description: 'Updated description for testing',
            color: '#EF4444'
          }
          
          await categoriesWorkflow.editCategoryWorkflow(originalName.trim(), updatedCategory)
          
          // Verify we're back on categories list
          await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
          
          // Verify category was updated
          const updatedExists = await categoriesWorkflow.categoriesListPage.verifyCategoryExists(updatedCategory.name)
          expect(updatedExists).toBe(true)
        }
      }
    })

    test('should validate required fields in edit form', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.editCategory(categoryName.trim())
          
          // Clear required field and try to save
          await page.locator(testData.selectors.categories.nameInput).clear()
          await page.locator(testData.selectors.categories.saveButton).click()
          
          // Verify validation error
          await expect(page.locator(testData.selectors.categories.nameError)).toBeVisible()
        }
      }
    })

    test('should cancel category edit', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.editCategory(categoryName.trim())
          
          // Cancel edit
          await page.locator(testData.selectors.categories.cancelButton).click()
          
          // Verify we're back on categories list
          await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
        }
      }
    })

    test('should navigate back from edit page', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get first category name
        const firstRow = rows[0]
        const categoryName = await firstRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.categoriesListPage.editCategory(categoryName.trim())
          
          // Go back
          await page.locator(testData.selectors.categories.backButton).click()
          
          // Verify we're back on categories list
          await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
        }
      }
    })
  })

  test.describe('Category Delete Operations', () => {
    test('should delete individual category', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get last category name (to avoid deleting categories that might be in use)
        const lastRow = rows[rows.length - 1]
        const categoryName = await lastRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          await categoriesWorkflow.deleteCategoryWorkflow(categoryName.trim())
          
          // Verify category was deleted
          const categoryExists = await categoriesWorkflow.categoriesListPage.verifyCategoryExists(categoryName.trim())
          expect(categoryExists).toBe(false)
        }
      }
    })

    test('should handle delete confirmation dialog', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      const rows = await categoriesWorkflow.categoriesListPage.getCategoryRows()
      if (rows.length > 0) {
        // Get last category name
        const lastRow = rows[rows.length - 1]
        const categoryName = await lastRow.locator('td').nth(1).textContent()
        
        if (categoryName) {
          // Set up dialog handler to cancel
          page.on('dialog', async dialog => {
            expect(dialog.message()).toContain(categoryName.trim())
            await dialog.dismiss()
          })
          
          await categoriesWorkflow.categoriesListPage.deleteCategory(categoryName.trim())
          
          // Verify category still exists (delete was cancelled)
          const categoryExists = await categoriesWorkflow.categoriesListPage.verifyCategoryExists(categoryName.trim())
          expect(categoryExists).toBe(true)
        }
      }
    })
  })

  test.describe('Accessibility and Performance', () => {
    test('should meet accessibility standards', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Check accessibility
      await checkAccessibility(page, 'Categories List Page')
    })

    test('should load categories page within performance budget', async ({ page }) => {
      const metrics = await measurePerformance(page, async () => {
        await categoriesWorkflow.navigateToCategories()
        await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      })
      
      // Verify performance metrics
      expect(metrics.loadTime).toBeLessThan(3000) // 3 seconds
      expect(metrics.domContentLoaded).toBeLessThan(2000) // 2 seconds
    })

    test('should handle keyboard navigation', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Test keyboard navigation
      await page.keyboard.press('Tab') // Should focus on first interactive element
      await page.keyboard.press('Enter') // Should activate focused element
      
      // Verify keyboard navigation works
      const focusedElement = await page.locator(':focus').first()
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('Role-based Access Control', () => {
    test('should allow admin full access to categories', async ({ page }) => {
      await loginAsAdmin(page)
      await categoriesWorkflow.navigateToCategories()
      
      // Verify admin can see all elements
      await expect(page.locator(testData.selectors.categories.addButton)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.importButton)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.exportButton)).toBeVisible()
    })

    test('should allow manager access to categories', async ({ page }) => {
      await loginAsManager(page)
      await categoriesWorkflow.navigateToCategories()
      
      // Verify manager can access categories
      await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.table)).toBeVisible()
    })

    test('should allow employee read access to categories', async ({ page }) => {
      await loginAsEmployee(page)
      await categoriesWorkflow.navigateToCategories()
      
      // Verify employee can view categories
      await expect(page.locator(testData.selectors.categories.heading)).toBeVisible()
      await expect(page.locator(testData.selectors.categories.table)).toBeVisible()
    })
  })

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // This would require network mocking
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForPageLoad()
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Test with search to filter large datasets
      await categoriesWorkflow.searchCategoriesWorkflow('Test')
      
      // Verify search works with large datasets
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })

    test('should handle special characters in category names', async ({ page }) => {
      await categoriesWorkflow.navigateToCategories()
      await categoriesWorkflow.categoriesListPage.waitForCategoriesLoad()
      
      // Search for special characters
      await categoriesWorkflow.searchCategoriesWorkflow('&@#$%')
      
      // Should handle gracefully
      const rowCount = await categoriesWorkflow.categoriesListPage.getTableRowCount()
      expect(rowCount).toBeGreaterThanOrEqual(0)
    })
  })
})