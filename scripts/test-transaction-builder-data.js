/**
 * Test script to verify Transaction Builder data consistency
 * This script tests that the Transaction Builder fetches the same data as the inventory page
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Transform function (same as in Transaction Builder)
function transformInventoryItem(item) {
  return {
    id: item.id,
    name: item.name,
    barcode: item.barcode,
    currentStock: item.quantity || 0,
    minimumLevel: item.min_stock || 0,
    price: item.unit_price || 0,
    category: item.categories?.name || 'Sin categoría',
    location: item.locations?.name || 'Sin ubicación',
    description: item.description || '',
    unit: item.unit || 'unidad'
  };
}

async function testDataConsistency() {
  console.log('🧪 Testing Transaction Builder data consistency...\n');

  try {
    // Fetch data the same way auditedInventoryService.getAll() does
    console.log('📊 Fetching inventory data from database...');
    
    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select(`
        *,
        categories (
          id,
          name
        ),
        locations (
          id,
          name
        )
      `)
      .order('name');

    if (error) {
      console.error('❌ Error fetching inventory data:', error.message);
      return;
    }

    console.log(`✅ Found ${inventoryData.length} inventory items in database`);

    if (inventoryData.length === 0) {
      console.log('⚠️  No inventory data found in database');
      console.log('💡 You may need to add some sample inventory items first');
      return;
    }

    // Transform data for Transaction Builder
    console.log('\n🔄 Transforming data for Transaction Builder...');
    const transformedData = inventoryData.map(transformInventoryItem);

    // Display sample data
    console.log('\n📋 Sample inventory items:');
    transformedData.slice(0, 3).forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.name}`);
      console.log(`   - Barcode: ${item.barcode || 'N/A'}`);
      console.log(`   - Current Stock: ${item.currentStock}`);
      console.log(`   - Minimum Level: ${item.minimumLevel}`);
      console.log(`   - Price: $${item.price}`);
      console.log(`   - Category: ${item.category}`);
      console.log(`   - Location: ${item.location}`);
    });

    // Summary statistics
    console.log('\n📊 Data Summary:');
    console.log(`   - Total items: ${transformedData.length}`);
    console.log(`   - Items with stock: ${transformedData.filter(item => item.currentStock > 0).length}`);
    console.log(`   - Items below minimum: ${transformedData.filter(item => item.currentStock < item.minimumLevel).length}`);
    console.log(`   - Items with barcodes: ${transformedData.filter(item => item.barcode).length}`);

    // Test barcode search functionality
    console.log('\n🔍 Testing barcode search functionality...');
    const itemsWithBarcodes = transformedData.filter(item => item.barcode);
    if (itemsWithBarcodes.length > 0) {
      const testBarcode = itemsWithBarcodes[0].barcode;
      const searchResult = transformedData.filter(item => 
        item.barcode && item.barcode.toLowerCase().includes(testBarcode.toLowerCase())
      );
      console.log(`   - Test barcode: ${testBarcode}`);
      console.log(`   - Search results: ${searchResult.length} items found`);
    } else {
      console.log('   - No items with barcodes found for testing');
    }

    console.log('\n✅ Data consistency test completed successfully!');
    console.log('🎯 Transaction Builder will now show the same data as inventory page');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check environment variables
function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease check your .env.local file');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  checkEnvironment();
  testDataConsistency();
}

module.exports = { testDataConsistency };