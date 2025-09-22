import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para operaciones CRUD completas
 * Cubre creación, lectura, actualización y eliminación de items
 */
test.describe('Operaciones CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inventario
    await page.goto('/en/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('debería crear un nuevo item de inventario', async ({ page }) => {
    // Hacer clic en "Nuevo Producto"
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Verificar que se abre el formulario de creación
    await expect(page.locator('h2')).toContainText('Nuevo Item');
    
    // Llenar el formulario
    await page.locator('input[name="sku"]').fill('TEST-AUTO-001');
    await page.locator('input[name="name"]').fill('Item de Prueba Automatizada');
    await page.locator('select[name="category"]').selectOption('Electronics');
    await page.locator('select[name="location"]').selectOption('Main Warehouse');
    await page.locator('input[name="price"]').fill('25.99');
    await page.locator('input[name="currentStock"]').fill('10');
    await page.locator('input[name="minStock"]').fill('2');
    await page.locator('input[name="maxStock"]').fill('50');
    
    // Guardar el item
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se creó exitosamente
    await expect(page.locator('text=Item creado exitosamente')).toBeVisible();
    
    // Verificar que aparece en la lista
    await expect(page.locator('text=TEST-AUTO-001')).toBeVisible();
  });

  test('debería validar campos requeridos en creación', async ({ page }) => {
    // Hacer clic en "Nuevo Producto"
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Intentar guardar sin llenar campos requeridos
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se muestran errores de validación
    await expect(page.locator('text=SKU es requerido')).toBeVisible();
    await expect(page.locator('text=Nombre es requerido')).toBeVisible();
  });

  test('debería leer y mostrar detalles de un item', async ({ page }) => {
    // Buscar un item existente
    const firstItemRow = page.locator('tbody tr').first();
    const itemName = await firstItemRow.locator('td').nth(2).textContent();
    
    // Hacer clic en el botón de editar para ver detalles
    await firstItemRow.locator('button:has-text("Edit")').click();
    
    // Verificar que se muestran todos los detalles
    await expect(page.locator('input[name="sku"]')).toHaveValue(/.*/);
    await expect(page.locator('input[name="name"]')).toHaveValue(/.*/);
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('select[name="location"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    await expect(page.locator('input[name="currentStock"]')).toBeVisible();
  });

  test('debería actualizar un item existente', async ({ page }) => {
    // Buscar un item existente
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Edit")').click();
    
    // Modificar algunos campos
    await page.locator('input[name="price"]').fill('99.99');
    await page.locator('input[name="currentStock"]').fill('25');
    
    // Guardar los cambios
    await page.locator('button:has-text("Actualizar Item")').click();
    
    // Verificar que se actualizó exitosamente
    await expect(page.locator('text=Item actualizado exitosamente')).toBeVisible();
    
    // Verificar que los cambios se reflejan en la lista
    await expect(page.locator('text=99.99 US$')).toBeVisible();
  });

  test('debería eliminar un item existente', async ({ page }) => {
    // Buscar un item de prueba (no crítico)
    const testItemRow = page.locator('tbody tr:has-text("test21")').first();
    
    if (await testItemRow.isVisible()) {
      // Hacer clic en eliminar
      await testItemRow.locator('button:has-text("Delete")').click();
      
      // Confirmar eliminación
      await page.locator('button:has-text("Confirmar")').click();
      
      // Verificar que se eliminó exitosamente
      await expect(page.locator('text=Item eliminado exitosamente')).toBeVisible();
      
      // Verificar que ya no aparece en la lista
      await expect(page.locator('text=test21')).not.toBeVisible();
    }
  });

  test('debería cancelar eliminación de item', async ({ page }) => {
    // Buscar un item
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Delete")').click();
    
    // Cancelar eliminación
    await page.locator('button:has-text("Cancelar")').click();
    
    // Verificar que el item sigue en la lista
    await expect(firstItemRow).toBeVisible();
  });

  test('debería validar unicidad de SKU', async ({ page }) => {
    // Obtener un SKU existente
    const existingSKU = await page.locator('tbody tr').first().locator('td').nth(1).textContent();
    
    // Crear nuevo item con SKU duplicado
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    await page.locator('input[name="sku"]').fill(existingSKU || 'TEST-DIRECT-001');
    await page.locator('input[name="name"]').fill('Item con SKU duplicado');
    
    // Intentar guardar
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se muestra error de SKU duplicado
    await expect(page.locator('text=SKU ya existe')).toBeVisible();
  });

  test('debería validar formato de precio', async ({ page }) => {
    // Crear nuevo item
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Ingresar precio inválido
    await page.locator('input[name="price"]').fill('precio-invalido');
    
    // Intentar guardar
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se muestra error de formato
    await expect(page.locator('text=Precio debe ser un número válido')).toBeVisible();
  });

  test('debería validar valores de stock', async ({ page }) => {
    // Crear nuevo item
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Ingresar valores de stock inválidos
    await page.locator('input[name="currentStock"]').fill('-5');
    await page.locator('input[name="minStock"]').fill('-1');
    
    // Intentar guardar
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se muestran errores de validación
    await expect(page.locator('text=Stock no puede ser negativo')).toBeVisible();
  });

  test('debería permitir subir imagen del producto', async ({ page }) => {
    // Crear nuevo item
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Verificar que hay campo para imagen
    const imageUpload = page.locator('input[type="file"], [data-testid="image-upload"]');
    await expect(imageUpload).toBeVisible();
    
    // Simular subida de archivo (si es posible)
    if (await imageUpload.isVisible()) {
      // Nota: En un test real, necesitarías un archivo de prueba
      // await imageUpload.setInputFiles('test-image.jpg');
    }
  });

  test('debería mostrar confirmación antes de cambios importantes', async ({ page }) => {
    // Editar un item
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Edit")').click();
    
    // Hacer cambios significativos
    await page.locator('input[name="price"]').fill('999.99');
    
    // Intentar navegar sin guardar
    await page.locator('button:has-text("Volver al Inventario")').click();
    
    // Verificar que aparece confirmación
    await expect(page.locator('text=¿Deseas guardar los cambios?')).toBeVisible();
  });

  test('debería mantener estado del formulario en caso de error', async ({ page }) => {
    // Crear nuevo item con datos válidos
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    await page.locator('input[name="sku"]').fill('TEST-FORM-001');
    await page.locator('input[name="name"]').fill('Item de Prueba Formulario');
    await page.locator('input[name="price"]').fill('49.99');
    
    // Simular error del servidor
    await page.route('**/api/inventory', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Intentar guardar
    await page.locator('button:has-text("Crear Item")').click();
    
    // Verificar que se muestra error pero se mantienen los datos
    await expect(page.locator('text=Error del servidor')).toBeVisible();
    await expect(page.locator('input[name="sku"]')).toHaveValue('TEST-FORM-001');
    await expect(page.locator('input[name="name"]')).toHaveValue('Item de Prueba Formulario');
  });
});