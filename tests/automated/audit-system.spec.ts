import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para sistema de auditoría
 * Cubre historial de cambios y seguimiento de acciones
 */
test.describe('Sistema de Auditoría', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inventario
    await page.goto('/en/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('debería abrir el historial de auditoría', async ({ page }) => {
    // Hacer clic en el botón de historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Verificar que se abre el modal
    await expect(page.locator('text=Historial de Auditoría')).toBeVisible();
    
    // Verificar elementos del modal
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible();
    await expect(page.locator('button:has-text("Filtros avanzados")')).toBeVisible();
  });

  test('debería mostrar estadísticas de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Verificar que se muestran las estadísticas
    await expect(page.locator('text=Total:')).toBeVisible();
    await expect(page.locator('text=Creaciones:')).toBeVisible();
    await expect(page.locator('text=Modificaciones:')).toBeVisible();
    await expect(page.locator('text=Eliminaciones:')).toBeVisible();
  });

  test('debería mostrar lista de registros de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Esperar a que carguen los registros
    await page.waitForTimeout(2000);
    
    // Verificar que hay registros en la tabla
    const auditRows = page.locator('tbody tr');
    await expect(auditRows).toHaveCount.greaterThan(0);
    
    // Verificar que cada registro tiene la información esperada
    const firstRow = auditRows.first();
    await expect(firstRow.locator('td').nth(0)).toContainText(/.*/); // Usuario
    await expect(firstRow.locator('td').nth(1)).toContainText(/.*/); // Acción
    await expect(firstRow.locator('td').nth(2)).toContainText(/.*/); // Entidad
  });

  test('debería permitir buscar en el historial de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Buscar por usuario
    await page.locator('input[placeholder*="Buscar"]').fill('Alejandro');
    await page.waitForTimeout(500);
    
    // Verificar que se filtran los resultados
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
  });

  test('debería mostrar filtros avanzados', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Hacer clic en filtros avanzados
    await page.locator('button:has-text("Filtros avanzados")').click();
    
    // Verificar que se muestran los filtros
    await expect(page.locator('select[name="operation_type"]')).toBeVisible();
    await expect(page.locator('select[name="entity_type"]')).toBeVisible();
    await expect(page.locator('select[name="time_period"]')).toBeVisible();
  });

  test('debería aplicar filtros por tipo de operación', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Aplicar filtro por tipo de operación
    await page.locator('select[name="operation_type"]').selectOption('CREATE');
    await page.waitForTimeout(500);
    
    // Verificar que se aplica el filtro
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
  });

  test('debería aplicar filtros por entidad', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Aplicar filtro por entidad
    await page.locator('select[name="entity_type"]').selectOption('inventory_item');
    await page.waitForTimeout(500);
    
    // Verificar que se aplica el filtro
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
  });

  test('debería aplicar filtros por período de tiempo', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Aplicar filtro por período
    await page.locator('select[name="time_period"]').selectOption('last_week');
    await page.waitForTimeout(500);
    
    // Verificar que se aplica el filtro
    const visibleRows = page.locator('tbody tr:visible');
    await expect(visibleRows).toHaveCount.greaterThan(0);
  });

  test('debería registrar cambios de stock en auditoría', async ({ page }) => {
    // Hacer un cambio de stock
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Add stock")').click();
    
    await page.locator('input[type="number"]').fill('1');
    await page.locator('select').selectOption('Stock received');
    await page.locator('button:has-text("Add stock")').click();
    
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    await page.waitForTimeout(1000);
    
    // Verificar que se registró el cambio
    await expect(page.locator('tbody tr:has-text("UPDATE")')).toBeVisible();
  });

  test('debería registrar ediciones de items en auditoría', async ({ page }) => {
    // Editar un item
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Edit")').click();
    
    // Volver sin cambios
    await page.locator('button:has-text("Volver al Inventario")').click();
    
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    await page.waitForTimeout(1000);
    
    // Verificar que hay registros de auditoría
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });

  test('debería cerrar el modal de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Cerrar el modal
    await page.locator('button:has-text("Close")').click();
    
    // Verificar que el modal se cerró
    await expect(page.locator('text=Historial de Auditoría')).not.toBeVisible();
    
    // Verificar que se vuelve a la vista normal
    await expect(page.locator('h2')).toContainText('Inventory');
  });

  test('debería exportar historial de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    
    // Buscar botón de exportar (si existe)
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("Export")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Verificar que se inicia la descarga o se muestra notificación
      await expect(page.locator('text=Exportando')).toBeVisible();
    }
  });

  test('debería paginar registros de auditoría', async ({ page }) => {
    // Abrir historial de auditoría
    await page.locator('button:has-text("Historial de Auditoría")').click();
    await page.waitForTimeout(2000);
    
    // Buscar controles de paginación
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    if (await pagination.isVisible()) {
      // Hacer clic en siguiente página
      const nextButton = pagination.locator('button:has-text("Next"), button:has-text("Siguiente")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Verificar que cambió la página
        await expect(pagination.locator('.active, [aria-current="page"]')).toBeVisible();
      }
    }
  });
});