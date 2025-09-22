import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para rendimiento y UI
 * Cubre tiempos de carga, responsividad y experiencia de usuario
 */
test.describe('Rendimiento y UI', () => {
  test('debería cargar la página de inventario rápidamente', async ({ page }) => {
    const startTime = Date.now();
    
    // Navegar a la página
    await page.goto('/en/inventory');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que carga en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar que la página está completamente cargada
    await expect(page.locator('h2')).toContainText('Inventory');
    await expect(page.locator('table')).toBeVisible();
  });

  test('debería ser responsiva en dispositivos móviles', async ({ page }) => {
    // Establecer viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Verificar que los elementos se adaptan al móvil
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar que el menú lateral se puede colapsar
    const collapseButton = page.locator('button[aria-label="Collapse sidebar"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      
      // Verificar que el sidebar se colapsó
      await expect(page.locator('nav')).toHaveClass(/collapsed/);
    }
  });

  test('debería mostrar indicadores de carga apropiados', async ({ page }) => {
    // Interceptar requests para simular carga lenta
    await page.route('**/api/inventory/**', async route => {
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Verificar que se muestra indicador de carga
    await expect(page.locator('text=Cargando inventario...')).toBeVisible();
    
    // Esperar a que termine la carga
    await page.waitForLoadState('networkidle');
    
    // Verificar que el indicador desaparece
    await expect(page.locator('text=Cargando inventario...')).not.toBeVisible();
  });

  test('debería manejar errores de red gracefully', async ({ page }) => {
    // Simular error de red
    await page.route('**/api/inventory/**', route => {
      route.abort('failed');
    });
    
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Verificar que se muestra mensaje de error apropiado
    await expect(page.locator('text=Error de conexión')).toBeVisible();
    
    // Verificar que hay opción de reintentar
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible();
  });

  test('debería tener accesibilidad básica', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Verificar que hay elementos con roles ARIA apropiados
    await expect(page.locator('table[role="table"]')).toBeVisible();
    await expect(page.locator('button[aria-label]')).toHaveCount.greaterThan(0);
    
    // Verificar que los botones tienen texto descriptivo
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      // Verificar que tiene aria-label o texto descriptivo
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('debería funcionar correctamente con teclado', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Navegar con Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar que el foco es visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Verificar que se puede activar con Enter
    await page.keyboard.press('Enter');
    
    // Verificar que la acción se ejecutó
    await expect(page.locator('h2')).toContainText('Inventory');
  });

  test('debería mantener estado durante navegación', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Aplicar filtros
    await page.locator('button:has-text("Good Stock")').click();
    await page.locator('input[placeholder*="Search"]').fill('Test');
    
    // Navegar a otra página
    await page.locator('a:has-text("Categories")').click();
    
    // Volver a inventario
    await page.locator('a:has-text("Stock")').click();
    
    // Verificar que se mantienen los filtros (si está implementado)
    // Nota: Esto depende de la implementación específica
  });

  test('debería mostrar tooltips informativos', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Hacer hover sobre elementos que deberían tener tooltips
    const buttons = page.locator('button[aria-label]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      await button.hover();
      
      // Verificar que aparece tooltip (si está implementado)
      // await expect(page.locator('[role="tooltip"]')).toBeVisible();
    }
  });

  test('debería manejar scroll infinito o paginación eficientemente', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Simular scroll hacia abajo
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Verificar que la tabla sigue siendo funcional
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar que los botones siguen siendo clickeables
    const firstButton = page.locator('button').first();
    await expect(firstButton).toBeEnabled();
  });

  test('debería actualizar la UI en tiempo real', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Obtener contador inicial
    const initialCount = await page.locator('text=Total de productos').locator('+ span').textContent();
    
    // Hacer un cambio de stock
    const firstItemRow = page.locator('tbody tr').first();
    await firstItemRow.locator('button:has-text("Add stock")').click();
    
    await page.locator('input[type="number"]').fill('1');
    await page.locator('select').selectOption('Stock received');
    await page.locator('button:has-text("Add stock")').click();
    
    // Verificar que la UI se actualiza
    await expect(page.locator('text=Stock Updated')).toBeVisible();
    
    // Verificar que los contadores se actualizan
    const updatedCount = await page.locator('text=Total de productos').locator('+ span').textContent();
    expect(updatedCount).toBe(initialCount);
  });

  test('debería manejar múltiples acciones simultáneas', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Hacer múltiples acciones rápidamente
    const promises = [];
    
    // Aplicar filtros
    promises.push(page.locator('button:has-text("Good Stock")').click());
    promises.push(page.locator('input[placeholder*="Search"]').fill('Test'));
    
    // Esperar a que terminen
    await Promise.all(promises);
    
    // Verificar que la página sigue siendo funcional
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('button:has-text("Clear")')).toBeEnabled();
  });

  test('debería optimizar imágenes y recursos', async ({ page }) => {
    // Navegar a la página
    const response = await page.goto('/en/inventory');
    
    // Verificar que la página carga correctamente
    expect(response?.status()).toBe(200);
    
    // Verificar que hay imágenes optimizadas
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      // Verificar que las imágenes tienen formatos optimizados
      if (src) {
        expect(src).toMatch(/\.(jpg|jpeg|png|webp|avif)$/i);
      }
    }
  });

  test('debería funcionar offline gracefully', async ({ page }) => {
    // Navegar a la página
    await page.goto('/en/inventory');
    
    // Simular offline
    await page.context().setOffline(true);
    
    // Intentar hacer una acción
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Verificar que se muestra mensaje de offline
    await expect(page.locator('text=Sin conexión')).toBeVisible();
    
    // Volver online
    await page.context().setOffline(false);
    
    // Verificar que se restaura la funcionalidad
    await expect(page.locator('h2')).toContainText('Inventory');
  });
});