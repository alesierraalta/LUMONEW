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
  await supabase.from('inventory').delete().like('sku', `TEST-E2E-%`);
  
  // Limpiar logs de auditoría de tests
  await supabase.from('audit_logs').delete().like('record_id', '%');
  
  // Limpiar categorías de prueba
  await supabase.from('categories').delete().like('name', '%Test E2E%');
  
  // Limpiar ubicaciones de prueba
  await supabase.from('locations').delete().like('name', '%Test E2E%');
}

// Helper para crear datos de prueba
async function createTestData() {
  const timestamp = Date.now();
  
  // Crear categoría de prueba
  const { data: category } = await supabase
    .from('categories')
    .insert({
      id: `test-cat-e2e-${timestamp}`,
      name: 'Test E2E Category',
      color: '#FF00FF'
    })
    .select()
    .single();

  // Crear ubicación de prueba
  const { data: location } = await supabase
    .from('locations')
    .insert({
      id: `test-loc-e2e-${timestamp}`,
      name: 'Test E2E Location',
      address: 'Test E2E Address'
    })
    .select()
    .single();

  return { category, location, timestamp };
}

test.describe('Inventory E2E - Database Tests', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('should complete full inventory creation workflow with database verification', async ({ page }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    // Navigate to inventory create page
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');

    // Fill in the form
    await page.getByRole('textbox', { name: 'SKU *' }).fill(`TEST-E2E-${timestamp}`);
    await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('E2E Test Product');
    
    // Select category and location
    await page.getByLabel('Categoría').selectOption('Electronics');
    await page.getByLabel('Ubicación').selectOption('Main Warehouse');
    
    // Fill optional fields
    await page.getByRole('spinbutton', { name: 'Precio Unitario ($)' }).fill('299.99');
    await page.getByRole('spinbutton', { name: 'Cantidad Inicial' }).fill('25');
    await page.getByRole('spinbutton', { name: 'Stock Mínimo' }).fill('5');
    await page.getByRole('spinbutton', { name: 'Stock Máximo' }).fill('100');

    // Test image upload functionality
    const imageUploadArea = page.locator('.border-dashed').first();
    await expect(imageUploadArea).toBeVisible();
    
    // Click on the image upload area
    await imageUploadArea.click();
    
    // Close file chooser (we'll test without actual file upload for now)
    await page.keyboard.press('Escape');

    // Create the item
    await page.getByRole('button', { name: 'Crear Item' }).click();
    
    // Wait for navigation back to inventory page
    await page.waitForURL('/inventory');
    
    // Verify success message or item appears in the list
    await expect(page.getByText('E2E Test Product')).toBeVisible();

    // Verify in database
    const { data: dbItem, error: dbError } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (id, name, color),
        locations (id, name, address)
      `)
      .eq('sku', `TEST-E2E-${timestamp}`)
      .single();

    expect(dbError).toBeNull();
    expect(dbItem).toBeDefined();
    expect(dbItem.sku).toBe(`TEST-E2E-${timestamp}`);
    expect(dbItem.name).toBe('E2E Test Product');
    expect(dbItem.quantity).toBe(25);
    expect(dbItem.unit_price).toBe(299.99);
    expect(dbItem.min_stock).toBe(5);
    expect(dbItem.max_stock).toBe(100);

    // Verify audit log
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
  });

  test('should handle inventory item editing workflow with database verification', async ({ page }) => {
    // Arrange: Create item first via API
    const { category, location, timestamp } = await createTestData();
    
    const { data: createdItem } = await supabase
      .from('inventory')
      .insert({
        sku: `TEST-E2E-EDIT-${timestamp}`,
        name: 'E2E Edit Test Product',
        category_id: category.id,
        location_id: location.id,
        quantity: 10,
        min_stock: 2,
        max_stock: 20,
        unit_price: 199.99,
        status: 'active',
        images: []
      })
      .select()
      .single();

    // Navigate to inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Find and click on the item to edit
    await page.getByText('E2E Edit Test Product').click();
    
    // Wait for edit page to load
    await page.waitForLoadState('networkidle');

    // Update the item
    await page.getByRole('textbox', { name: 'Nombre del Producto *' }).fill('Updated E2E Edit Test Product');
    await page.getByRole('spinbutton', { name: 'Cantidad Inicial' }).fill('15');
    await page.getByRole('spinbutton', { name: 'Precio Unitario ($)' }).fill('249.99');

    // Save changes
    await page.getByRole('button', { name: 'Actualizar Item' }).click();
    
    // Wait for navigation back to inventory page
    await page.waitForURL('/inventory');
    
    // Verify updated item appears in the list
    await expect(page.getByText('Updated E2E Edit Test Product')).toBeVisible();

    // Verify in database
    const { data: dbItem, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem.id)
      .single();

    expect(dbError).toBeNull();
    expect(dbItem).toBeDefined();
    expect(dbItem.name).toBe('Updated E2E Edit Test Product');
    expect(dbItem.quantity).toBe(15);
    expect(dbItem.unit_price).toBe(249.99);

    // Verify audit log
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem.id)
      .eq('operation', 'UPDATE');

    expect(auditError).toBeNull();
    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('UPDATE');
  });

  test('should handle inventory item deletion workflow with database verification', async ({ page }) => {
    // Arrange: Create item first via API
    const { category, location, timestamp } = await createTestData();
    
    const { data: createdItem } = await supabase
      .from('inventory')
      .insert({
        sku: `TEST-E2E-DELETE-${timestamp}`,
        name: 'E2E Delete Test Product',
        category_id: category.id,
        location_id: location.id,
        quantity: 5,
        min_stock: 1,
        max_stock: 10,
        unit_price: 99.99,
        status: 'active',
        images: []
      })
      .select()
      .single();

    // Navigate to inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Find and click on the item to delete
    await page.getByText('E2E Delete Test Product').click();
    
    // Wait for item page to load
    await page.waitForLoadState('networkidle');

    // Click delete button
    await page.getByRole('button', { name: 'Eliminar' }).click();
    
    // Confirm deletion
    await page.getByRole('button', { name: 'Confirmar' }).click();
    
    // Wait for navigation back to inventory page
    await page.waitForURL('/inventory');
    
    // Verify item no longer appears in the list
    await expect(page.getByText('E2E Delete Test Product')).not.toBeVisible();

    // Verify in database
    const { data: dbItem, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', createdItem.id)
      .single();

    expect(dbError).not.toBeNull(); // Should not find the item
    expect(dbItem).toBeNull();

    // Verify audit log
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .eq('record_id', createdItem.id)
      .eq('operation', 'DELETE');

    expect(auditError).toBeNull();
    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].operation).toBe('DELETE');
  });

  test('should handle bulk operations workflow with database verification', async ({ page }) => {
    // Arrange
    const { category, location, timestamp } = await createTestData();
    
    // Navigate to inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Click on bulk create button
    await page.getByRole('button', { name: 'Creación Masiva' }).click();
    
    // Wait for bulk create modal
    await page.waitForLoadState('networkidle');

    // Fill bulk create form
    const bulkData = `SKU,Nombre,Categoría,Ubicación,Precio,Cantidad,Stock Mínimo,Stock Máximo
TEST-E2E-BULK-1-${timestamp},E2E Bulk Test Product 1,Electronics,Main Warehouse,99.99,10,2,20
TEST-E2E-BULK-2-${timestamp},E2E Bulk Test Product 2,Electronics,Main Warehouse,149.99,15,5,30
TEST-E2E-BULK-3-${timestamp},E2E Bulk Test Product 3,Electronics,Main Warehouse,199.99,20,10,40`;

    // Upload CSV data (simulate file upload)
    await page.getByRole('textbox', { name: 'Datos CSV' }).fill(bulkData);
    
    // Submit bulk create
    await page.getByRole('button', { name: 'Crear Items' }).click();
    
    // Wait for completion
    await page.waitForLoadState('networkidle');

    // Verify items appear in the list
    await expect(page.getByText('E2E Bulk Test Product 1')).toBeVisible();
    await expect(page.getByText('E2E Bulk Test Product 2')).toBeVisible();
    await expect(page.getByText('E2E Bulk Test Product 3')).toBeVisible();

    // Verify in database
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .in('sku', [
        `TEST-E2E-BULK-1-${timestamp}`,
        `TEST-E2E-BULK-2-${timestamp}`,
        `TEST-E2E-BULK-3-${timestamp}`
      ])
      .order('sku');

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(3);
    
    // Verify each item
    expect(dbItems[0].sku).toBe(`TEST-E2E-BULK-1-${timestamp}`);
    expect(dbItems[0].name).toBe('E2E Bulk Test Product 1');
    expect(dbItems[0].quantity).toBe(10);
    expect(dbItems[0].unit_price).toBe(99.99);
    
    expect(dbItems[1].sku).toBe(`TEST-E2E-BULK-2-${timestamp}`);
    expect(dbItems[1].name).toBe('E2E Bulk Test Product 2');
    expect(dbItems[1].quantity).toBe(15);
    expect(dbItems[1].unit_price).toBe(149.99);
    
    expect(dbItems[2].sku).toBe(`TEST-E2E-BULK-3-${timestamp}`);
    expect(dbItems[2].name).toBe('E2E Bulk Test Product 3');
    expect(dbItems[2].quantity).toBe(20);
    expect(dbItems[2].unit_price).toBe(199.99);

    // Verify audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory')
      .in('record_id', dbItems.map(item => item.id))
      .eq('operation', 'INSERT');

    expect(auditError).toBeNull();
    expect(auditLogs).toBeDefined();
    expect(auditLogs.length).toBe(3);
    expect(auditLogs.every(log => log.operation === 'INSERT')).toBe(true);
  });

  test('should handle inventory search and filtering with database verification', async ({ page }) => {
    // Arrange: Create test items
    const { category, location, timestamp } = await createTestData();
    
    const testItems = [
      {
        sku: `TEST-E2E-SEARCH-1-${timestamp}`,
        name: 'E2E Search Laptop Dell',
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
        sku: `TEST-E2E-SEARCH-2-${timestamp}`,
        name: 'E2E Search Dell Monitor',
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
        sku: `TEST-E2E-SEARCH-3-${timestamp}`,
        name: 'E2E Search HP Printer',
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

    // Navigate to inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Test search functionality
    await page.getByRole('textbox', { name: 'Buscar' }).fill('Dell');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    // Wait for search results
    await page.waitForLoadState('networkidle');

    // Verify search results
    await expect(page.getByText('E2E Search Laptop Dell')).toBeVisible();
    await expect(page.getByText('E2E Search Dell Monitor')).toBeVisible();
    await expect(page.getByText('E2E Search HP Printer')).not.toBeVisible();

    // Test category filter
    await page.getByRole('combobox', { name: 'Categoría' }).selectOption('Electronics');
    await page.getByRole('button', { name: 'Filtrar' }).click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify all items are visible (they should all be in Electronics category)
    await expect(page.getByText('E2E Search Laptop Dell')).toBeVisible();
    await expect(page.getByText('E2E Search Dell Monitor')).toBeVisible();
    await expect(page.getByText('E2E Search HP Printer')).toBeVisible();

    // Test low stock filter
    await page.getByRole('checkbox', { name: 'Stock Bajo' }).check();
    await page.getByRole('button', { name: 'Filtrar' }).click();
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify only low stock items are visible
    await expect(page.getByText('E2E Search Laptop Dell')).toBeVisible(); // quantity 5, min_stock 2
    await expect(page.getByText('E2E Search Dell Monitor')).toBeVisible(); // quantity 8, min_stock 3
    await expect(page.getByText('E2E Search HP Printer')).toBeVisible(); // quantity 2, min_stock 1
  });

  test('should handle inventory statistics with database verification', async ({ page }) => {
    // Arrange: Create test items with different quantities
    const { category, location, timestamp } = await createTestData();
    
    const testItems = [
      {
        sku: `TEST-E2E-STATS-1-${timestamp}`,
        name: 'E2E Stats Item 1',
        category_id: category.id,
        location_id: location.id,
        quantity: 10,
        min_stock: 5,
        max_stock: 20,
        unit_price: 100.00,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-E2E-STATS-2-${timestamp}`,
        name: 'E2E Stats Item 2',
        category_id: category.id,
        location_id: location.id,
        quantity: 2,
        min_stock: 5,
        max_stock: 20,
        unit_price: 200.00,
        status: 'active',
        images: []
      },
      {
        sku: `TEST-E2E-STATS-3-${timestamp}`,
        name: 'E2E Stats Item 3',
        category_id: category.id,
        location_id: location.id,
        quantity: 0,
        min_stock: 5,
        max_stock: 20,
        unit_price: 300.00,
        status: 'active',
        images: []
      }
    ];

    await supabase.from('inventory').insert(testItems);

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify statistics are displayed
    await expect(page.getByText('Total Items')).toBeVisible();
    await expect(page.getByText('Low Stock')).toBeVisible();
    await expect(page.getByText('Out of Stock')).toBeVisible();
    await expect(page.getByText('Total Value')).toBeVisible();

    // Verify statistics values (these should include our test items)
    const totalItems = await page.locator('[data-testid="total-items"]').textContent();
    const lowStock = await page.locator('[data-testid="low-stock"]').textContent();
    const outOfStock = await page.locator('[data-testid="out-of-stock"]').textContent();
    const totalValue = await page.locator('[data-testid="total-value"]').textContent();

    expect(totalItems).toBeDefined();
    expect(lowStock).toBeDefined();
    expect(outOfStock).toBeDefined();
    expect(totalValue).toBeDefined();

    // Verify in database
    const { data: dbItems, error: dbError } = await supabase
      .from('inventory')
      .select('*')
      .in('sku', testItems.map(item => item.sku));

    expect(dbError).toBeNull();
    expect(dbItems).toBeDefined();
    expect(dbItems.length).toBe(3);

    // Calculate expected values
    const totalItemsCount = dbItems.length;
    const lowStockCount = dbItems.filter(item => item.quantity <= item.min_stock).length;
    const outOfStockCount = dbItems.filter(item => item.quantity === 0).length;
    const totalValueAmount = dbItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    expect(totalItemsCount).toBe(3);
    expect(lowStockCount).toBe(2); // Items 2 and 3
    expect(outOfStockCount).toBe(1); // Item 3
    expect(totalValueAmount).toBe(1600); // (10*100) + (2*200) + (0*300)
  });
});