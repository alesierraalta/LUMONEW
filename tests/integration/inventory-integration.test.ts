import { describe, test, expect, beforeEach, afterEach } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase para tests
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper para limpiar datos de prueba
async function cleanupTestData() {
  const timestamp = Date.now();
  
  // Limpiar inventario
  await supabase.from('inventory').delete().like('sku', `TEST-INTEGRATION-%`);
  
  // Limpiar logs de auditoría de tests
  await supabase.from('audit_logs').delete().like('record_id', '%');
  
  // Limpiar categorías de prueba
  await supabase.from('categories').delete().like('name', '%Test Integration%');
  
  // Limpiar ubicaciones de prueba
  await supabase.from('locations').delete().like('name', '%Test Integration%');
}

// Helper para crear datos de prueba
async function createTestData() {
  const timestamp = Date.now();
  
  // Crear categoría de prueba
  const { data: category } = await supabase
    .from('categories')
    .insert({
      id: `test-cat-${timestamp}`,
      name: 'Test Integration Category',
      color: '#00FF00'
    })
    .select()
    .single();

  // Crear ubicación de prueba
  const { data: location } = await supabase
    .from('locations')
    .insert({
      id: `test-loc-${timestamp}`,
      name: 'Test Integration Location',
      address: 'Test Integration Address'
    })
    .select()
    .single();

  return { category, location, timestamp };
}

