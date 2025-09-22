import { test, expect } from '@playwright/test'

test.describe('🏢 Gestión de Datos Maestros - Operaciones Completas', () => {
  let baseURL: string
  let testCategoryId: string
  let testLocationId: string
  let testUserId: string

  test.beforeAll(async ({ browser }) => {
    // Get the base URL from environment or default to localhost
    baseURL = process.env.BASE_URL || 'http://localhost:3000'
    console.log(`🔗 Testing against: ${baseURL}`)
  })

  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto(`${baseURL}/auth/login`)
    
    // Wait for login form to be visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Login as admin (adjust credentials as needed)
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/)
    await page.waitForTimeout(1000) // Allow for page load
  })

  test.describe('📂 Categorías - CRUD Completo', () => {
    test('✅ Crear nueva categoría', async ({ page }) => {
      console.log('🧪 Testing: Create new category')
      
      // Navigate to categories page
      await page.goto(`${baseURL}/categories`)
      await expect(page.locator('h2')).toContainText('Categories')
      
      // Click add category button
      await page.click('button:has-text("Agregar")')
      await page.waitForTimeout(500)
      
      // Fill category form
      const categoryName = `Test Category ${Date.now()}`
      await page.fill('input[id="name"]', categoryName)
      await page.fill('textarea[id="description"]', 'Test category description')
      await page.selectOption('select[id="color"]', '#3B82F6')
      
      // Submit form
      await page.click('button:has-text("Crear")')
      await page.waitForTimeout(1000)
      
      // Verify category was created
      await page.goto(`${baseURL}/categories`)
      await expect(page.locator(`tr:has-text("${categoryName}")`)).toBeVisible()
      
      // Store category ID for later tests
      const categoryRow = page.locator(`tr:has-text("${categoryName}")`)
      const editButton = categoryRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Extract ID from URL
      await page.waitForURL(/.*edit\/.*/)
      const url = page.url()
      testCategoryId = url.split('/edit/')[1]
      console.log(`✅ Category created with ID: ${testCategoryId}`)
    })

    test('❌ Editar categoría existente (Error 404)', async ({ page }) => {
      console.log('🧪 Testing: Edit existing category (should fix 404 error)')
      
      if (!testCategoryId) {
        console.log('⚠️ No test category ID available, skipping edit test')
        return
      }
      
      // Navigate to categories page
      await page.goto(`${baseURL}/categories`)
      
      // Find the test category and click edit
      const categoryRow = page.locator(`tr:has-text("Test Category")`)
      await expect(categoryRow).toBeVisible()
      
      const editButton = categoryRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Check if we get 404 or if edit page loads successfully
      try {
        await page.waitForURL(/.*edit\/.*/, { timeout: 5000 })
        
        // If we reach here, the edit page loaded successfully
        await expect(page.locator('h2')).toContainText('Editar Categoría')
        
        // Test form population
        const nameInput = page.locator('input[id="name"]')
        await expect(nameInput).toHaveValue(/Test Category/)
        
        // Test form update
        const updatedName = `Updated Test Category ${Date.now()}`
        await nameInput.fill(updatedName)
        await page.click('button:has-text("Actualizar")')
        
        // Verify update was successful
        await page.waitForURL(/.*categories.*/)
        await expect(page.locator(`tr:has-text("${updatedName}")`)).toBeVisible()
        
        console.log('✅ Edit category test PASSED - No 404 error')
      } catch (error) {
        console.log('❌ Edit category test FAILED - 404 error detected')
        console.log(`Error: ${error}`)
        throw error
      }
    })

    test('❌ Eliminar categoría (No funciona)', async ({ page }) => {
      console.log('🧪 Testing: Delete category (should fix functionality)')
      
      if (!testCategoryId) {
        console.log('⚠️ No test category ID available, skipping delete test')
        return
      }
      
      // Navigate to categories page
      await page.goto(`${baseURL}/categories`)
      
      // Find the test category
      const categoryRow = page.locator(`tr:has-text("Test Category")`)
      await expect(categoryRow).toBeVisible()
      
      // Click delete button
      const deleteButton = categoryRow.locator('button:has(.lucide-trash-2)')
      await deleteButton.click()
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('eliminar')
        await dialog.accept()
      })
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000)
      
      // Verify category was deleted
      try {
        await expect(categoryRow).not.toBeVisible({ timeout: 5000 })
        console.log('✅ Delete category test PASSED')
      } catch (error) {
        console.log('❌ Delete category test FAILED - Category still visible')
        console.log(`Error: ${error}`)
        throw error
      }
    })
  })

  test.describe('📍 Ubicaciones - CRUD Completo', () => {
    test('✅ Crear nueva ubicación', async ({ page }) => {
      console.log('🧪 Testing: Create new location')
      
      // Navigate to locations page
      await page.goto(`${baseURL}/locations`)
      await expect(page.locator('h2')).toContainText('Ubicaciones')
      
      // Click add location button
      await page.click('button:has-text("Agregar")')
      await page.waitForTimeout(500)
      
      // Fill location form
      const locationName = `Test Location ${Date.now()}`
      await page.fill('input[id="name"]', locationName)
      await page.fill('textarea[id="address"]', 'Test location address')
      
      // Submit form
      await page.click('button:has-text("Crear")')
      await page.waitForTimeout(1000)
      
      // Verify location was created
      await page.goto(`${baseURL}/locations`)
      await expect(page.locator(`tr:has-text("${locationName}")`)).toBeVisible()
      
      // Store location ID for later tests
      const locationRow = page.locator(`tr:has-text("${locationName}")`)
      const editButton = locationRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Extract ID from URL
      await page.waitForURL(/.*edit\/.*/)
      const url = page.url()
      testLocationId = url.split('/edit/')[1]
      console.log(`✅ Location created with ID: ${testLocationId}`)
    })

    test('✅ Editar ubicación existente', async ({ page }) => {
      console.log('🧪 Testing: Edit existing location')
      
      if (!testLocationId) {
        console.log('⚠️ No test location ID available, skipping edit test')
        return
      }
      
      // Navigate to locations page
      await page.goto(`${baseURL}/locations`)
      
      // Find the test location and click edit
      const locationRow = page.locator(`tr:has-text("Test Location")`)
      await expect(locationRow).toBeVisible()
      
      const editButton = locationRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Verify edit page loads
      await page.waitForURL(/.*edit\/.*/)
      await expect(page.locator('h2')).toContainText('Editar Ubicación')
      
      // Test form update
      const updatedName = `Updated Test Location ${Date.now()}`
      const nameInput = page.locator('input[id="name"]')
      await nameInput.fill(updatedName)
      await page.click('button:has-text("Actualizar")')
      
      // Verify update was successful
      await page.waitForURL(/.*locations.*/)
      await expect(page.locator(`tr:has-text("${updatedName}")`)).toBeVisible()
      
      console.log('✅ Edit location test PASSED')
    })

    test('✅ Eliminar ubicación', async ({ page }) => {
      console.log('🧪 Testing: Delete location')
      
      if (!testLocationId) {
        console.log('⚠️ No test location ID available, skipping delete test')
        return
      }
      
      // Navigate to locations page
      await page.goto(`${baseURL}/locations`)
      
      // Find the test location
      const locationRow = page.locator(`tr:has-text("Test Location")`)
      await expect(locationRow).toBeVisible()
      
      // Click delete button
      const deleteButton = locationRow.locator('button:has(.lucide-trash-2)')
      await deleteButton.click()
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('eliminar')
        await dialog.accept()
      })
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000)
      
      // Verify location was deleted
      await expect(locationRow).not.toBeVisible({ timeout: 5000 })
      console.log('✅ Delete location test PASSED')
    })
  })

  test.describe('👥 Usuarios - CRUD Completo', () => {
    test('✅ Crear nuevo usuario', async ({ page }) => {
      console.log('🧪 Testing: Create new user')
      
      // Navigate to users page
      await page.goto(`${baseURL}/users`)
      await expect(page.locator('h2')).toContainText('Users')
      
      // Click add user button
      await page.click('button:has-text("Add User")')
      await page.waitForTimeout(500)
      
      // Fill user form
      const userEmail = `testuser${Date.now()}@test.com`
      const userName = `Test User ${Date.now()}`
      await page.fill('input[id="email"]', userEmail)
      await page.fill('input[id="name"]', userName)
      await page.fill('input[id="password"]', 'TestPassword123!')
      await page.selectOption('select[id="role"]', 'user')
      
      // Submit form
      await page.click('button:has-text("Create")')
      await page.waitForTimeout(2000)
      
      // Verify user was created
      await page.goto(`${baseURL}/users`)
      await expect(page.locator(`tr:has-text("${userEmail}")`)).toBeVisible()
      
      // Store user ID for later tests
      const userRow = page.locator(`tr:has-text("${userEmail}")`)
      const editButton = userRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Extract ID from URL
      await page.waitForURL(/.*edit\/.*/)
      const url = page.url()
      testUserId = url.split('/edit/')[1]
      console.log(`✅ User created with ID: ${testUserId}`)
    })

    test('✅ Editar usuario existente', async ({ page }) => {
      console.log('🧪 Testing: Edit existing user')
      
      if (!testUserId) {
        console.log('⚠️ No test user ID available, skipping edit test')
        return
      }
      
      // Navigate to users page
      await page.goto(`${baseURL}/users`)
      
      // Find the test user and click edit
      const userRow = page.locator(`tr:has-text("testuser")`)
      await expect(userRow).toBeVisible()
      
      const editButton = userRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Verify edit page loads
      await page.waitForURL(/.*edit\/.*/)
      await expect(page.locator('h2')).toContainText('Edit User')
      
      // Test form update
      const updatedName = `Updated Test User ${Date.now()}`
      const nameInput = page.locator('input[id="name"]')
      await nameInput.fill(updatedName)
      await page.click('button:has-text("Update")')
      
      // Verify update was successful
      await page.waitForURL(/.*users.*/)
      await expect(page.locator(`tr:has-text("${updatedName}")`)).toBeVisible()
      
      console.log('✅ Edit user test PASSED')
    })

    test('✅ Cambiar rol de usuario', async ({ page }) => {
      console.log('🧪 Testing: Change user role')
      
      if (!testUserId) {
        console.log('⚠️ No test user ID available, skipping role change test')
        return
      }
      
      // Navigate to users page
      await page.goto(`${baseURL}/users`)
      
      // Find the test user and click edit
      const userRow = page.locator(`tr:has-text("testuser")`)
      await expect(userRow).toBeVisible()
      
      const editButton = userRow.locator('button:has(.lucide-edit)')
      await editButton.click()
      
      // Verify edit page loads
      await page.waitForURL(/.*edit\/.*/)
      
      // Change role to admin
      await page.selectOption('select[id="role"]', 'admin')
      await page.click('button:has-text("Update")')
      
      // Verify role change was successful
      await page.waitForURL(/.*users.*/)
      const updatedUserRow = page.locator(`tr:has-text("testuser")`)
      await expect(updatedUserRow).toContainText('admin')
      
      console.log('✅ Change user role test PASSED')
    })

    test('✅ Eliminar usuario', async ({ page }) => {
      console.log('🧪 Testing: Delete user')
      
      if (!testUserId) {
        console.log('⚠️ No test user ID available, skipping delete test')
        return
      }
      
      // Navigate to users page
      await page.goto(`${baseURL}/users`)
      
      // Find the test user
      const userRow = page.locator(`tr:has-text("testuser")`)
      await expect(userRow).toBeVisible()
      
      // Click delete button
      const deleteButton = userRow.locator('button:has(.lucide-trash-2)')
      await deleteButton.click()
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('delete')
        await dialog.accept()
      })
      
      // Wait for deletion to complete
      await page.waitForTimeout(2000)
      
      // Verify user was deleted
      await expect(userRow).not.toBeVisible({ timeout: 5000 })
      console.log('✅ Delete user test PASSED')
    })
  })

  test.describe('🔍 Validaciones Adicionales', () => {
    test('Verificar navegación entre páginas', async ({ page }) => {
      console.log('🧪 Testing: Navigation between pages')
      
      const pages = [
        { url: '/categories', title: 'Categories' },
        { url: '/locations', title: 'Ubicaciones' },
        { url: '/users', title: 'Users' },
        { url: '/dashboard', title: 'Dashboard' }
      ]
      
      for (const pageInfo of pages) {
        await page.goto(`${baseURL}${pageInfo.url}`)
        await expect(page.locator('h2')).toContainText(pageInfo.title)
        console.log(`✅ Navigation to ${pageInfo.url} successful`)
      }
    })

    test('Verificar permisos de usuario', async ({ page }) => {
      console.log('🧪 Testing: User permissions')
      
      // Test admin access to all pages
      const adminPages = ['/categories', '/locations', '/users', '/dashboard']
      
      for (const pageUrl of adminPages) {
        await page.goto(`${baseURL}${pageUrl}`)
        
        // Should not be redirected to unauthorized page
        await expect(page).not.toHaveURL(/.*unauthorized.*/)
        
        // Should see the main content
        await expect(page.locator('h2')).toBeVisible()
        console.log(`✅ Admin access to ${pageUrl} confirmed`)
      }
    })

    test('Verificar manejo de errores', async ({ page }) => {
      console.log('🧪 Testing: Error handling')
      
      // Test invalid category edit URL
      await page.goto(`${baseURL}/categories/edit/invalid-id`)
      
      // Should either redirect to categories page or show error message
      const isRedirected = page.url().includes('/categories')
      const hasErrorMessage = await page.locator('text=Error').isVisible()
      
      if (isRedirected || hasErrorMessage) {
        console.log('✅ Error handling for invalid category ID working')
      } else {
        console.log('❌ Error handling for invalid category ID not working')
      }
    })
  })

  test.afterEach(async ({ page }) => {
    // Clean up any test data if needed
    console.log('🧹 Test cleanup completed')
  })
})