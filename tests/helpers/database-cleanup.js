/**
 * Sistema de limpieza automática para tests de base de datos (JavaScript)
 * Elimina todos los datos de prueba creados durante los tests
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase para tests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class DatabaseCleanup {
  constructor() {
    this.testDataIds = new Set();
  }

  /**
   * Registra un ID de datos de prueba para limpieza posterior
   */
  registerTestData(id) {
    this.testDataIds.add(id);
  }

  /**
   * Limpia todos los datos de prueba registrados
   */
  async cleanupAllTestData() {
    try {
      console.log('🧹 Starting database cleanup...');
      
      // Limpiar inventario
      await this.cleanupInventory();
      
      // Limpiar logs de auditoría
      await this.cleanupAuditLogs();
      
      // Limpiar categorías de prueba
      await this.cleanupCategories();
      
      // Limpiar ubicaciones de prueba
      await this.cleanupLocations();
      
      // Limpiar datos de prueba registrados
      await this.cleanupRegisteredData();
      
      console.log('✅ Database cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during database cleanup:', error);
      throw error;
    }
  }

  /**
   * Limpia datos de inventario de prueba
   */
  async cleanupInventory() {
    const testPatterns = [
      'TEST-UNIT-%',
      'TEST-INTEGRATION-%',
      'TEST-API-%',
      'TEST-E2E-%',
      'TEST-FINAL-%',
      'TEST-FIX-%'
    ];

    for (const pattern of testPatterns) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .like('sku', pattern);

      if (error) {
        console.warn(`Warning: Could not clean inventory with pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Limpia logs de auditoría de prueba
   */
  async cleanupAuditLogs() {
    // Limpiar logs de auditoría que contengan datos de prueba
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .or('table_name.eq.test_table,record_id.like.TEST-%,action_description.like.%Test%');

    if (error) {
      console.warn('Warning: Could not clean audit logs:', error);
    }
  }

  /**
   * Limpia categorías de prueba
   */
  async cleanupCategories() {
    const testPatterns = [
      '%Test Unit%',
      '%Test Integration%',
      '%Test API%',
      '%Test E2E%',
      '%Test Final%',
      '%Test Fix%'
    ];

    for (const pattern of testPatterns) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .like('name', pattern);

      if (error) {
        console.warn(`Warning: Could not clean categories with pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Limpia ubicaciones de prueba
   */
  async cleanupLocations() {
    const testPatterns = [
      '%Test Unit%',
      '%Test Integration%',
      '%Test API%',
      '%Test E2E%',
      '%Test Final%',
      '%Test Fix%'
    ];

    for (const pattern of testPatterns) {
      const { error } = await supabase
        .from('locations')
        .delete()
        .like('name', pattern);

      if (error) {
        console.warn(`Warning: Could not clean locations with pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Limpia datos específicos registrados durante los tests
   */
  async cleanupRegisteredData() {
    if (this.testDataIds.size === 0) {
      return;
    }

    const ids = Array.from(this.testDataIds);
    
    // Limpiar inventario por IDs
    const { error: inventoryError } = await supabase
      .from('inventory')
      .delete()
      .in('id', ids);

    if (inventoryError) {
      console.warn('Warning: Could not clean registered inventory data:', inventoryError);
    }

    // Limpiar categorías por IDs
    const { error: categoryError } = await supabase
      .from('categories')
      .delete()
      .in('id', ids);

    if (categoryError) {
      console.warn('Warning: Could not clean registered category data:', categoryError);
    }

    // Limpiar ubicaciones por IDs
    const { error: locationError } = await supabase
      .from('locations')
      .delete()
      .in('id', ids);

    if (locationError) {
      console.warn('Warning: Could not clean registered location data:', locationError);
    }

    // Limpiar logs de auditoría por IDs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .in('record_id', ids);

    if (auditError) {
      console.warn('Warning: Could not clean registered audit data:', auditError);
    }

    // Limpiar la lista de IDs registrados
    this.testDataIds.clear();
  }

  /**
   * Limpia datos de prueba por timestamp
   */
  async cleanupByTimestamp(timestamp) {
    try {
      console.log(`🧹 Cleaning up test data for timestamp: ${timestamp}`);
      
      // Limpiar inventario
      const { error: inventoryError } = await supabase
        .from('inventory')
        .delete()
        .like('sku', `%-${timestamp}`);

      if (inventoryError) {
        console.warn('Warning: Could not clean inventory by timestamp:', inventoryError);
      }

      // Limpiar categorías
      const { error: categoryError } = await supabase
        .from('categories')
        .delete()
        .like('id', `%-${timestamp}`);

      if (categoryError) {
        console.warn('Warning: Could not clean categories by timestamp:', categoryError);
      }

      // Limpiar ubicaciones
      const { error: locationError } = await supabase
        .from('locations')
        .delete()
        .like('id', `%-${timestamp}`);

      if (locationError) {
        console.warn('Warning: Could not clean locations by timestamp:', locationError);
      }

      console.log(`✅ Cleanup completed for timestamp: ${timestamp}`);
    } catch (error) {
      console.error(`❌ Error cleaning up data for timestamp ${timestamp}:`, error);
      throw error;
    }
  }

  /**
   * Verifica que la base de datos esté limpia
   */
  async verifyCleanup() {
    try {
      // Verificar que no hay datos de prueba en inventario
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select('sku')
        .or('sku.like.TEST-%,sku.like.%Test%');

      // Verificar que no hay categorías de prueba
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .like('name', '%Test%');

      // Verificar que no hay ubicaciones de prueba
      const { data: locationData } = await supabase
        .from('locations')
        .select('name')
        .like('name', '%Test%');

      const isClean = (
        (!inventoryData || inventoryData.length === 0) &&
        (!categoryData || categoryData.length === 0) &&
        (!locationData || locationData.length === 0)
      );

      if (isClean) {
        console.log('✅ Database cleanup verification passed');
      } else {
        console.warn('⚠️ Database cleanup verification failed - some test data may remain');
        if (inventoryData && inventoryData.length > 0) {
          console.warn('Remaining inventory test data:', inventoryData);
        }
        if (categoryData && categoryData.length > 0) {
          console.warn('Remaining category test data:', categoryData);
        }
        if (locationData && locationData.length > 0) {
          console.warn('Remaining location test data:', locationData);
        }
      }

      return isClean;
    } catch (error) {
      console.error('❌ Error verifying cleanup:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getDatabaseStats() {
    try {
      const [inventoryResult, categoryResult, locationResult, auditResult] = await Promise.all([
        supabase.from('inventory').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('locations').select('id', { count: 'exact', head: true }),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true })
      ]);

      return {
        inventory: inventoryResult.count || 0,
        categories: categoryResult.count || 0,
        locations: locationResult.count || 0,
        auditLogs: auditResult.count || 0
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      return {
        inventory: 0,
        categories: 0,
        locations: 0,
        auditLogs: 0
      };
    }
  }
}

// Crear instancia singleton
const databaseCleanup = new DatabaseCleanup();

// Función principal para limpieza
async function cleanupTestData() {
  await databaseCleanup.cleanupAllTestData();
}

// Función para limpieza por timestamp
async function cleanupByTimestamp(timestamp) {
  await databaseCleanup.cleanupByTimestamp(timestamp);
}

// Función para verificar limpieza
async function verifyCleanup() {
  return await databaseCleanup.verifyCleanup();
}

// Función para obtener estadísticas
async function getDatabaseStats() {
  return await databaseCleanup.getDatabaseStats();
}

// Exportar funciones
module.exports = {
  databaseCleanup,
  cleanupTestData,
  cleanupByTimestamp,
  verifyCleanup,
  getDatabaseStats
};