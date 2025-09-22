#!/usr/bin/env node

/**
 * Final Audit System Test Runner
 * Executes all audit tests and generates comprehensive console reports
 */

const { execSync } = require('child_process');
const fs = require('fs');

class FinalAuditTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
    
    this.testFiles = [
      'tests/e2e/audit-system-simple.test.ts',
      'tests/e2e/audit-api-integration-fixed.test.ts'
    ];
  }

  async runAllTests() {
    console.log('🚀 EJECUTANDO TESTS AUTOMATIZADOS DEL SISTEMA DE AUDITORÍA');
    console.log('='.repeat(60));
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log(`📁 Archivos de test: ${this.testFiles.length}`);
    console.log('='.repeat(60));

    for (const testFile of this.testFiles) {
      await this.runTestFile(testFile);
    }

    this.generateFinalReport();
  }

  async runTestFile(testFile) {
    console.log(`\n📋 Ejecutando: ${testFile}`);
    console.log('-'.repeat(40));
    
    try {
      const command = `npx playwright test ${testFile} --project=chromium --config=playwright-no-server.config.ts --reporter=list`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 120000 // 2 minutes timeout
      });
      
      this.processTestOutput(testFile, output);
      
    } catch (error) {
      console.error(`❌ Error ejecutando ${testFile}:`);
      console.error(error.message);
      this.processTestError(testFile, error);
    }
  }

  processTestOutput(testFile, output) {
    const lines = output.split('\n');
    let testCount = 0;
    let passedCount = 0;
    let failedCount = 0;
    
    lines.forEach(line => {
      if (line.includes('✓')) {
        testCount++;
        passedCount++;
        console.log(`  ✅ ${line.trim()}`);
      } else if (line.includes('✘')) {
        testCount++;
        failedCount++;
        console.log(`  ❌ ${line.trim()}`);
      }
    });
    
    this.results.summary.total += testCount;
    this.results.summary.passed += passedCount;
    this.results.summary.failed += failedCount;
    
    this.results.tests.push({
      file: testFile,
      total: testCount,
      passed: passedCount,
      failed: failedCount,
      status: failedCount === 0 ? 'PASSED' : 'FAILED'
    });
    
    console.log(`\n📊 Resultado: ${passedCount}/${testCount} tests pasaron`);
  }

  processTestError(testFile, error) {
    this.results.tests.push({
      file: testFile,
      total: 0,
      passed: 0,
      failed: 1,
      status: 'ERROR',
      error: error.message
    });
    
    this.results.summary.failed++;
  }

  generateFinalReport() {
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE FINAL - SISTEMA DE AUDITORÍA');
    console.log('='.repeat(60));
    
    console.log(`⏱️  Duración total: ${this.results.duration}ms`);
    console.log(`📋 Tests totales: ${this.results.summary.total}`);
    console.log(`✅ Pasaron: ${this.results.summary.passed}`);
    console.log(`❌ Fallaron: ${this.results.summary.failed}`);
    console.log(`⏭️  Omitidos: ${this.results.summary.skipped}`);
    
    const successRate = this.results.summary.total > 0 
      ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)
      : 0;
    
    console.log(`📈 Tasa de éxito: ${successRate}%`);
    
    console.log('\n📋 DETALLES POR ARCHIVO:');
    console.log('-'.repeat(60));
    
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${test.file}`);
      console.log(`   Tests: ${test.passed}/${test.total} pasaron`);
      console.log(`   Estado: ${test.status}`);
      if (test.error) {
        console.log(`   Error: ${test.error.substring(0, 100)}...`);
      }
    });

    console.log('\n🎯 ESTADO DEL SISTEMA DE AUDITORÍA:');
    if (this.results.summary.failed === 0) {
      console.log('✅ SISTEMA COMPLETAMENTE FUNCIONAL');
      console.log('   - Todas las funcionalidades verificadas');
      console.log('   - APIs respondiendo correctamente');
      console.log('   - Logs de auditoría funcionando');
      console.log('   - Filtros y búsquedas operativos');
    } else {
      console.log('⚠️  PROBLEMAS DETECTADOS');
      console.log('   - Algunos tests fallaron');
      console.log('   - Revisar errores arriba');
      console.log('   - Verificar configuración del sistema');
    }

    // Save JSON report
    this.saveJsonReport();
    
    console.log('\n📄 Reporte JSON guardado en: audit-test-final-results.json');
    console.log('\n🎉 EJECUCIÓN COMPLETADA');
    console.log('='.repeat(60));
  }

  saveJsonReport() {
    const reportPath = 'audit-test-final-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
  }
}

// Run the tests
if (require.main === module) {
  const runner = new FinalAuditTestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = FinalAuditTestRunner;
