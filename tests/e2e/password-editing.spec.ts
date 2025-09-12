import { test, expect } from '@playwright/test'

test.describe('Password Editing for Privileged Users', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to users page
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
  })

  test('should show password editing option for admin users', async ({ page }) => {
    // Find a user card and click edit
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    // Click the actions button
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    
    // Click edit option
    await page.click('text=Editar')
    
    // Check if password management section is visible
    await expect(page.locator('text=Gestión de Contraseña')).toBeVisible()
    
    // Check if "Cambiar contraseña" button is visible
    await expect(page.locator('text=Cambiar contraseña')).toBeVisible()
  })

  test('should allow admin to change user password', async ({ page }) => {
    // Navigate to edit user form
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Click "Cambiar contraseña" button
    await page.click('text=Cambiar contraseña')
    
    // Check if password field appears
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('text=Nueva Contraseña')).toBeVisible()
    
    // Fill in new password
    await page.fill('input[type="password"]', 'NewPassword123!')
    
    // Check if form validation passes
    await expect(page.locator('button:has-text("Actualizar Usuario")')).not.toBeDisabled()
  })

  test('should validate password requirements', async ({ page }) => {
    // Navigate to edit user form
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Click "Cambiar contraseña" button
    await page.click('text=Cambiar contraseña')
    
    // Try with short password
    await page.fill('input[type="password"]', '12345')
    
    // Check if validation error appears
    await expect(page.locator('text=La contraseña debe tener al menos 6 caracteres')).toBeVisible()
    
    // Check if submit button is disabled
    await expect(page.locator('button:has-text("Actualizar Usuario")')).toBeDisabled()
  })

  test('should allow canceling password change', async ({ page }) => {
    // Navigate to edit user form
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Click "Cambiar contraseña" button
    await page.click('text=Cambiar contraseña')
    
    // Verify password field is visible
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Click "Cancelar cambio" button
    await page.click('text=Cancelar cambio')
    
    // Verify password field is hidden
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    
    // Verify button text changed back
    await expect(page.locator('text=Cambiar contraseña')).toBeVisible()
  })

  test('should update user without password change', async ({ page }) => {
    // Navigate to edit user form
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Update user name without changing password
    const firstNameInput = page.locator('input').first()
    await firstNameInput.clear()
    await firstNameInput.fill('Updated')
    
    // Submit form
    await page.click('button:has-text("Actualizar Usuario")')
    
    // Check for success message (this would depend on your toast implementation)
    // await expect(page.locator('text=Usuario actualizado')).toBeVisible()
    
    // Check if modal closes
    await expect(page.locator('text=Editar Usuario')).not.toBeVisible()
  })

  test('should show proper permissions for password editing', async ({ page }) => {
    // This test would need to be run with different user roles
    // For now, we'll just check that the feature exists for admin users
    
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Check if password management section exists
    const passwordSection = page.locator('text=Gestión de Contraseña')
    const changePasswordButton = page.locator('text=Cambiar contraseña')
    
    // For admin users, these should be visible
    await expect(passwordSection).toBeVisible()
    await expect(changePasswordButton).toBeVisible()
  })

  test('should handle password update API call', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'User profile and password updated successfully'
          })
        })
      } else {
        await route.continue()
      }
    })
    
    // Navigate to edit user form
    const userCard = page.locator('[data-tutorial="user-card"]').first()
    await userCard.hover()
    
    const actionsButton = userCard.locator('[data-tutorial="user-actions"] button').first()
    await actionsButton.click()
    await page.click('text=Editar')
    
    // Change password
    await page.click('text=Cambiar contraseña')
    await page.fill('input[type="password"]', 'NewSecurePassword123!')
    
    // Submit form
    await page.click('button:has-text("Actualizar Usuario")')
    
    // Wait for API call to complete
    await page.waitForTimeout(1000)
    
    // The form should close successfully
    await expect(page.locator('text=Editar Usuario')).not.toBeVisible()
  })
})

test.describe('Password Editing Security', () => {
  test('should prevent unauthorized password changes', async ({ page }) => {
    // This test would simulate a non-admin user trying to edit passwords
    // In a real scenario, you'd need to mock different user roles
    
    // For now, we'll test that the API properly validates permissions
    const response = await page.request.put('/api/users', {
      data: {
        id: 'test-user-id',
        password: 'newpassword123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Should fail without proper authentication/permissions
    expect(response.status()).toBe(401) // or 403 depending on implementation
  })

  test('should validate password strength on server', async ({ page }) => {
    // Test weak password rejection
    const response = await page.request.put('/api/users', {
      data: {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '123' // Too weak
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const responseData = await response.json()
    expect(responseData.success).toBe(false)
    expect(responseData.error).toContain('at least 6 characters')
  })
})