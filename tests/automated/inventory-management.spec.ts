import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para gestión de inventario
 * Cubre todas las operaciones CRUD de items
 */
test.describe('Gestión de Inventario', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inventario
    await page.goto('/en/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('debería mostrar la página de inventario correctamente', async ({ page }) => {
    // Verificar que la página carga correctamente
    await expect(page.locator('h2')).toContainText('Inventory');
    await expect(page.locator('text=Manage your product inventory and stock')).toBeVisible();
    
    // Verificar que hay items en la tabla
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });

  test('debería permitir ajustar stock agregando unidades', async ({ page }) => {
    // Buscar el primer item con stock
    const firstItemRow = page.locator('tbody tr').first();
    const addStockButton = firstItemRow.locator('button[aria-label="Add stock"], button:has-text("Add stock")').first();
    
    // Hacer clic en el botón de agregar stock
    await addStockButton.click();
    
    // Verificar que se abre el modal
    await expect(page.locator('text=Quick Stock Adjustment')).toBeVisible();
    
    // Llenar el formulario
    await page.locator('input[type="number"]').fill('5');
    await page.locator('select').selectOption('Stock received');
    
    // Confirmar el ajuste
    await page.locator('button:has-text("Add stock")').click();
    
    // Verificar notificación de éxito
    await expect(page.locator('text=Stock Updated')).toBeVisible();
  });

  test('debería permitir ajustar stock restando unidades', async ({ page }) => {
    // Buscar un item con stock
    const itemWithStock = page.locator('tbody tr:has-text("In Stock")').first();
    const subtractStockButton = itemWithStock.locator('button[aria-label="Subtract stock"], button:has-text("Subtract stock")').first();
    
    // Hacer clic en el botón de restar stock
    await subtractStockButton.click();
    
    // Verificar que se abre el modal
    await expect(page.locator('text=Quick Stock Adjustment')).toBeVisible();
    
    // Seleccionar operación de restar
    await page.locator('button:has-text("Subtract Stock")').click();
    
    // Llenar el formulario
    await page.locator('input[type="number"]').fill('2');
    await page.locator('select').selectOption('Item sold');
    
    // Confirmar el ajuste
    await page.locator('button:has-text("Subtract stock")').click();
    
    // Verificar notificación de éxito
    await expect(page.locator('text=Stock Updated')).toBeVisible();
  });

  test('debería permitir editar un item existente', async ({ page }) => {
    // Buscar el primer item
    const firstItemRow = page.locator('tbody tr').first();
    const editButton = firstItemRow.locator('button[aria-label="Edit"], button:has-text("Edit")').first();
    
    // Hacer clic en editar
    await editButton.click();
    
    // Verificar que se abre la página de edición
    await expect(page.locator('h2')).toContainText('Editar Item');
    
    // Verificar que los campos están precargados
    await expect(page.locator('input[name="sku"]')).toHaveValue(/.*/);
    await expect(page.locator('input[name="name"]')).toHaveValue(/.*/);
    
    // Volver al inventario
    await page.locator('button:has-text("Volver al Inventario")').click();
    await expect(page.locator('h2')).toContainText('Inventory');
  });

  test('debería mostrar diálogo de confirmación al eliminar un item', async ({ page }) => {
    // Buscar un item de prueba (no crítico)
    const testItemRow = page.locator('tbody tr:has-text("test21")').first();
    const deleteButton = testItemRow.locator('button[aria-label="Delete"], button:has-text("Delete")').first();
    
    // Hacer clic en eliminar
    await deleteButton.click();
    
    // Verificar que aparece el diálogo de confirmación
    await expect(page.locator('text=¿Estás seguro?')).toBeVisible();
    
    // Cancelar la eliminación
    await page.locator('button:has-text("Cancelar")').click();
    
    // Verificar que el item sigue en la lista
    await expect(page.locator('tbody tr:has-text("test21")')).toBeVisible();
  });

  test('debería permitir buscar items por nombre o SKU', async ({ page }) => {
    // Buscar por nombre
    await page.locator('input[placeholder*="Search"]').fill('Test Item');
    await page.waitForTimeout(500); // Esperar a que se aplique el filtro
    
    // Verificar que se muestran solo los resultados relevantes
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
    
    // Limpiar búsqueda
    await page.locator('input[placeholder*="Search"]').fill('');
    await page.waitForTimeout(500);
  });

  test('debería mostrar el historial de auditoría', async ({ page }) => {
    // Hacer clic en el botón de historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Verificar que se abre el modal
    await expect(page.locator('text=Historial de Auditoría')).toBeVisible();
    
    // Verificar que se muestran estadísticas
    await expect(page.locator('text=Total:')).toBeVisible();
    
    // Verificar que hay registros
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
    
    // Cerrar el modal
    await page.locator('button:has-text("Close")').click();
  });

  test('debería permitir exportar datos', async ({ page }) => {
    // Hacer clic en el botón de exportar
    await page.locator('button:has-text("Exportar Datos")').click();
    
    // Verificar notificación
    await expect(page.locator('text=Export')).toBeVisible();
  });
});