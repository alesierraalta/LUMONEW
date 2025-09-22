import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para tests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para limpiar datos de prueba
async function cleanupTestData() {
  const timestamp = Date.now();
  
  // Limpiar inventario
  await supabase.from('inventory').delete().like('sku', `TEST-API-%`);
  
  // Limpiar logs de auditoría de tests
  await supabase.from('audit_logs').delete().like('record_id', '%');
  
  // Limpiar categorías de prueba
  await supabase.from('categories').delete().like('name', '%Test API%');
  
  // Limpiar ubicaciones de prueba
  await supabase.from('locations').delete().like('name', '%Test API%');
}

// Helper para crear datos de prueba
async function createTestData() {
  const timestamp = Date.now();
  
  // Crear categoría de prueba
  const { data: category } = await supabase
    .from('categories')
    .insert({
      id: `test-cat-api-${timestamp}`,
      name: 'Test API Category',
      color: '#0000FF'
    })
    .select()
    .single();

  // Crear ubicación de prueba
  const { data: location } = await supabase
    .from('locations')
    .insert({
      id: `test-loc-api-${timestamp}`,
      name: 'Test API Location',
      address: 'Test API Address'
    })
    .select()
    .single();

  return { category, location, timestamp };
}

test.describe('Inventory API - Database Tests', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('should create inventory item via API with database verification', async ({ request }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const itemData = {
      sku: `TEST-API-${timestamp}`,
      name: 'API Test Product',
      category_id: category.id,
      location_id: location.id,
      unit_price: 99.99,
      quantity: 10,
      min_stock: 5,
      max_stock: 50,
      status: 'active',
      images: ['https://example.com/api-test.jpg']
    };

    // Act
    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert API Response
    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.item).toBeDefined();
    expect(result.item.sku).toBe(itemData.sku);
    expect(result.item.name).toBe(itemData.name);

    // Assert Database Verification
    const { data: dbItem, error: dbError } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('sku', itemData.sku)
      .single();

    expect(dbError).toBeNull();
    expect(dbItem).toBeDefined();
    expect(dbItem.sku).toBe(itemData.sku);
    expect(dbItem.name).toBe(itemData.name);
    expect(dbItem.quantity).toBe(itemData.quantity);
    expect(dbItem.unit_price).toBe(itemData.unit_price);
    expect(dbItem.images).toEqual(itemData.images);
    expect(dbItem.categories.name).toBe('Test API Category');
    expect(dbItem.locations.name).toBe('Test API Location');

    // Assert Audit Log
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', dbItem.id)
      .eq('operation', 'INSERT');

    expect(auditError).toBeNull();
    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('INSERT');
    expect(auditLogs[0].table_name).toBe('inventory');
  });

  test('should handle bulk creation via API with database verification', async ({ request }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const itemsData = [
      {
        sku: `TEST-API-BULK-1-${timestamp}`,
        name: 'API Bulk Test Product 1',
        category_id: category.id,
        location_id: location.id,
        unit_price: 29.99,
        quantity: 10,
        min_stock: 2,
        max_stock: 20,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-API-BULK-2-${timestamp}`,
        name: 'API Bulk Test Product 2',
        category_id: category.id,
        location_id: location.id,
        unit_price: 39.99,
        quantity: 15,
        min_stock: 5,
        max_stock: 30,
        status: 'active',
        images: []
      }
    ];

    // Act
    const response = await request.post('/api/inventory/items', {
      data: itemsData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert API Response
    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.items).toHaveLength(2);

    // Assert Database Verification
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .in('sku', itemsData.map(item => item.sku))
      .order('sku');

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(2);
    
    // Verificar cada item
    dbItems.forEach((item, index) => {
      expect(item.sku).toBe(itemsData[index].sku);
      expect(item.name).toBe(itemsData[index].name);
      expect(item.quantity).toBe(itemsData[index].quantity);
      expect(item.unit_price).toBe(itemsData[index].unit_price);
    });

    // Assert Audit Logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .in('record_id', dbItems.map(item => item.id))
      .eq('operation', 'INSERT');

    expect(auditError).toBeNull();
    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBe(2);
    expect(auditLogs.every(log => log.operation === 'INSERT')).toBe(true);
  });

  test('should handle image upload via API with database verification', async ({ request }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    // Crear un archivo de imagen de prueba
    const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageContent, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-api-image.png');

    // Act
    const uploadResponse = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Assert Upload Response
    expect(uploadResponse.status()).toBe(200);
    const uploadResult = await uploadResponse.json();
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.imageUrl).toBeDefined();
    expect(uploadResult.fileName).toBeDefined();

    // Act: Create item with uploaded image
    const itemData = {
      sku: `TEST-API-IMG-${timestamp}`,
      name: 'API Test Product with Image',
      category_id: category.id,
      location_id: location.id,
      unit_price: 149.99,
      quantity: 5,
      min_stock: 2,
      max_stock: 20,
      status: 'active',
      images: [uploadResult.imageUrl]
    };

    const createResponse = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert Item Creation
    expect(createResponse.status()).toBe(201);
    const createResult = await createResponse.json();
    expect(createResult.success).toBe(true);
    expect(createResult.item.images).toContain(uploadResult.imageUrl);

    // Assert Database Verification
    const { data: dbItem, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', itemData.sku)
      .single();

    expect(dbError).toBeNull();
    expect(dbItem).toBeDefined();
    expect(dbItem.images).toContain(uploadResult.imageUrl);
  });

  test('should handle duplicate SKU error via API', async ({ request }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const itemData = {
      sku: `TEST-API-DUPLICATE-${timestamp}`,
      name: 'API Test Product',
      category_id: category.id,
      location_id: location.id,
      unit_price: 99.99,
      quantity: 10,
      status: 'active',
      images: []
    };

    // Act: Create first item
    const firstResponse = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(firstResponse.status()).toBe(201);

    // Act: Try to create duplicate
    const duplicateResponse = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert
    expect(duplicateResponse.status()).toBe(409);
    const duplicateResult = await duplicateResponse.json();
    expect(duplicateResult.error).toBe('SKU already exists');

    // Assert Database: Only one item should exist
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', itemData.sku);

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(1);
  });

  test('should handle missing required fields via API', async ({ request }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const invalidItemData = {
      // Missing required sku and name
      category_id: category.id,
      location_id: location.id,
      unit_price: 99.99,
      quantity: 10
    };

    // Act
    const response = await request.post('/api/inventory/items', {
      data: invalidItemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('Missing required fields');
    expect(result.required).toContain('sku');
    expect(result.required).toContain('name');

    // Assert Database: No item should be created
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('category_id', category.id);

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(0);
  });

  test('should handle invalid category ID via API', async ({ request }) => {
    // Arrange
    const { location, timestamp } = await createTestData();
    
    const itemData = {
      sku: `TEST-API-INVALID-CAT-${timestamp}`,
      name: 'API Test Product',
      category_id: 'invalid-category-id',
      location_id: location.id,
      unit_price: 99.99,
      quantity: 10,
      status: 'active',
      images: []
    };

    // Act
    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('Invalid category or location');

    // Assert Database: No item should be created
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', itemData.sku);

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(0);
  });

  test('should handle invalid location ID via API', async ({ request }) => {
    // Arrange
    const { category, timestamp } = await createTestData();
    
    const itemData = {
      sku: `TEST-API-INVALID-LOC-${timestamp}`,
      name: 'API Test Product',
      category_id: category.id,
      location_id: 'invalid-location-id',
      unit_price: 99.99,
      quantity: 10,
      status: 'active',
      images: []
    };

    // Act
    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('Invalid category or location');

    // Assert Database: No item should be created
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('sku', itemData.sku);

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(0);
  });

  test('should handle file upload errors via API', async ({ request }) => {
    // Arrange: Create invalid file
    const formData = new FormData();
    const blob = new Blob(['invalid content'], { type: 'text/plain' });
    formData.append('image', blob, 'test.txt');

    // Act
    const response = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  });

  test('should handle large file upload via API', async ({ request }) => {
    // Arrange: Create large file (6MB)
    const largeContent = 'x'.repeat(6 * 1024 * 1024);
    const formData = new FormData();
    const blob = new Blob([largeContent], { type: 'image/png' });
    formData.append('image', blob, 'large-image.png');

    // Act
    const response = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Assert
    expect(response.status()).toBe(400);
    const result = await response.json();
    expect(result.error).toBe('File too large. Maximum size is 5MB.');
  });
});