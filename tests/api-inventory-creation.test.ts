import { test, expect } from '@playwright/test';

test.describe('Inventory API Tests', () => {
  test('should create inventory item via API successfully', async ({ request }) => {
    const itemData = {
      sku: 'API-TEST-001',
      name: 'API Test Product',
      category_id: 'electronics-category-id', // You'll need to get actual IDs
      location_id: 'main-warehouse-id',
      unit_price: 99.99,
      quantity: 10,
      min_stock: 5,
      max_stock: 50,
      status: 'active',
      images: []
    };

    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.item).toBeDefined();
    expect(result.item.sku).toBe('API-TEST-001');
    expect(result.item.name).toBe('API Test Product');
  });

  test('should handle missing required fields', async ({ request }) => {
    const itemData = {
      // Missing required sku and name
      category_id: 'electronics-category-id',
      location_id: 'main-warehouse-id',
      unit_price: 99.99
    };

    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('Missing required fields');
    expect(result.required).toContain('sku');
    expect(result.required).toContain('name');
  });

  test('should handle duplicate SKU error', async ({ request }) => {
    const itemData = {
      sku: 'TEST-DIRECT-001', // This SKU already exists
      name: 'Duplicate SKU Test',
      category_id: 'electronics-category-id',
      location_id: 'main-warehouse-id',
      unit_price: 99.99,
      quantity: 10,
      status: 'active',
      images: []
    };

    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(409);
    
    const result = await response.json();
    expect(result.error).toBe('SKU already exists');
  });

  test('should create inventory item with images', async ({ request }) => {
    const itemData = {
      sku: 'API-IMG-TEST-001',
      name: 'API Test Product with Images',
      category_id: 'electronics-category-id',
      location_id: 'main-warehouse-id',
      unit_price: 149.99,
      quantity: 5,
      min_stock: 2,
      max_stock: 20,
      status: 'active',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ]
    };

    const response = await request.post('/api/inventory/items', {
      data: itemData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.item).toBeDefined();
    expect(result.item.images).toHaveLength(2);
    expect(result.item.images).toContain('https://example.com/image1.jpg');
  });

  test('should handle bulk creation', async ({ request }) => {
    const itemsData = [
      {
        sku: 'BULK-TEST-001',
        name: 'Bulk Test Product 1',
        category_id: 'electronics-category-id',
        location_id: 'main-warehouse-id',
        unit_price: 29.99,
        quantity: 10,
        status: 'active',
        images: []
      },
      {
        sku: 'BULK-TEST-002',
        name: 'Bulk Test Product 2',
        category_id: 'electronics-category-id',
        location_id: 'main-warehouse-id',
        unit_price: 39.99,
        quantity: 15,
        status: 'active',
        images: []
      }
    ];

    const response = await request.post('/api/inventory/items', {
      data: itemsData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.items).toHaveLength(2);
  });
});

test.describe('Image Upload API Tests', () => {
  test('should upload image successfully', async ({ request }) => {
    // Create a test image file
    const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageContent, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-image.png');

    const response = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeDefined();
    expect(result.fileName).toBeDefined();
  });

  test('should handle invalid file type', async ({ request }) => {
    const formData = new FormData();
    const blob = new Blob(['test content'], { type: 'text/plain' });
    formData.append('image', blob, 'test.txt');

    const response = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  });

  test('should handle file too large', async ({ request }) => {
    // Create a large file (6MB)
    const largeContent = 'x'.repeat(6 * 1024 * 1024);
    const formData = new FormData();
    const blob = new Blob([largeContent], { type: 'image/png' });
    formData.append('image', blob, 'large-image.png');

    const response = await request.post('/api/inventory/upload-image', {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    expect(response.status()).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('File too large. Maximum size is 5MB.');
  });
});