describe('Inventory Integration Tests', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  test('should complete full inventory lifecycle', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const testItem = {
      sku: `TEST-INTEGRATION-${timestamp}`,
      name: 'Integration Test Item',
      category_id: category.id,
      location_id: location.id,
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_price: 299.99,
      status: 'active',
      images: ['https://example.com/integration-test.jpg']
    };

    // Act 1: Create item
    const { data: createdItem, error: createError } = await supabase
      .from('inventory')
      .insert([testItem])
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .single();

    // Assert 1: Item created successfully
    expect(createError).toBeNull();
    expect(createdItem).toBeDefined();
    expect(createdItem.sku).toBe(testItem.sku);
    expect(createdItem.name).toBe(testItem.name);
    expect(createdItem.categories.name).toBe('Test Integration Category');
    expect(createdItem.locations.name).toBe('Test Integration Location');

    // Act 2: Update item
    const updates = {
      name: 'Updated Integration Test Item',
      quantity: 150,
      unit_price: 349.99
    };
    
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', createdItem.id)
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .single();

    // Assert 2: Item updated successfully
    expect(updateError).toBeNull();
    expect(updatedItem.name).toBe(updates.name);
    expect(updatedItem.quantity).toBe(updates.quantity);
    expect(updatedItem.unit_price).toBe(updates.unit_price);

    // Act 3: Query item
    const { data: queriedItem, error: queryError } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('id', createdItem.id)
      .single();

    // Assert 3: Item queried successfully
    expect(queryError).toBeNull();
    expect(queriedItem).toBeDefined();
    expect(queriedItem.id).toBe(createdItem.id);

    // Act 4: Delete item
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', createdItem.id);

    // Assert 4: Item deleted successfully
    expect(deleteError).toBeNull();

    // Act 5: Verify deletion
    const { data: deletedItem, error: verifyError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem.id)
      .single();

    // Assert 5: Item no longer exists
    expect(verifyError).not.toBeNull();
    expect(deletedItem).toBeNull();
  });

  test('should handle inventory with images', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const testItem = {
      sku: `TEST-IMAGES-${timestamp}`,
      name: 'Test Item with Images',
      category_id: category.id,
      location_id: location.id,
      quantity: 50,
      min_stock: 5,
      max_stock: 100,
      unit_price: 199.99,
      status: 'active',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ]
    };

    // Act
    const { data: createdItem, error } = await supabase
      .from('inventory')
      .insert([testItem])
      .select('*')
      .single();

    // Assert
    expect(error).toBeNull();
    expect(createdItem).toBeDefined();
    expect(createdItem.images).toBeDefined();
    expect(Array.isArray(createdItem.images)).toBe(true);
    expect(createdItem.images.length).toBe(3);
    expect(createdItem.images[0]).toBe('https://example.com/image1.jpg');
    expect(createdItem.images[1]).toBe('https://example.com/image2.jpg');
    expect(createdItem.images[2]).toBe('https://example.com/image3.jpg');
  });

  test('should handle bulk operations', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const bulkItems = [
      {
        sku: `TEST-BULK-1-${timestamp}`,
        name: 'Bulk Test Item 1',
        category_id: category.id,
        location_id: location.id,
        quantity: 10,
        min_stock: 2,
        max_stock: 20,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-BULK-2-${timestamp}`,
        name: 'Bulk Test Item 2',
        category_id: category.id,
        location_id: location.id,
        quantity: 20,
        min_stock: 5,
        max_stock: 40,
        unit_price: 149.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-BULK-3-${timestamp}`,
        name: 'Bulk Test Item 3',
        category_id: category.id,
        location_id: location.id,
        quantity: 30,
        min_stock: 10,
        max_stock: 60,
        unit_price: 199.99,
        status: 'active',
        images: []
      }
    ];

    // Act
    const { data: createdItems, error } = await supabase
      .from('inventory')
      .insert(bulkItems)
      .select('*');

    // Assert
    expect(error).toBeNull();
    expect(createdItems).toBeDefined();
    expect(createdItems.length).toBe(3);
    
    // Verificar cada item
    createdItems.forEach((item, index) => {
      expect(item.sku).toBe(bulkItems[index].sku);
      expect(item.name).toBe(bulkItems[index].name);
      expect(item.quantity).toBe(bulkItems[index].quantity);
    });

    // Act: Bulk update
    const { data: updatedItems, error: updateError } = await supabase
      .from('inventory')
      .update({ status: 'inactive' })
      .in('sku', bulkItems.map(item => item.sku))
      .select('*');

    // Assert: Bulk update successful
    expect(updateError).toBeNull();
    expect(updatedItems).toBeDefined();
    expect(updatedItems.length).toBe(3);
    updatedItems.forEach(item => {
      expect(item.status).toBe('inactive');
    });

    // Act: Bulk delete
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .in('sku', bulkItems.map(item => item.sku));

    // Assert: Bulk delete successful
    expect(deleteError).toBeNull();
  });

  test('should handle inventory filtering and search', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const testItems = [
      {
        sku: `TEST-SEARCH-1-${timestamp}`,
        name: 'Laptop Dell Inspiron',
        category_id: category.id,
        location_id: location.id,
        quantity: 5,
        min_stock: 2,
        max_stock: 10,
        unit_price: 999.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-SEARCH-2-${timestamp}`,
        name: 'Dell Monitor 24"',
        category_id: category.id,
        location_id: location.id,
        quantity: 8,
        min_stock: 3,
        max_stock: 15,
        unit_price: 299.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-SEARCH-3-${timestamp}`,
        name: 'HP Printer Laser',
        category_id: category.id,
        location_id: location.id,
        quantity: 2,
        min_stock: 1,
        max_stock: 5,
        unit_price: 199.99,
        status: 'active',
        images: []
      }
    ];

    await supabase.from('inventory').insert(testItems);

    // Act & Assert: Search by name
    const { data: searchResults, error: searchError } = await supabase
      .from('inventory')
      .select('*')
      .ilike('name', '%Dell%');

    expect(searchError).toBeNull();
    expect(searchResults).toBeDefined();
    expect(searchResults.length).toBe(2);
    expect(searchResults.every(item => item.name.includes('Dell'))).toBe(true);

    // Act & Assert: Filter by quantity range
    const { data: quantityResults, error: quantityError } = await supabase
      .from('inventory')
      .select('*')
      .gte('quantity', 5)
      .lte('quantity', 10);

    expect(quantityError).toBeNull();
    expect(quantityResults).toBeDefined();
    expect(quantityResults.length).toBe(2);
    expect(quantityResults.every(item => item.quantity >= 5 && item.quantity <= 10)).toBe(true);

    // Act & Assert: Filter by price range
    const { data: priceResults, error: priceError } = await supabase
      .from('inventory')
      .select('*')
      .gte('unit_price', 200)
      .lte('unit_price', 1000);

    expect(priceError).toBeNull();
    expect(priceResults).toBeDefined();
    expect(priceResults.length).toBe(2);
    expect(priceResults.every(item => item.unit_price >= 200 && item.unit_price <= 1000)).toBe(true);
  });

  test('should handle low stock detection', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const testItems = [
      {
        sku: `TEST-LOW-1-${timestamp}`,
        name: 'Low Stock Item 1',
        category_id: category.id,
        location_id: location.id,
        quantity: 2,
        min_stock: 5,
        max_stock: 20,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-LOW-2-${timestamp}`,
        name: 'Low Stock Item 2',
        category_id: category.id,
        location_id: location.id,
        quantity: 1,
        min_stock: 3,
        max_stock: 15,
        unit_price: 149.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-NORMAL-${timestamp}`,
        name: 'Normal Stock Item',
        category_id: category.id,
        location_id: location.id,
        quantity: 10,
        min_stock: 5,
        max_stock: 20,
        unit_price: 199.99,
        status: 'active',
        images: []
      }
    ];

    await supabase.from('inventory').insert(testItems);

    // Act: Query low stock items
    const { data: lowStockItems, error } = await supabase
      .from('inventory')
      .select('*')
      .filter('quantity', 'lte', 'min_stock')
      .eq('status', 'active');

    // Assert
    expect(error).toBeNull();
    expect(lowStockItems).toBeDefined();
    expect(lowStockItems.length).toBe(2);
    expect(lowStockItems.every(item => item.quantity <= item.min_stock)).toBe(true);
    
    const lowStockSkus = lowStockItems.map(item => item.sku);
    expect(lowStockSkus).toContain(`TEST-LOW-1-${timestamp}`);
    expect(lowStockSkus).toContain(`TEST-LOW-2-${timestamp}`);
    expect(lowStockSkus).not.toContain(`TEST-NORMAL-${timestamp}`);
  });

  test('should handle out of stock detection', async () => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    const testItems = [
      {
        sku: `TEST-OUT-1-${timestamp}`,
        name: 'Out of Stock Item 1',
        category_id: category.id,
        location_id: location.id,
        quantity: 0,
        min_stock: 5,
        max_stock: 20,
        unit_price: 99.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-OUT-2-${timestamp}`,
        name: 'Out of Stock Item 2',
        category_id: category.id,
        location_id: location.id,
        quantity: 0,
        min_stock: 3,
        max_stock: 15,
        unit_price: 149.99,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-IN-STOCK-${timestamp}`,
        name: 'In Stock Item',
        category_id: category.id,
        location_id: location.id,
        quantity: 10,
        min_stock: 5,
        max_stock: 20,
        unit_price: 199.99,
        status: 'active',
        images: []
      }
    ];

    await supabase.from('inventory').insert(testItems);

    // Act: Query out of stock items
    const { data: outOfStockItems, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('quantity', 0)
      .eq('status', 'active');

    // Assert
    expect(error).toBeNull();
    expect(outOfStockItems).toBeDefined();
    expect(outOfStockItems.length).toBe(2);
    expect(outOfStockItems.every(item => item.quantity === 0)).toBe(true);
    
    const outOfStockSkus = outOfStockItems.map(item => item.sku);
    expect(outOfStockSkus).toContain(`TEST-OUT-1-${timestamp}`);
    expect(outOfStockSkus).toContain(`TEST-OUT-2-${timestamp}`);
    expect(outOfStockSkus).not.toContain(`TEST-IN-STOCK-${timestamp}`);
  });
});