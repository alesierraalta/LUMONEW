#!/usr/bin/env ts-node

/**
 * Script para ejecutar todos los tests automatizados de LUMONEW
 * Proporciona diferentes opciones de ejecución y reportes
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  name: string;
  pattern: string;
  description: string;
}

const TEST_SUITES: TestConfig[] = [
  {
    name: 'auth',
    pattern: 'tests/automated/authentication.spec.ts',
    description: 'Tests de autenticación y autorización'
  },
  {
    name: 'inventory',
    pattern: 'tests/automated/inventory-management.spec.ts',
    description: 'Tests de gestión de inventario'
  },
  {
    name: 'filters',
    pattern: 'tests/automated/filters-and-search.spec.ts',
    description: 'Tests de filtros y búsqueda'
  },
  {
    name: 'crud',
    pattern: 'tests/automated/crud-operations.spec.ts',
    description: 'Tests de operaciones CRUD'
  },
  {
    name: 'audit',
    pattern: 'tests/automated/audit-system.spec.ts',
    description: 'Tests de sistema de auditoría'
  },
  {
    name: 'performance',
    pattern: 'tests/automated/performance-and-ui.spec.ts',
    description: 'Tests de rendimiento y UI'
  }
];

class TestRunner {
  private results: Map<string, boolean> = new Map();
  private startTime: number = 0;

  async runAllTests(options: {
    headless?: boolean;
    browsers?: string[];
    workers?: number;
    retries?: number;
  } = {}) {
    console.log('🚀 Iniciando tests automatizados de LUMONEW\n');
    this.startTime = Date.now();

    const { headless = true, browsers = ['chromium'], workers = 4, retries = 1 } = options;

    try {
      // Verificar que Playwright está instalado
      this.checkPlaywrightInstallation();

      // Crear directorio de resultados
      this.createResultsDirectory();

      // Ejecutar todos los tests
      const command = this.buildPlaywrightCommand({
        headless,
        browsers,
        workers,
        retries
      });

      console.log(`📋 Ejecutando comando: ${command}\n`);

      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });

      this.results.set('all', true);
      this.generateSummary();

    } catch (error) {
      console.error('❌ Error ejecutando tests:', error);
      this.results.set('all', false);
      process.exit(1);
    }
  }

  async runTestSuite(suiteName: string, options: {
    headless?: boolean;
    browsers?: string[];
    workers?: number;
    retries?: number;
  } = {}) {
    const suite = TEST_SUITES.find(s => s.name === suiteName);
    if (!suite) {
      console.error(`❌ Suite de tests no encontrada: ${suiteName}`);
      console.log('📋 Suites disponibles:', TEST_SUITES.map(s => s.name).join(', '));
      return;
    }

    console.log(`🎯 Ejecutando suite: ${suite.description}\n`);
    this.startTime = Date.now();

    const { headless = true, browsers = ['chromium'], workers = 2, retries = 1 } = options;

    try {
      const command = this.buildPlaywrightCommand({
        pattern: suite.pattern,
        headless,
        browsers,
        workers,
        retries
      });

      console.log(`📋 Ejecutando: ${command}\n`);

      execSync(command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });

      this.results.set(suiteName, true);
      console.log(`✅ Suite ${suiteName} completada exitosamente`);

    } catch (error) {
      console.error(`❌ Error en suite ${suiteName}:`, error);
      this.results.set(suiteName, false);
    }
  }

  private buildPlaywrightCommand(options: {
    pattern?: string;
    headless?: boolean;
    browsers?: string[];
    workers?: number;
    retries?: number;
  }): string {
    const { 
      pattern = 'tests/automated', 
      headless = true, 
      browsers = ['chromium'], 
      workers = 4, 
      retries = 1 
    } = options;

    let command = 'npx playwright test';
    
    // Agregar patrón de archivos
    if (pattern) {
      command += ` ${pattern}`;
    }

    // Agregar navegadores
    if (browsers.length > 0) {
      command += ` --project=${browsers.join(' --project=')}`;
    }

    // Agregar opciones
    command += ` --workers=${workers}`;
    command += ` --retries=${retries}`;
    
    if (headless) {
      command += ' --headed=false';
    } else {
      command += ' --headed=true';
    }

    // Agregar reporter
    command += ' --reporter=html,json,junit';

    return command;
  }

  private checkPlaywrightInstallation(): void {
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
      console.log('✅ Playwright está instalado');
    } catch (error) {
      console.error('❌ Playwright no está instalado. Ejecuta: npm install -D @playwright/test');
      process.exit(1);
    }
  }

  private createResultsDirectory(): void {
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
      console.log('📁 Directorio de resultados creado');
    }
  }

  private generateSummary(): void {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);

    console.log('\n📊 RESUMEN DE TESTS');
    console.log('==================');
    console.log(`⏱️  Duración total: ${duration} segundos`);
    console.log(`✅ Tests exitosos: ${Array.from(this.results.values()).filter(Boolean).length}`);
    console.log(`❌ Tests fallidos: ${Array.from(this.results.values()).filter(v => !v).length}`);
    
    console.log('\n📋 Resultados por suite:');
    for (const [suite, success] of this.results.entries()) {
      const status = success ? '✅' : '❌';
      console.log(`  ${status} ${suite}`);
    }

    console.log('\n📁 Reportes generados en:');
    console.log('  - test-results/index.html (Reporte HTML)');
    console.log('  - test-results/results.json (Datos JSON)');
    console.log('  - test-results/results.xml (JUnit XML)');

    console.log('\n🎉 Tests completados');
  }

  showHelp(): void {
    console.log(`
🧪 LUMONEW Test Runner
=====================

Uso:
  npm run test:all              # Ejecutar todos los tests
  npm run test:suite <suite>    # Ejecutar suite específica
  npm run test:help             # Mostrar esta ayuda

Suites disponibles:
${TEST_SUITES.map(suite => `  ${suite.name.padEnd(12)} - ${suite.description}`).join('\n')}

Opciones:
  --headed                      # Ejecutar con navegador visible
  --browsers <browsers>         # Navegadores (chromium,firefox,webkit)
  --workers <number>            # Número de workers paralelos
  --retries <number>            # Número de reintentos

Ejemplos:
  npm run test:suite auth --headed
  npm run test:all --browsers chromium,firefox --workers 2
    `);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0 || args.includes('--help') || args.includes('help')) {
    runner.showHelp();
    return;
  }

  const command = args[0];
  const options = parseOptions(args.slice(1));

  switch (command) {
    case 'all':
      await runner.runAllTests(options);
      break;
    case 'suite':
      const suiteName = args[1];
      if (!suiteName) {
        console.error('❌ Debe especificar el nombre de la suite');
        runner.showHelp();
        return;
      }
      await runner.runTestSuite(suiteName, options);
      break;
    default:
      console.error(`❌ Comando no reconocido: ${command}`);
      runner.showHelp();
  }
}

function parseOptions(args: string[]): any {
  const options: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--headed') {
      options.headless = false;
    } else if (arg === '--browsers' && i + 1 < args.length) {
      options.browsers = args[i + 1].split(',');
      i++;
    } else if (arg === '--workers' && i + 1 < args.length) {
      options.workers = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--retries' && i + 1 < args.length) {
      options.retries = parseInt(args[i + 1]);
      i++;
    }
  }
  
  return options;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { TestRunner, TEST_SUITES };