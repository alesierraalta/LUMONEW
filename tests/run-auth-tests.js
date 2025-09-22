/**
 * Authentication Tests Runner
 * Runs all authentication tests and outputs results to console
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando pruebas de autenticación completas...\n');

// Configuration
const config = {
  port: process.env.PORT || '3000', // Default port, can be overridden
  baseUrl: `http://localhost:${process.env.PORT || '3000'}`,
  testTimeout: 60000, // 60 seconds
  headless: true
};

console.log(`📡 URL base configurada: ${config.baseUrl}`);
console.log(`⏱️  Timeout de pruebas: ${config.testTimeout}ms`);
console.log(`👁️  Modo: ${config.headless ? 'Headless' : 'Con interfaz'}\n`);

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Function to run a single test
function runTest(testName, testFile) {
  console.log(`\n🧪 Ejecutando: ${testName}`);
  console.log(`📁 Archivo: ${testFile}`);
  console.log('─'.repeat(50));
  
  testResults.total++;
  
  try {
    // Update playwright config to use the correct port
    const playwrightConfig = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/auth-results.json' }]
  ],
  use: {
    baseURL: '${config.baseUrl}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: ${config.testTimeout}
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  timeout: ${config.testTimeout}
});
`;
    
    fs.writeFileSync('playwright-auth.config.ts', playwrightConfig);
    
    // Run the test
    const command = `npx playwright test ${testFile} --config=playwright-auth.config.ts ${config.headless ? '--headed=false' : '--headed'}`;
    console.log(`💻 Comando: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      timeout: config.testTimeout + 10000,
      stdio: 'pipe'
    });
    
    console.log('✅ Resultado: ÉXITO');
    console.log('📋 Salida:');
    console.log(output);
    testResults.passed++;
    
  } catch (error) {
    console.log('❌ Resultado: FALLO');
    console.log('📋 Error:');
    console.log(error.stdout || error.message);
    
    if (error.stderr) {
      console.log('📋 Error stderr:');
      console.log(error.stderr);
    }
    
    testResults.failed++;
    testResults.errors.push({
      test: testName,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
  
  console.log('─'.repeat(50));
}

// Function to run unit tests
function runUnitTests() {
  console.log('\n🧪 Ejecutando pruebas unitarias...');
  console.log('─'.repeat(50));
  
  testResults.total++;
  
  try {
    const command = 'npx vitest run __tests__/unit/auth-permissions.test.ts --reporter=verbose';
    console.log(`💻 Comando: ${command}`);
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      timeout: 30000,
      stdio: 'pipe'
    });
    
    console.log('✅ Pruebas unitarias: ÉXITO');
    console.log('📋 Salida:');
    console.log(output);
    testResults.passed++;
    
  } catch (error) {
    console.log('❌ Pruebas unitarias: FALLO');
    console.log('📋 Error:');
    console.log(error.stdout || error.message);
    
    if (error.stderr) {
      console.log('📋 Error stderr:');
      console.log(error.stderr);
    }
    
    testResults.failed++;
    testResults.errors.push({
      test: 'Unit Tests',
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    });
  }
  
  console.log('─'.repeat(50));
}

// Main execution
async function main() {
  console.log('📋 Lista de pruebas a ejecutar:');
  console.log('1. Login con credenciales inválidas (E2E)');
  console.log('2. Logout de usuario (E2E)');
  console.log('3. Verificación de roles (Unit)');
  console.log('4. Acceso a rutas protegidas (E2E)');
  console.log('5. Expiración de sesión (E2E)');
  console.log('6. Recuperación de contraseña (E2E)');
  console.log('7. Pruebas unitarias de permisos\n');
  
  // Check if application is running
  console.log('🔍 Verificando si la aplicación está ejecutándose...');
  try {
    const { execSync } = require('child_process');
    execSync(`curl -s -o /dev/null -w "%{http_code}" ${config.baseUrl}`, { timeout: 5000 });
    console.log(`✅ Aplicación respondiendo en ${config.baseUrl}\n`);
  } catch (error) {
    console.log(`❌ No se puede conectar a ${config.baseUrl}`);
    console.log('⚠️  Asegúrate de que la aplicación esté ejecutándose');
    console.log('💡 Puedes ejecutar: npm run dev\n');
  }
  
  // Run comprehensive E2E tests
  runTest('Autenticación Completa', 'tests/automated/authentication-comprehensive.spec.ts');
  
  // Run existing authentication tests
  runTest('Sistema de Autenticación', 'tests/automated/authentication.spec.ts');
  
  // Run unit tests
  runUnitTests();
  
  // Generate final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL DE PRUEBAS DE AUTENTICACIÓN');
  console.log('='.repeat(60));
  console.log(`📈 Total de pruebas: ${testResults.total}`);
  console.log(`✅ Exitosas: ${testResults.passed}`);
  console.log(`❌ Fallidas: ${testResults.failed}`);
  console.log(`⏭️  Omitidas: ${testResults.skipped}`);
  console.log(`📊 Porcentaje de éxito: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORES DETALLADOS:');
    testResults.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.test}`);
      console.log(`   Error: ${error.error}`);
      if (error.stdout) {
        console.log(`   Output: ${error.stdout.substring(0, 200)}...`);
      }
    });
  }
  
  // Save results to file
  const resultsFile = 'test-results/auth-test-summary.json';
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Resultados guardados en: ${resultsFile}`);
  
  // Cleanup
  if (fs.existsSync('playwright-auth.config.ts')) {
    fs.unlinkSync('playwright-auth.config.ts');
  }
  
  console.log('\n🎯 Pruebas de autenticación completadas!');
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('💥 Error no manejado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Run main function
main().catch(console.error);
