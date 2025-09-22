#!/usr/bin/env node

/**
 * Script para ejecutar tests organizados por categorías
 * Uso: node scripts/run-organized-tests.js [categoría] [opciones]
 */

const { execSync } = require('child_process');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showHelp() {
  log('\n🧪 Tests Organizados - LUMO2', 'cyan');
  log('================================', 'cyan');
  log('\nUso:', 'bright');
  log('  node scripts/run-organized-tests.js [categoría] [opciones]', 'yellow');
  log('\nCategorías disponibles:', 'bright');
  log('  unit        - Tests unitarios con base de datos', 'green');
  log('  integration - Tests de integración con base de datos', 'green');
  log('  e2e         - Tests end-to-end con base de datos', 'green');
  log('  api         - Tests de API con base de datos', 'green');
  log('  manual      - Tests manuales y scripts de debug', 'green');
  log('  all         - Ejecutar todos los tests (por defecto)', 'green');
  log('\nOpciones:', 'bright');
  log('  --quick     - Ejecutar solo tests críticos', 'yellow');
  log('  --verbose   - Mostrar logs detallados', 'yellow');
  log('  --cleanup   - Limpiar datos de test después', 'yellow');
  log('  --help      - Mostrar esta ayuda', 'yellow');
  log('\nEjemplos:', 'bright');
  log('  node scripts/run-organized-tests.js', 'blue');
  log('  node scripts/run-organized-tests.js unit', 'blue');
  log('  node scripts/run-organized-tests.js manual --verbose', 'blue');
  log('  node scripts/run-organized-tests.js all --quick --cleanup', 'blue');
  log('\n');
}

function checkEnvironment() {
  log('🔧 Verificando configuración...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log('❌ Variables de entorno faltantes:', 'red');
    missing.forEach(varName => log(`   - ${varName}`, 'red'));
    log('\n💡 Configura las variables de entorno antes de ejecutar los tests.', 'yellow');
    process.exit(1);
  }
  
  log('✅ Variables de entorno configuradas correctamente', 'green');
}

function runTests(category, options = {}) {
  const testDir = path.join(__dirname, '..', 'tests-organized');
  
  switch (category) {
    case 'unit':
      log('\n🔬 Ejecutando Tests Unitarios...', 'cyan');
      runUnitTests(testDir, options);
      break;
      
    case 'integration':
      log('\n🔗 Ejecutando Tests de Integración...', 'cyan');
      runIntegrationTests(testDir, options);
      break;
      
    case 'e2e':
      log('\n🌐 Ejecutando Tests End-to-End...', 'cyan');
      runE2ETests(testDir, options);
      break;
      
    case 'api':
      log('\n🔌 Ejecutando Tests de API...', 'cyan');
      runAPITests(testDir, options);
      break;
      
    case 'manual':
      log('\n🖱️ Ejecutando Tests Manuales...', 'cyan');
      runManualTests(testDir, options);
      break;
      
    case 'all':
    default:
      log('\n🎯 Ejecutando Todos los Tests...', 'cyan');
      runAllTests(testDir, options);
      break;
  }
}

function runUnitTests(testDir, options) {
  try {
    const command = `npx playwright test ${path.join(testDir, 'unit')} --reporter=line`;
    log(`Ejecutando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log('✅ Tests unitarios completados', 'green');
  } catch (error) {
    log('❌ Error en tests unitarios', 'red');
    process.exit(1);
  }
}

function runIntegrationTests(testDir, options) {
  try {
    const command = `npx playwright test ${path.join(testDir, 'integration')} --reporter=line`;
    log(`Ejecutando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log('✅ Tests de integración completados', 'green');
  } catch (error) {
    log('❌ Error en tests de integración', 'red');
    process.exit(1);
  }
}

function runE2ETests(testDir, options) {
  try {
    const command = `npx playwright test ${path.join(testDir, 'e2e')} --reporter=line`;
    log(`Ejecutando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log('✅ Tests end-to-end completados', 'green');
  } catch (error) {
    log('❌ Error en tests end-to-end', 'red');
    process.exit(1);
  }
}

function runAPITests(testDir, options) {
  try {
    const command = `npx playwright test ${path.join(testDir, 'api')} --reporter=line`;
    log(`Ejecutando: ${command}`, 'yellow');
    execSync(command, { stdio: 'inherit' });
    log('✅ Tests de API completados', 'green');
  } catch (error) {
    log('❌ Error en tests de API', 'red');
    process.exit(1);
  }
}

function runManualTests(testDir, options) {
  const manualTests = [
    'test-bulk-create.js',
    'test-sync-investigation.js',
    'test-cache-invalidation-fix.js'
  ];
  
  manualTests.forEach(testFile => {
    try {
      log(`\n🖱️ Ejecutando: ${testFile}`, 'blue');
      const command = `node ${path.join(testDir, 'manual', testFile)}`;
      execSync(command, { stdio: 'inherit' });
      log(`✅ ${testFile} completado`, 'green');
    } catch (error) {
      log(`❌ Error en ${testFile}`, 'red');
    }
  });
}

function runAllTests(testDir, options) {
  const categories = ['unit', 'integration', 'e2e', 'api'];
  
  categories.forEach(category => {
    try {
      runTests(category, options);
    } catch (error) {
      log(`❌ Error en tests de ${category}`, 'red');
    }
  });
  
  log('\n🎉 Todos los tests completados', 'green');
}

function cleanup() {
  log('\n🧹 Limpiando datos de test...', 'blue');
  try {
    execSync('npm run test:db:cleanup', { stdio: 'inherit' });
    log('✅ Limpieza completada', 'green');
  } catch (error) {
    log('❌ Error en limpieza', 'red');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  const category = args.find(arg => !arg.startsWith('--')) || 'all';
  const options = {
    quick: args.includes('--quick'),
    verbose: args.includes('--verbose'),
    cleanup: args.includes('--cleanup')
  };
  
  log('🧪 Tests Organizados - LUMO2', 'bright');
  log('===============================', 'bright');
  log(`Categoría: ${category}`, 'cyan');
  log(`Opciones: ${JSON.stringify(options)}`, 'cyan');
  
  checkEnvironment();
  
  try {
    runTests(category, options);
    
    if (options.cleanup) {
      cleanup();
    }
    
    log('\n🎯 Ejecución completada exitosamente', 'green');
  } catch (error) {
    log('\n❌ Error durante la ejecución', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, checkEnvironment, cleanup };
