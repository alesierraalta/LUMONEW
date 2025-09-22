/**
 * Global setup para tests de base de datos
 * Se ejecuta una vez antes de todos los tests
 */

import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseCleanup } from './database-cleanup';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for database tests...');
  
  try {
    // Verificar conexión a la base de datos
    await verifyDatabaseConnection();
    
    // Limpiar datos de prueba existentes
    await databaseCleanup.cleanupAllTestData();
    
    // Verificar que la limpieza fue exitosa
    const isClean = await databaseCleanup.verifyCleanup();
    if (!isClean) {
      throw new Error('Database cleanup verification failed');
    }
    
    // Obtener estadísticas iniciales
    const stats = await databaseCleanup.getDatabaseStats();
    console.log('📊 Initial database stats:', stats);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

async function verifyDatabaseConnection(): Promise<void> {
  try {
    console.log('🔍 Verifying database connection...');
    
    // Probar conexión con una consulta simple
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection verified');
  } catch (error) {
    console.error('❌ Database connection verification failed:', error);
    throw error;
  }
}

export default globalSetup;