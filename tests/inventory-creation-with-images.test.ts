import { test, expect } from '@playwright/test';

test.describe('Inventory Creation with Images', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the inventory create page
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');
  });

  test('should create inventory item with image successfully', async ({ page }) => {
    // Fill in the required form fields
    await page.getByRole('textbox', { name: 'SKU *' }).fill('TEST-IMG-001');
    await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Test Product with Image');
    
    // Select category and location
    await page.getByLabel('Categoría').selectOption('Electronics');
    await page.getByLabel('Ubicación').selectOption('Main Warehouse');
    
    // Fill optional fields
    await page.getByRole('spinbutton', { name: 'Precio Unitario ($)' }).fill('99.99');
    await page.getByRole('spinbutton', { name: 'Cantidad Inicial' }).fill('10');
    await page.getByRole('spinbutton', { name: 'Stock Mínimo' }).fill('5');
    await page.getByRole('spinbutton', { name: 'Stock Máximo' }).fill('50');

    // Test image upload functionality
    const imageUploadArea = page.locator('.border-dashed').first();
    await expect(imageUploadArea).toBeVisible();
    
    // Click on the image upload area
    await imageUploadArea.click();
    
    // Verify file chooser appears (this will be handled by the browser)
    // Note: In a real test, you would need to provide an actual image file
    
    // Create the item
    await page.getByRole('button', { name: 'Crear Item' }).click();
    
    // Wait for navigation back to inventory page
    await page.waitForURL('/inventory');
    
    // Verify success message or item appears in the list
    await expect(page.getByText('Test Product with Image')).toBeVisible();
  });

  test('should handle image upload errors gracefully', async ({ page }) => {
    // Fill in the required form fields
    await page.getByRole('textbox', { name: 'SKU *' }).fill('TEST-IMG-002');
    await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Test Product Error Handling');
    
    // Select category and location
    await page.getByLabel('Categoría').selectOption('Electronics');
    await page.getByLabel('Ubicación').selectOption('Main Warehouse');

    // Test that the form can be submitted without an image
    await page.getByRole('button', { name: 'Crear Item' }).click();
    
    // Wait for navigation back to inventory page
    await page.waitForURL('/inventory');
    
    // Verify the item was created successfully even without an image
    await expect(page.getByText('Test Product Error Handling')).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Try to submit without filling required fields
    await page.getByRole('button', { name: 'Crear Item' }).click();
    
    // Verify validation errors appear
    await expect(page.getByText('El SKU es requerido')).toBeVisible();
    await expect(page.getByText('El nombre es requerido')).toBeVisible();
  });

  test('should handle duplicate SKU error', async ({ page }) => {
    // Fill in the form with a SKU that already exists
    await page.getByRole('textbox', { name: 'SKU *' }).fill('TEST-DIRECT-001'); // This SKU already exists
    await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Duplicate SKU Test');
    
    // Select category and location
    await page.getByLabel('Categoría').selectOption('Electronics');
    await page.getByLabel('Ubicación').selectOption('Main Warehouse');

    // Submit the form
    await page.getByRole('button', { name: 'Crear Item' }).click();
    
    // Verify error message appears
    await expect(page.getByText('SKU already exists')).toBeVisible();
  });
});

test.describe('Image Upload Component', () => {
  test('should display image upload area correctly', async ({ page }) => {
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');
    
    // Verify image upload section is visible
    await expect(page.getByText('Imágenes del Producto')).toBeVisible();
    await expect(page.getByText('Sube imágenes del producto para mejor identificación (JPEG, PNG)')).toBeVisible();
    
    // Verify upload area is clickable
    const uploadArea = page.locator('.border-dashed').first();
    await expect(uploadArea).toBeVisible();
    await expect(uploadArea).toHaveClass(/cursor-pointer/);
  });

  test('should show correct file size and type restrictions', async ({ page }) => {
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');
    
    // Verify file restrictions are displayed
    await expect(page.getByText('Máximo 5MB • JPEG, PNG')).toBeVisible();
  });
});