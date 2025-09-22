#!/usr/bin/env node

/**
 * Script para ejecutar todos los tests de base de datos con limpieza automática
 * Incluye tests unitarios, de integración, de API y E2E
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuración
const TEST_TYPES = {
  unit: 'tests/unit/inventory-service-db.test.ts',
  integration: 'tests/integration/inventory-integration.test.ts',
  api: 'tests/api/inventory-api-db.test.ts',
  e2e: 'tests/e2e/inventory-e2e-db.test.ts'
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, COLORS.cyan);
  log(`  ${message}`, COLORS.bright + COLORS.cyan);
  log(`${'='.repeat(60)}`, COLORS.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.green);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.blue);
}

async function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    log(`Command: ${command}`, COLORS.magenta);
    
    const startTime = Date.now();
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    logSuccess(`${description} completed in ${duration}s`);
    return { success: true, duration };
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runDatabaseCleanup() {
  logHeader('DATABASE CLEANUP');
  
  try {
    // Ejecutar limpieza de base de datos
    const cleanupCommand = 'node -e "require(\'./tests/helpers/database-cleanup.js\').cleanupTestData()"';
    await runCommand(cleanupCommand, 'Database cleanup');
    
    logSuccess('Database cleanup completed');
  } catch (error) {
    logWarning(`Database cleanup failed: ${error.message}`);
  }
}

async function runTests(testType, testFile) {
  logHeader(`${testType.toUpperCase()} TESTS`);
  
  const command = `npx playwright test ${testFile} --reporter=line`;
  const result = await runCommand(command, `${testType} tests`);
  
  if (result.success) {
    logSuccess(`${testType} tests passed`);
  } else {
    logError(`${testType} tests failed`);
  }
  
  return result;
}

async function runAllTests() {
  const startTime = Date.now();
  const results = {};
  
  logHeader('INVENTORY DATABASE TESTS SUITE');
  logInfo('Starting comprehensive test suite with database integration');
  
  // Limpieza inicial
  await runDatabaseCleanup();
  
  // Ejecutar tests por tipo
  for (const [testType, testFile] of Object.entries(TEST_TYPES)) {
    results[testType] = await runTests(testType, testFile);
    
    // Limpieza después de cada tipo de test
    await runDatabaseCleanup();
  }
  
  // Limpieza final
  await runDatabaseCleanup();
  
  // Resumen de resultados
  logHeader('TEST RESULTS SUMMARY');
  
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  let passedTests = 0;
  let failedTests = 0;
  
  for (const [testType, result] of Object.entries(results)) {
    if (result.success) {
      logSuccess(`${testType} tests: PASSED`);
      passedTests++;
    } else {
      logError(`${testType} tests: FAILED`);
      failedTests++;
    }
  }
  
  log(`\nTotal Tests: ${Object.keys(results).length}`, COLORS.bright);
  log(`Passed: ${passedTests}`, COLORS.green);
  log(`Failed: ${failedTests}`, COLORS.red);
  log(`Total Duration: ${totalDuration}s`, COLORS.blue);
  
  if (failedTests === 0) {
    logSuccess('All tests passed! 🎉');
    process.exit(0);
  } else {
    logError('Some tests failed! 😞');
    process.exit(1);
  }
}

async function runSpecificTest(testType) {
  if (!TEST_TYPES[testType]) {
    logError(`Invalid test type: ${testType}`);
    logInfo(`Available test types: ${Object.keys(TEST_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  logHeader(`RUNNING ${testType.toUpperCase()} TESTS ONLY`);
  
  // Limpieza inicial
  await runDatabaseCleanup();
  
  // Ejecutar test específico
  const result = await runTests(testType, TEST_TYPES[testType]);
  
  // Limpieza final
  await runDatabaseCleanup();
  
  if (result.success) {
    logSuccess(`${testType} tests completed successfully! 🎉`);
    process.exit(0);
  } else {
    logError(`${testType} tests failed! 😞`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'all':
    case undefined:
      await runAllTests();
      break;
      
    case 'unit':
    case 'integration':
    case 'api':
    case 'e2e':
      await runSpecificTest(command);
      break;
      
    case 'cleanup':
      await runDatabaseCleanup();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      logHeader('DATABASE TESTS RUNNER');
      log('Usage: node scripts/run-database-tests.js [command]');
      log('');
      log('Commands:');
      log('  all          Run all tests (default)');
      log('  unit         Run unit tests only');
      log('  integration  Run integration tests only');
      log('  api          Run API tests only');
      log('  e2e          Run E2E tests only');
      log('  cleanup      Run database cleanup only');
      log('  help         Show this help message');
      log('');
      log('Examples:');
      log('  node scripts/run-database-tests.js');
      log('  node scripts/run-database-tests.js unit');
      log('  node scripts/run-database-tests.js cleanup');
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      logInfo('Use "help" to see available commands');
      process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Ejecutar script principal
main().catch((error) => {
  logError(`Script failed: ${error.message}`);
  process.exit(1);
});