import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para filtros y búsqueda
 * Cubre todas las funcionalidades de filtrado
 */
test.describe('Filtros y Búsqueda', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inventario
    await page.goto('/en/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('debería aplicar filtro de items activos', async ({ page }) => {
    // Hacer clic en el filtro "Active Items"
    await page.locator('button:has-text("Active Items")').click();
    
    // Verificar que se aplica el filtro
    await expect(page.locator('button:has-text("Active Items")[active]')).toBeVisible();
    
    // Verificar que se muestran badges de filtros activos
    await expect(page.locator('text=1')).toBeVisible();
  });

  test('debería aplicar filtro de items inactivos', async ({ page }) => {
    // Hacer clic en el filtro "Inactive Items"
    await page.locator('button:has-text("Inactive Items")').click();
    
    // Verificar que se aplica el filtro
    await expect(page.locator('button:has-text("Inactive Items")[active]')).toBeVisible();
  });

  test('debería aplicar filtro de stock óptimo', async ({ page }) => {
    // Hacer clic en el filtro "Good Stock"
    await page.locator('button:has-text("Good Stock")').click();
    
    // Verificar que se aplica el filtro
    await expect(page.locator('button:has-text("Good Stock")[active]')).toBeVisible();
  });

  test('debería aplicar filtro de stock bajo', async ({ page }) => {
    // Hacer clic en el filtro "Low Stock"
    await page.locator('button:has-text("Low Stock")').click();
    
    // Verificar que se aplica el filtro
    await expect(page.locator('button:has-text("Low Stock")[active]')).toBeVisible();
  });

  test('debería aplicar filtro de sin stock', async ({ page }) => {
    // Hacer clic en el filtro "Out of Stock"
    await page.locator('button:has-text("Out of Stock")').click();
    
    // Verificar que se aplica el filtro
    await expect(page.locator('button:has-text("Out of Stock")[active]')).toBeVisible();
  });

  test('debería permitir múltiples filtros simultáneos', async ({ page }) => {
    // Aplicar primer filtro
    await page.locator('button:has-text("Good Stock")').click();
    
    // Aplicar segundo filtro
    await page.locator('button:has-text("Out of Stock")').click();
    
    // Verificar que ambos filtros están activos
    await expect(page.locator('button:has-text("Good Stock")[active]')).toBeVisible();
    await expect(page.locator('button:has-text("Out of Stock")[active]')).toBeVisible();
    
    // Verificar que se muestra el contador de filtros activos
    await expect(page.locator('text=2')).toBeVisible();
  });

  test('debería limpiar todos los filtros', async ({ page }) => {
    // Aplicar varios filtros
    await page.locator('button:has-text("Good Stock")').click();
    await page.locator('button:has-text("Out of Stock")').click();
    
    // Verificar que hay filtros activos
    await expect(page.locator('text=2')).toBeVisible();
    
    // Hacer clic en el botón Clear
    await page.locator('button:has-text("Clear")').click();
    
    // Verificar que se limpiaron los filtros
    await expect(page.locator('button:has-text("Good Stock")[active]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Out of Stock")[active]')).not.toBeVisible();
    
    // Verificar que no hay contador de filtros
    await expect(page.locator('text=2')).not.toBeVisible();
  });

  test('debería buscar items por nombre', async ({ page }) => {
    // Buscar por nombre
    await page.locator('input[placeholder*="Search"]').fill('Test Item');
    await page.waitForTimeout(500);
    
    // Verificar que se muestran resultados
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
    
    // Verificar que los resultados contienen el término buscado
    await expect(page.locator('tbody tr:visible:has-text("Test Item")')).toBeVisible();
  });

  test('debería buscar items por SKU', async ({ page }) => {
    // Buscar por SKU
    await page.locator('input[placeholder*="Search"]').fill('TEST-DIRECT-001');
    await page.waitForTimeout(500);
    
    // Verificar que se muestran resultados
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
    
    // Verificar que los resultados contienen el SKU buscado
    await expect(page.locator('tbody tr:visible:has-text("TEST-DIRECT-001")')).toBeVisible();
  });

  test('debería mostrar mensaje cuando no hay resultados', async ({ page }) => {
    // Buscar algo que no existe
    await page.locator('input[placeholder*="Search"]').fill('ItemQueNoExiste123');
    await page.waitForTimeout(500);
    
    // Verificar mensaje de no resultados
    await expect(page.locator('text=No items found')).toBeVisible();
  });

  test('debería combinar búsqueda con filtros', async ({ page }) => {
    // Aplicar filtro
    await page.locator('button:has-text("Good Stock")').click();
    
    // Aplicar búsqueda
    await page.locator('input[placeholder*="Search"]').fill('Test');
    await page.waitForTimeout(500);
    
    // Verificar que se aplican ambos
    await expect(page.locator('button:has-text("Good Stock")[active]')).toBeVisible();
    
    // Verificar que se muestran resultados filtrados
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
  });

  test('debería ordenar por diferentes columnas', async ({ page }) => {
    // Ordenar por SKU
    await page.locator('button:has-text("SKU")').click();
    await page.waitForTimeout(500);
    
    // Ordenar por Nombre
    await page.locator('button:has-text("Name")').click();
    await page.waitForTimeout(500);
    
    // Ordenar por Precio
    await page.locator('button:has-text("Price")').click();
    await page.waitForTimeout(500);
    
    // Ordenar por Stock
    await page.locator('button:has-text("Stock")').click();
    await page.waitForTimeout(500);
    
    // Verificar que la tabla sigue visible
    await expect(page.locator('table')).toBeVisible();
  });
});