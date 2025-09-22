import { describe, test, expect, beforeEach, afterEach } from '@playwright/test';
import { optimizedInventoryService } from '../../lib/services/optimized-inventory-service';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para tests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de prueba
const testCategory = {
  id: 'test-category-' + Date.now(),
  name: 'Test Category for Unit Tests',
  color: '#FF0000'
};

const testLocation = {
  id: 'test-location-' + Date.now(),
  name: 'Test Location for Unit Tests',
  address: 'Test Address 123'
};

const testItem = {
  sku: 'TEST-UNIT-' + Date.now(),
  name: 'Test Item for Unit Tests',
  category_id: testCategory.id,
  location_id: testLocation.id,
  quantity: 10,
  min_stock: 5,
  max_stock: 50,
  unit_price: 99.99,
  status: 'active' as const,
  images: ['https://example.com/test-image.jpg']
};

describe('Inventory Service - Database Unit Tests', () => {
  beforeEach(async () => {
    // Crear datos de prueba necesarios
    await supabase.from('categories').insert([testCategory]);
    await supabase.from('locations').insert([testLocation]);
  });

  afterEach(async () => {
    // Limpiar datos de prueba
    await supabase.from('inventory').delete().like('sku', 'TEST-UNIT-%');
    await supabase.from('audit_logs').delete().like('record_id', '%');
    await supabase.from('categories').delete().eq('id', testCategory.id);
    await supabase.from('locations').delete().eq('id', testLocation.id);
  });

  test('should create inventory item successfully', async () => {
    // Act
    const result = await optimizedInventoryService.create(testItem);

    // Assert
    expect(result).toBeDefined();
    expect(result.sku).toBe(testItem.sku);
    expect(result.name).toBe(testItem.name);
    expect(result.quantity).toBe(testItem.quantity);
    expect(result.unit_price).toBe(testItem.unit_price);
    expect(result.status).toBe('active');
    expect(result.images).toEqual(testItem.images);

    // Verificar que se creó en la base de datos
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', testItem.sku)
      .single();

    expect(dbItem).toBeDefined();
    expect(dbItem.sku).toBe(testItem.sku);
  });

  test('should create inventory item with audit log', async () => {
    // Act
    const result = await optimizedInventoryService.create(testItem);

    // Assert - Verificar que se creó el log de auditoría
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', result.id)
      .eq('operation', 'INSERT');

    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('INSERT');
    expect(auditLogs[0].table_name).toBe('inventory');
  });

  test('should update inventory item successfully', async () => {
    // Arrange - Crear item primero
    const createdItem = await optimizedInventoryService.create(testItem);

    // Act - Actualizar el item
    const updates = {
      name: 'Updated Test Item',
      quantity: 20,
      unit_price: 149.99
    };
    const result = await optimizedInventoryService.update(createdItem.id, updates);

    // Assert
    expect(result.name).toBe(updates.name);
    expect(result.quantity).toBe(updates.quantity);
    expect(result.unit_price).toBe(updates.unit_price);

    // Verificar en la base de datos
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem.id)
      .single();

    expect(dbItem.name).toBe(updates.name);
    expect(dbItem.quantity).toBe(updates.quantity);
  });

  test('should update inventory item with audit log', async () => {
    // Arrange
    const createdItem = await optimizedInventoryService.create(testItem);

    // Act
    const updates = { quantity: 25 };
    await optimizedInventoryService.update(createdItem.id, updates);

    // Assert - Verificar logs de auditoría
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem.id)
      .eq('operation', 'UPDATE');

    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('UPDATE');
  });

  test('should delete inventory item successfully', async () => {
    // Arrange
    const createdItem = await optimizedInventoryService.create(testItem);

    // Act
    await optimizedInventoryService.delete(createdItem.id);

    // Assert - Verificar que se eliminó de la base de datos
    const { data: dbItem } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem.id)
      .single();

    expect(dbItem).toBeNull();
  });

  test('should delete inventory item with audit log', async () => {
    // Arrange
    const createdItem = await optimizedInventoryService.create(testItem);

    // Act
    await optimizedInventoryService.delete(createdItem.id);

    // Assert - Verificar log de auditoría
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem.id)
      .eq('operation', 'DELETE');

    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('DELETE');
  });

  test('should get inventory item by ID', async () => {
    // Arrange
    const createdItem = await optimizedInventoryService.create(testItem);

    // Act
    const result = await optimizedInventoryService.getById(createdItem.id);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(createdItem.id);
    expect(result.sku).toBe(testItem.sku);
    expect(result.name).toBe(testItem.name);
  });

  test('should get low stock items', async () => {
    // Arrange - Crear items con stock bajo
    const lowStockItem = {
      ...testItem,
      sku: 'TEST-LOW-STOCK-' + Date.now(),
      quantity: 2,
      min_stock: 5
    };
    await optimizedInventoryService.create(lowStockItem);

    // Act
    const result = await optimizedInventoryService.getLowStock();

    // Assert
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    const lowStockFound = result.find(item => item.sku === lowStockItem.sku);
    expect(lowStockFound).toBeDefined();
  });

  test('should handle bulk creation', async () => {
    // Arrange
    const bulkItems = [
      {
        ...testItem,
        sku: 'TEST-BULK-1-' + Date.now(),
        name: 'Bulk Test Item 1'
      },
      {
        ...testItem,
        sku: 'TEST-BULK-2-' + Date.now(),
        name: 'Bulk Test Item 2'
      }
    ];

    // Act
    const result = await optimizedInventoryService.createMany(bulkItems);

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].sku).toBe(bulkItems[0].sku);
    expect(result[1].sku).toBe(bulkItems[1].sku);

    // Verificar en la base de datos
    const { data: dbItems } = await supabase
      .from('inventory')
      .select('*')
      .in('sku', bulkItems.map(item => item.sku));

    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(2);
  });

  test('should handle duplicate SKU error', async () => {
    // Arrange - Crear item primero
    await optimizedInventoryService.create(testItem);

    // Act & Assert
    await expect(optimizedInventoryService.create(testItem))
      .rejects
      .toThrow();
  });

  test('should handle invalid category ID', async () => {
    // Arrange
    const invalidItem = {
      ...testItem,
      category_id: 'invalid-category-id'
    };

    // Act & Assert
    await expect(optimizedInventoryService.create(invalidItem))
      .rejects
      .toThrow();
  });

  test('should handle invalid location ID', async () => {
    // Arrange
    const invalidItem = {
      ...testItem,
      location_id: 'invalid-location-id'
    };

    // Act & Assert
    await expect(optimizedInventoryService.create(invalidItem))
      .rejects
      .toThrow();
  });
});