import { test, expect } from '@playwright/test'

test.describe('Users Tutorial', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to users page
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })

  test('should display tutorial button in users page', async ({ page }) => {
    // Check if tutorial button exists
    const tutorialButton = page.locator('[data-tutorial="tutorial-btn"]')
    await expect(tutorialButton).toBeVisible()
    await expect(tutorialButton).toContainText('Tutorial')
  })

  test('should open and navigate through users tutorial', async ({ page }) => {
    // Click tutorial button
    await page.click('[data-tutorial="tutorial-btn"]')
    
    // Check if tutorial overlay is visible
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
    
    // Check first step
    await expect(page.locator('h3')).toContainText('Gestión de Usuarios')
    await expect(page.locator('text=Paso 1 de')).toBeVisible()
    
    // Navigate through steps
    let currentStep = 1
    const totalSteps = 6 // Based on userManagementTutorialSteps length
    
    while (currentStep < totalSteps) {
      await page.click('text=Siguiente')
      currentStep++
      await expect(page.locator(`text=Paso ${currentStep} de ${totalSteps}`)).toBeVisible()
    }
    
    // Final step should show "Finalizar" button
    await expect(page.locator('text=Finalizar')).toBeVisible()
    
    // Close tutorial
    await page.click('text=Finalizar')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible()
  })

  test('should close tutorial with X button', async ({ page }) => {
    // Click tutorial button
    await page.click('[data-tutorial="tutorial-btn"]')
    
    // Check if tutorial overlay is visible
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
    
    // Close with X button
    await page.click('[aria-label="Cerrar tutorial"]')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible()
  })

  test('should navigate backward in tutorial', async ({ page }) => {
    // Click tutorial button
    await page.click('[data-tutorial="tutorial-btn"]')
    
    // Navigate forward
    await page.click('text=Siguiente')
    await expect(page.locator('text=Paso 2 de')).toBeVisible()
    
    // Navigate backward
    await page.click('text=Atrás')
    await expect(page.locator('text=Paso 1 de')).toBeVisible()
  })

  test('should highlight tutorial targets correctly', async ({ page }) => {
    // Click tutorial button
    await page.click('[data-tutorial="tutorial-btn"]')
    
    // Check if first target is highlighted
    const firstTarget = page.locator('[data-tutorial="users-header"]')
    await expect(firstTarget).toBeVisible()
    
    // Check if ring highlight is present
    await expect(page.locator('.ring-2.ring-primary')).toBeVisible()
  })
})

test.describe('User Creation Tutorial', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to user creation page
    await page.goto('/users/create')
    await page.waitForLoadState('networkidle')
  })

  test('should display tutorial button in create user page', async ({ page }) => {
    // Check if tutorial help button exists
    const tutorialButton = page.locator('[aria-label="Abrir tutorial de creación de usuario"]')
    await expect(tutorialButton).toBeVisible()
  })

  test('should open and navigate through user creation tutorial', async ({ page }) => {
    // Click tutorial button
    await page.click('[aria-label="Abrir tutorial de creación de usuario"]')
    
    // Check if tutorial overlay is visible
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
    
    // Check first step
    await expect(page.locator('h3')).toContainText('Crear Nuevo Usuario')
    await expect(page.locator('text=Paso 1 de')).toBeVisible()
    
    // Navigate through steps
    let currentStep = 1
    const totalSteps = 9 // Based on userCreationTutorialSteps length
    
    while (currentStep < totalSteps) {
      await page.click('text=Siguiente')
      currentStep++
      await expect(page.locator(`text=Paso ${currentStep} de ${totalSteps}`)).toBeVisible()
    }
    
    // Final step should show "Finalizar" button
    await expect(page.locator('text=Finalizar')).toBeVisible()
    
    // Close tutorial
    await page.click('text=Finalizar')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible()
  })

  test('should highlight form elements during tutorial', async ({ page }) => {
    // Click tutorial button
    await page.click('[aria-label="Abrir tutorial de creación de usuario"]')
    
    // Navigate to form fields
    await page.click('text=Siguiente') // Skip header
    await page.click('text=Siguiente') // Go to user info section
    
    // Check if user info section is highlighted
    const userInfoSection = page.locator('[data-tutorial="user-info-section"]')
    await expect(userInfoSection).toBeVisible()
    
    // Continue to name field
    await page.click('text=Siguiente')
    const nameField = page.locator('[data-tutorial="name-field"]')
    await expect(nameField).toBeVisible()
    
    // Continue to email field
    await page.click('text=Siguiente')
    const emailField = page.locator('[data-tutorial="email-field"]')
    await expect(emailField).toBeVisible()
  })

  test('should work with keyboard navigation', async ({ page }) => {
    // Click tutorial button
    await page.click('[aria-label="Abrir tutorial de creación de usuario"]')
    
    // Use keyboard to navigate
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('text=Paso 2 de')).toBeVisible()
    
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('text=Paso 1 de')).toBeVisible()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible()
  })
})

test.describe('Tutorial Integration', () => {
  test('should navigate from users list tutorial to create user', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
    
    // Open tutorial
    await page.click('[data-tutorial="tutorial-btn"]')
    
    // Navigate to create user step
    await page.click('text=Siguiente') // Go to create user button step
    
    // Check if create user button is highlighted
    const createUserBtn = page.locator('[data-tutorial="create-user-btn"]')
    await expect(createUserBtn).toBeVisible()
    
    // Close tutorial and click create user
    await page.click('text=Finalizar')
    await page.click('[data-tutorial="create-user-btn"]')
    
    // Should navigate to create user page
    await expect(page).toHaveURL(/\/users\/create/)
  })

  test('should maintain tutorial functionality after page interactions', async ({ page }) => {
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
    
    // Interact with page elements first
    const searchInput = page.locator('input[placeholder*="Buscar"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await searchInput.clear()
    }
    
    // Tutorial should still work
    await page.click('[data-tutorial="tutorial-btn"]')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible()
    
    // Close tutorial
    await page.click('[aria-label="Cerrar tutorial"]')
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).not.toBeVisible()
  })
})