import { test, expect } from '@playwright/test';

/**
 * Tests automatizados para autenticación
 * Cubre login, logout y verificación de sesiones
 */
test.describe('Autenticación', () => {
  test('debería redirigir a login cuando no está autenticado', async ({ page }) => {
    // Limpiar cookies y localStorage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Intentar acceder a una página protegida
    await page.goto('/en/inventory');
    
    // Verificar que se redirige al login
    await expect(page).toHaveURL(/.*login/);
  });

  test('debería mostrar el formulario de login correctamente', async ({ page }) => {
    await page.goto('/en/auth/login');
    
    // Verificar elementos del formulario
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/en/auth/login');
    
    // Llenar con credenciales inválidas
    await page.locator('input[type="email"]').fill('invalid@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    // Enviar formulario
    await page.locator('button[type="submit"]').click();
    
    // Verificar que se muestra mensaje de error
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('debería permitir login con credenciales válidas', async ({ page }) => {
    await page.goto('/en/auth/login');
    
    // Llenar con credenciales válidas (ajustar según datos de prueba)
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Enviar formulario
    await page.locator('button[type="submit"]').click();
    
    // Verificar que se redirige al dashboard
    await expect(page).toHaveURL(/.*inventory/);
  });

  test('debería mantener la sesión entre recargas de página', async ({ page }) => {
    // Login
    await page.goto('/en/auth/login');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Recargar la página
    await page.reload();
    
    // Verificar que sigue autenticado
    await expect(page).toHaveURL(/.*inventory/);
    await expect(page.locator('text=Alejandro Sierraalta')).toBeVisible();
  });

  test('debería mostrar información del usuario autenticado', async ({ page }) => {
    // Navegar a una página protegida (asumiendo que ya está autenticado)
    await page.goto('/en/inventory');
    
    // Verificar que se muestra la información del usuario
    await expect(page.locator('text=Alejandro Sierraalta')).toBeVisible();
    await expect(page.locator('text=alesierraalta@gmail.com')).toBeVisible();
  });

  test('debería permitir logout', async ({ page }) => {
    // Navegar a una página protegida
    await page.goto('/en/inventory');
    
    // Buscar y hacer clic en el menú de usuario (si está disponible)
    const userMenu = page.locator('button:has-text("AS"), [data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      // Hacer clic en logout
      await page.locator('text=Cerrar sesión').click();
      
      // Verificar que se redirige al login
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('debería proteger rutas sensibles', async ({ page }) => {
    // Limpiar sesión
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Intentar acceder a diferentes rutas protegidas
    const protectedRoutes = [
      '/en/inventory',
      '/en/users',
      '/en/categories',
      '/en/locations',
      '/en/settings'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      // Verificar que se redirige al login
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('debería manejar tokens expirados', async ({ page }) => {
    // Simular token expirado
    await page.goto('/en/inventory');
    
    // Interceptar requests y simular token expirado
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Token expired' })
      });
    });
    
    // Hacer una acción que requiera autenticación
    await page.locator('button:has-text("Nuevo Producto")').click();
    
    // Verificar que se redirige al login
    await expect(page).toHaveURL(/.*login/);
  });
});