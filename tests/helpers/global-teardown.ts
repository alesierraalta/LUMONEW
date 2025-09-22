/**
 * Global teardown para tests de base de datos
 * Se ejecuta una vez después de todos los tests
 */

import { FullConfig } from '@playwright/test';
import { databaseCleanup } from './database-cleanup';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for database tests...');
  
  try {
    // Limpiar todos los datos de prueba
    await databaseCleanup.cleanupAllTestData();
    
    // Verificar que la limpieza fue exitosa
    const isClean = await databaseCleanup.verifyCleanup();
    if (!isClean) {
      console.warn('⚠️ Some test data may remain in the database');
    }
    
    // Obtener estadísticas finales
    const stats = await databaseCleanup.getDatabaseStats();
    console.log('📊 Final database stats:', stats);
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // No lanzar error para no afectar el resultado de los tests
  }
}

export default globalTeardown;