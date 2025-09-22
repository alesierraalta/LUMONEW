/**
 * Configuración para tests de base de datos
 * Define configuraciones específicas para tests que interactúan con la base de datos real
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: [
    '**/unit/inventory-service-db.test.ts',
    '**/integration/inventory-integration.test.ts',
    '**/api/inventory-api-db.test.ts',
    '**/e2e/inventory-e2e-db.test.ts'
  ],
  
  // Configuración de timeouts para tests de base de datos
  timeout: 60000, // 60 segundos
  expect: {
    timeout: 10000 // 10 segundos para expectaciones
  },
  
  // Configuración de workers
  workers: 1, // Ejecutar tests secuencialmente para evitar conflictos de base de datos
  
  // Configuración de retry
  retries: 2, // Reintentar tests fallidos 2 veces
  
  // Configuración de reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report-db' }],
    ['json', { outputFile: 'test-results-db.json' }],
    ['line']
  ],
  
  // Configuración de proyectos
  projects: [
    {
      name: 'database-tests',
      testMatch: [
        '**/unit/inventory-service-db.test.ts',
        '**/integration/inventory-integration.test.ts',
        '**/api/inventory-api-db.test.ts',
        '**/e2e/inventory-e2e-db.test.ts'
      ],
      use: {
        // Configuración específica para tests de base de datos
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'Content-Type': 'application/json'
        }
      }
    }
  ],
  
  // Configuración de servidor web
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000 // 2 minutos para iniciar el servidor
  },
  
  // Configuración de variables de entorno
  use: {
    // Variables de entorno para tests
    baseURL: 'http://localhost:3000',
    
    // Configuración de Supabase para tests
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    },
    
    // Configuración de screenshots
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Configuración de trace
    trace: 'retain-on-failure'
  },
  
  // Configuración de output
  outputDir: 'test-results-db/',
  
  // Configuración de global setup/teardown
  globalSetup: require.resolve('./tests/helpers/global-setup.ts'),
  globalTeardown: require.resolve('./tests/helpers/global-teardown.ts'),
  
  // Configuración de fixtures
  fixtures: {
    database: require.resolve('./tests/helpers/database-fixtures.ts')
  }
});