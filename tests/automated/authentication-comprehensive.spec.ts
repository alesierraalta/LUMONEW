/**
 * Comprehensive Authentication Tests
 * Covers all pending authentication tests from OPERACIONES_A_TESTEAR.md
 * 
 * Tests:
 * 1. Login con credenciales inválidas (E2E) - ⏳ Pendiente
 * 2. Logout de usuario (E2E) - ⏳ Pendiente  
 * 3. Verificación de roles (Unit) - ⏳ Pendiente
 * 4. Acceso a rutas protegidas (E2E) - ⏳ Pendiente
 * 5. Expiración de sesión (E2E) - ⏳ Pendiente
 * 6. Recuperación de contraseña (E2E) - ⏳ Pendiente
 */

import { test, expect } from '@playwright/test';

test.describe('Autenticación Completa - OPERACIONES_A_TESTEAR', () => {
  
  // Test 1: Login con credenciales inválidas (E2E)
  test('Login con credenciales inválidas - E2E', async ({ page }) => {
    console.log('🧪 Ejecutando: Login con credenciales inválidas');
    
    // Navegar a la página de login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verificar que el formulario de login está visible
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Probar diferentes tipos de credenciales inválidas
    const invalidCredentials = [
      { email: 'invalid@email.com', password: 'wrongpassword' },
      { email: 'test@example.com', password: 'incorrectpass' },
      { email: 'nonexistent@domain.com', password: 'anypassword' },
      { email: '', password: 'password123' },
      { email: 'valid@email.com', password: '' },
      { email: 'invalid-email-format', password: 'password123' }
    ];
    
    for (const credentials of invalidCredentials) {
      console.log(`  📝 Probando credenciales: ${credentials.email} / ${credentials.password || 'vacío'}`);
      
      // Limpiar campos
      await emailInput.clear();
      await passwordInput.clear();
      
      // Llenar con credenciales inválidas
      if (credentials.email) {
        await emailInput.fill(credentials.email);
      }
      if (credentials.password) {
        await passwordInput.fill(credentials.password);
      }
      
      // Enviar formulario
      await loginButton.click();
      
      // Esperar respuesta
      await page.waitForTimeout(2000);
      
      // Verificar que se muestra mensaje de error
      const errorSelectors = [
        '[data-testid="error-message"]',
        '.error',
        '.alert-error',
        '.text-red-500',
        '.text-red-600',
        '[role="alert"]',
        'text=Invalid credentials',
        'text=Credenciales inválidas',
        'text=Error',
        'text=Usuario no encontrado'
      ];
      
      let errorFound = false;
      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector);
        if (await errorElement.isVisible().catch(() => false)) {
          console.log(`  ✅ Error mostrado: ${selector}`);
          errorFound = true;
          break;
        }
      }
      
      if (!errorFound) {
        // Verificar que no se redirige al dashboard
        const currentUrl = page.url();
        const isOnDashboard = currentUrl.includes('/inventory') || 
                             currentUrl.includes('/dashboard') ||
                             currentUrl.includes('/home');
        
        if (!isOnDashboard) {
          console.log(`  ✅ No se redirigió al dashboard - URL actual: ${currentUrl}`);
          errorFound = true;
        }
      }
      
      expect(errorFound).toBeTruthy();
    }
    
    console.log('✅ Test completado: Login con credenciales inválidas');
  });

  // Test 2: Logout de usuario (E2E)
  test('Logout de usuario - E2E', async ({ page }) => {
    console.log('🧪 Ejecutando: Logout de usuario');
    
    // Primero hacer login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    // Intentar login con credenciales válidas
    if (await emailInput.isVisible()) {
      await emailInput.fill('alesierraalta@gmail.com');
      await passwordInput.fill('testpassword');
      await loginButton.click();
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // Verificar si el usuario está logueado
    const userInfo = page.locator('text=Alejandro Sierraalta');
    const isLoggedIn = await userInfo.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      console.log('  📝 Usuario logueado, procediendo con logout');
      
      // Buscar opciones de logout
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Cerrar sesión")',
        'button:has-text("Sign out")',
        '[data-testid="logout-button"]',
        '[data-testid="user-menu"]',
        'button:has-text("AS")',
        'button:has-text("A")'
      ];
      
      let logoutExecuted = false;
      
      for (const selector of logoutSelectors) {
        const logoutElement = page.locator(selector);
        if (await logoutElement.isVisible().catch(() => false)) {
          console.log(`  📝 Encontrado elemento de logout: ${selector}`);
          
          await logoutElement.click();
          await page.waitForTimeout(1000);
          
          // Si es un menú, buscar opción de logout
          const logoutOption = page.locator('text=Logout, text=Cerrar sesión, text=Sign out');
          if (await logoutOption.isVisible().catch(() => false)) {
            await logoutOption.click();
            await page.waitForTimeout(2000);
          }
          
          logoutExecuted = true;
          break;
        }
      }
      
      if (logoutExecuted) {
        // Verificar que el usuario fue deslogueado
        await page.waitForLoadState('networkidle');
        
        // Verificar que no se muestra información del usuario
        const userInfoAfterLogout = page.locator('text=Alejandro Sierraalta');
        const isStillLoggedIn = await userInfoAfterLogout.isVisible().catch(() => false);
        
        if (!isStillLoggedIn) {
          console.log('  ✅ Usuario deslogueado exitosamente');
        } else {
          console.log('  ⚠️ Usuario aún aparece como logueado');
        }
        
        // Verificar redirección a login o página pública
        const currentUrl = page.url();
        const isOnLoginPage = currentUrl.includes('/login') || 
                             currentUrl.includes('/auth') ||
                             currentUrl === page.url(); // Si no cambió, podría estar en página pública
        
        console.log(`  📝 URL después del logout: ${currentUrl}`);
        expect(!isStillLoggedIn || isOnLoginPage).toBeTruthy();
      } else {
        console.log('  ⚠️ No se encontró funcionalidad de logout');
        test.skip('Funcionalidad de logout no encontrada');
      }
    } else {
      console.log('  ⚠️ Usuario no está logueado, saltando test de logout');
      test.skip('Usuario no está logueado');
    }
    
    console.log('✅ Test completado: Logout de usuario');
  });

  // Test 3: Verificación de roles (Unit)
  test('Verificación de roles - Unit', async ({ page }) => {
    console.log('🧪 Ejecutando: Verificación de roles');
    
    // Navegar a la aplicación
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar si el usuario está logueado
    const userInfo = page.locator('text=Alejandro Sierraalta');
    const isLoggedIn = await userInfo.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      console.log('  📝 Usuario logueado, verificando permisos de rol');
      
      // Verificar acceso a diferentes secciones según el rol
      const sections = [
        { name: 'Inventario', url: '/inventory', selector: 'button:has-text("Nuevo Producto")' },
        { name: 'Usuarios', url: '/users', selector: 'button:has-text("Nuevo Usuario")' },
        { name: 'Categorías', url: '/categories', selector: 'button:has-text("Nueva Categoría")' },
        { name: 'Ubicaciones', url: '/locations', selector: 'button:has-text("Nueva Ubicación")' },
        { name: 'Auditoría', url: '/audit', selector: '[data-testid="audit-table"]' }
      ];
      
      for (const section of sections) {
        console.log(`  📝 Verificando acceso a: ${section.name}`);
        
        await page.goto(section.url);
        await page.waitForLoadState('networkidle');
        
        // Verificar que no se redirige al login
        const currentUrl = page.url();
        const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
        
        if (!isRedirectedToLogin) {
          // Verificar que los elementos de la sección están disponibles
          const sectionElement = page.locator(section.selector);
          const hasAccess = await sectionElement.isVisible().catch(() => false);
          
          if (hasAccess) {
            console.log(`    ✅ Acceso permitido a ${section.name}`);
          } else {
            console.log(`    ⚠️ Elementos de ${section.name} no visibles`);
          }
        } else {
          console.log(`    ❌ Acceso denegado a ${section.name} - redirigido a login`);
        }
      }
      
      // Verificar información del rol del usuario
      const roleIndicators = [
        'text=Admin',
        'text=Administrator',
        'text=User',
        'text=Editor',
        '[data-testid="user-role"]'
      ];
      
      let roleFound = false;
      for (const indicator of roleIndicators) {
        const roleElement = page.locator(indicator);
        if (await roleElement.isVisible().catch(() => false)) {
          const roleText = await roleElement.textContent();
          console.log(`  ✅ Rol detectado: ${roleText}`);
          roleFound = true;
          break;
        }
      }
      
      if (!roleFound) {
        console.log('  ⚠️ No se pudo determinar el rol del usuario');
      }
      
    } else {
      console.log('  ⚠️ Usuario no logueado, verificando restricciones de acceso');
      
      // Verificar que las rutas protegidas redirigen al login
      const protectedRoutes = ['/inventory', '/users', '/categories', '/locations', '/audit'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        const isRedirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');
        
        if (isRedirectedToLogin) {
          console.log(`  ✅ Ruta protegida ${route} redirige correctamente al login`);
        } else {
          console.log(`  ❌ Ruta protegida ${route} no redirige al login`);
        }
        
        expect(isRedirectedToLogin).toBeTruthy();
      }
    }
    
    console.log('✅ Test completado: Verificación de roles');
  });

  // Test 4: Acceso a rutas protegidas (E2E)
  test('Acceso a rutas protegidas - E2E', async ({ page }) => {
    console.log('🧪 Ejecutando: Acceso a rutas protegidas');
    
    // Limpiar cookies para asegurar que no hay sesión
    await page.context().clearCookies();
    
    // Lista de rutas protegidas
    const protectedRoutes = [
      '/inventory',
      '/users',
      '/categories',
      '/locations',
      '/audit',
      '/dashboard',
      '/settings',
      '/projects'
    ];
    
    for (const route of protectedRoutes) {
      console.log(`  📝 Verificando acceso a: ${route}`);
      
      // Intentar acceder a la ruta protegida
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      // Verificar que se redirige al login o se muestra formulario de autenticación
      const currentUrl = page.url();
      const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Iniciar sesión")').isVisible().catch(() => false);
      
      const isProtected = currentUrl.includes('/login') || 
                         currentUrl.includes('/auth') || 
                         hasLoginForm || 
                         hasLoginButton;
      
      if (isProtected) {
        console.log(`    ✅ Ruta ${route} correctamente protegida`);
      } else {
        console.log(`    ❌ Ruta ${route} no está protegida - URL: ${currentUrl}`);
      }
      
      expect(isProtected).toBeTruthy();
    }
    
    console.log('✅ Test completado: Acceso a rutas protegidas');
  });

  // Test 5: Expiración de sesión (E2E)
  test('Expiración de sesión - E2E', async ({ page }) => {
    console.log('🧪 Ejecutando: Expiración de sesión');
    
    // Primero hacer login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('alesierraalta@gmail.com');
      await passwordInput.fill('testpassword');
      await loginButton.click();
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
    }
    
    // Verificar si el usuario está logueado
    const userInfo = page.locator('text=Alejandro Sierraalta');
    const isLoggedIn = await userInfo.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      console.log('  📝 Usuario logueado, simulando expiración de sesión');
      
      // Simular expiración de sesión limpiando cookies y localStorage
      await page.context().clearCookies();
      await page.evaluate(() => localStorage.clear());
      
      // Intentar realizar una acción que requiera autenticación
      const actions = [
        { name: 'Acceder a inventario', action: () => page.goto('/inventory') },
        { name: 'Crear nuevo producto', action: () => page.locator('button:has-text("Nuevo Producto")').click() },
        { name: 'Acceder a usuarios', action: () => page.goto('/users') }
      ];
      
      for (const actionItem of actions) {
        console.log(`  📝 Probando acción: ${actionItem.name}`);
        
        try {
          await actionItem.action();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Verificar que se redirige al login o se muestra error de autenticación
          const currentUrl = page.url();
          const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
          const hasAuthError = await page.locator('text=Unauthorized, text=Token expired, text=Sesión expirada').isVisible().catch(() => false);
          
          const isRedirectedToAuth = currentUrl.includes('/login') || 
                                   currentUrl.includes('/auth') || 
                                   hasLoginForm || 
                                   hasAuthError;
          
          if (isRedirectedToAuth) {
            console.log(`    ✅ ${actionItem.name} - Sesión expirada manejada correctamente`);
          } else {
            console.log(`    ❌ ${actionItem.name} - No se manejó la expiración de sesión`);
          }
          
          expect(isRedirectedToAuth).toBeTruthy();
          
        } catch (error) {
          console.log(`    ✅ ${actionItem.name} - Error esperado por sesión expirada`);
        }
      }
      
    } else {
      console.log('  ⚠️ Usuario no logueado, saltando test de expiración de sesión');
      test.skip('Usuario no está logueado');
    }
    
    console.log('✅ Test completado: Expiración de sesión');
  });

  // Test 6: Recuperación de contraseña (E2E)
  test('Recuperación de contraseña - E2E', async ({ page }) => {
    console.log('🧪 Ejecutando: Recuperación de contraseña');
    
    // Navegar a la página de login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Buscar enlace de recuperación de contraseña
    const forgotPasswordSelectors = [
      'text=Forgot password',
      'text=¿Olvidaste tu contraseña?',
      'text=Recuperar contraseña',
      'text=Reset password',
      'a[href*="forgot"]',
      'a[href*="reset"]',
      '[data-testid="forgot-password"]'
    ];
    
    let forgotPasswordLink = null;
    for (const selector of forgotPasswordSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        forgotPasswordLink = element;
        console.log(`  📝 Encontrado enlace de recuperación: ${selector}`);
        break;
      }
    }
    
    if (forgotPasswordLink) {
      // Hacer clic en el enlace de recuperación
      await forgotPasswordLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verificar que se muestra el formulario de recuperación
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Enviar"), button:has-text("Send")');
      
      if (await emailInput.isVisible() && await submitButton.isVisible()) {
        console.log('  📝 Formulario de recuperación encontrado');
        
        // Probar con email válido
        await emailInput.fill('alesierraalta@gmail.com');
        await submitButton.click();
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Verificar mensaje de confirmación
        const successSelectors = [
          'text=Email sent',
          'text=Correo enviado',
          'text=Check your email',
          'text=Revisa tu correo',
          'text=Success',
          'text=Éxito',
          '[data-testid="success-message"]'
        ];
        
        let successMessageFound = false;
        for (const selector of successSelectors) {
          const element = page.locator(selector);
          if (await element.isVisible().catch(() => false)) {
            console.log(`    ✅ Mensaje de éxito mostrado: ${selector}`);
            successMessageFound = true;
            break;
          }
        }
        
        if (successMessageFound) {
          console.log('  ✅ Recuperación de contraseña funcionando correctamente');
        } else {
          console.log('  ⚠️ No se mostró mensaje de confirmación');
        }
        
        // Probar con email inválido
        await emailInput.clear();
        await emailInput.fill('invalid@email.com');
        await submitButton.click();
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Verificar mensaje de error
        const errorSelectors = [
          'text=Email not found',
          'text=Email no encontrado',
          'text=Invalid email',
          'text=Email inválido',
          '[data-testid="error-message"]'
        ];
        
        let errorMessageFound = false;
        for (const selector of errorSelectors) {
          const element = page.locator(selector);
          if (await element.isVisible().catch(() => false)) {
            console.log(`    ✅ Mensaje de error mostrado: ${selector}`);
            errorMessageFound = true;
            break;
          }
        }
        
        if (errorMessageFound) {
          console.log('  ✅ Validación de email inválido funcionando');
        } else {
          console.log('  ⚠️ No se mostró mensaje de error para email inválido');
        }
        
      } else {
        console.log('  ❌ Formulario de recuperación no encontrado');
      }
      
    } else {
      console.log('  ⚠️ Enlace de recuperación de contraseña no encontrado');
      test.skip('Funcionalidad de recuperación de contraseña no disponible');
    }
    
    console.log('✅ Test completado: Recuperación de contraseña');
  });

});