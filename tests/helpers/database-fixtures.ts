/**
 * Fixtures de base de datos para tests
 * Proporciona utilidades y datos de prueba reutilizables
 */

import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { databaseCleanup } from './database-cleanup';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tipos para fixtures
type DatabaseFixtures = {
  supabase: typeof supabase;
  testData: {
    category: any;
    location: any;
    timestamp: number;
  };
  cleanup: () => Promise<void>;
};

// Fixture de base de datos
export const test = base.extend<DatabaseFixtures>({
  // Cliente de Supabase
  supabase: async ({}, use) => {
    await use(supabase);
  },

  // Datos de prueba
  testData: async ({}, use) => {
    const timestamp = Date.now();
    
    // Crear categoría de prueba
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        id: `test-cat-${timestamp}`,
        name: `Test Category ${timestamp}`,
        color: '#FF0000'
      })
      .select()
      .single();

    if (categoryError) {
      throw new Error(`Failed to create test category: ${categoryError.message}`);
    }

    // Crear ubicación de prueba
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert({
        id: `test-loc-${timestamp}`,
        name: `Test Location ${timestamp}`,
        address: `Test Address ${timestamp}`
      })
      .select()
      .single();

    if (locationError) {
      throw new Error(`Failed to create test location: ${locationError.message}`);
    }

    const testData = {
      category,
      location,
      timestamp
    };

    await use(testData);

    // Limpiar datos de prueba después del test
    await databaseCleanup.cleanupByTimestamp(timestamp);
  },

  // Función de limpieza
  cleanup: async ({}, use) => {
    await use(async () => {
      await databaseCleanup.cleanupAllTestData();
    });
  }
});

// Helper para crear datos de prueba
export async function createTestData() {
  const timestamp = Date.now();
  
  // Crear categoría de prueba
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .insert({
      id: `test-cat-${timestamp}`,
      name: `Test Category ${timestamp}`,
      color: '#FF0000'
    })
    .select()
    .single();

  if (categoryError) {
    throw new Error(`Failed to create test category: ${categoryError.message}`);
  }

  // Crear ubicación de prueba
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .insert({
      id: `test-loc-${timestamp}`,
      name: `Test Location ${timestamp}`,
      address: `Test Address ${timestamp}`
    })
    .select()
    .single();

  if (locationError) {
    throw new Error(`Failed to create test location: ${locationError.message}`);
  }

  return {
    category,
    location,
    timestamp
  };
}

// Helper para limpiar datos de prueba
export async function cleanupTestData(timestamp?: number) {
  if (timestamp) {
    await databaseCleanup.cleanupByTimestamp(timestamp);
  } else {
    await databaseCleanup.cleanupAllTestData();
  }
}

// Helper para verificar que un item existe en la base de datos
export async function verifyItemExists(sku: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('sku', sku)
    .single();

  if (error) {
    throw new Error(`Item with SKU ${sku} not found: ${error.message}`);
  }

  return data;
}

// Helper para verificar que un item no existe en la base de datos
export async function verifyItemNotExists(sku: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('sku', sku)
    .single();

  if (data) {
    throw new Error(`Item with SKU ${sku} should not exist but was found`);
  }

  return true;
}

// Helper para verificar logs de auditoría
export async function verifyAuditLog(recordId: string, operation: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('record_id', recordId)
    .eq('operation', operation)
    .single();

  if (error) {
    throw new Error(`Audit log not found for record ${recordId} with operation ${operation}: ${error.message}`);
  }

  return data;
}

// Helper para crear un item de inventario de prueba
export async function createTestInventoryItem(testData: any, overrides: any = {}) {
  const defaultItem = {
    sku: `TEST-${testData.timestamp}`,
    name: `Test Item ${testData.timestamp}`,
    category_id: testData.category.id,
    location_id: testData.location.id,
    quantity: 10,
    min_stock: 5,
    max_stock: 50,
    unit_price: 99.99,
    status: 'active',
    images: []
  };

  const itemData = { ...defaultItem, ...overrides };

  const { data, error } = await supabase
    .from('inventory')
    .insert([itemData])
    .select(`
      *,
      categories (id, name, color),
      locations (id, name, address)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create test inventory item: ${error.message}`);
  }

  return data;
}

// Helper para obtener estadísticas de la base de datos
export async function getDatabaseStats() {
  return await databaseCleanup.getDatabaseStats();
}

// Helper para verificar que la base de datos está limpia
export async function verifyDatabaseClean() {
  return await databaseCleanup.verifyCleanup();
}

export { expect } from '@playwright/test';