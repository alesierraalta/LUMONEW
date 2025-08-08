const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('Environment check:')
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing')
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanupProjectItems() {
  try {
    console.log('🔍 Analyzing project items vs inventory...')
    
    // Get current inventory items
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, name, sku, quantity')
    
    if (inventoryError) throw inventoryError
    
    console.log(`📦 Found ${inventoryItems.length} inventory items`)
    
    // Get project items (LU type only)
    const { data: projectItems, error: projectError } = await supabase
      .from('project_items')
      .select('id, product_name, description, quantity, project_id, created_at')
      .eq('product_type', 'LU')
      .order('created_at', { ascending: true })
    
    if (projectError) throw projectError
    
    console.log(`📋 Found ${projectItems.length} LU project items`)
    
    // Find items that don't match inventory
    const orphanItems = []
    const duplicateItems = []
    const validItems = []
    
    const seenSkus = new Map()
    
    projectItems.forEach(item => {
      // Extract SKU from description
      const skuMatch = item.description?.match(/SKU: (.+)/)
      const sku = skuMatch ? skuMatch[1] : null
      
      // Check if this corresponds to a real inventory item
      const inventoryMatch = inventoryItems.find(inv => 
        inv.name === item.product_name || 
        (sku && inv.sku === sku)
      )
      
      if (!inventoryMatch) {
        orphanItems.push({
          ...item,
          reason: 'No matching inventory item found'
        })
      } else if (seenSkus.has(sku)) {
        duplicateItems.push({
          ...item,
          reason: `Duplicate SKU: ${sku}`,
          firstSeen: seenSkus.get(sku)
        })
      } else {
        validItems.push(item)
        if (sku) seenSkus.set(sku, item.created_at)
      }
    })
    
    console.log('\\n📊 Analysis Results:')
    console.log(`✅ Valid items: ${validItems.length}`)
    console.log(`❌ Orphan items (no inventory match): ${orphanItems.length}`)
    console.log(`🔄 Duplicate items: ${duplicateItems.length}`)
    
    if (orphanItems.length > 0) {
      console.log('\\n👻 Orphan Items:')
      orphanItems.forEach(item => {
        console.log(`  - ${item.product_name} (${item.quantity}x) - ${item.reason}`)
      })
    }
    
    if (duplicateItems.length > 0) {
      console.log('\\n🔄 Duplicate Items:')
      duplicateItems.forEach(item => {
        console.log(`  - ${item.product_name} (${item.quantity}x) - ${item.reason}`)
      })
    }
    
    console.log('\\n🧹 Cleaning up inconsistent items...')
    
    if (orphanItems.length > 0 || duplicateItems.length > 0) {
      const itemsToDelete = [...orphanItems, ...duplicateItems].map(item => item.id)
      
      console.log(`🗑️  Deleting ${itemsToDelete.length} inconsistent items...`)
      
      const { error: deleteError } = await supabase
        .from('project_items')
        .delete()
        .in('id', itemsToDelete)
      
      if (deleteError) throw deleteError
      
      console.log(`✅ Successfully deleted ${itemsToDelete.length} inconsistent items`)
      
      // Also need to restore inventory stock for the duplicates
      console.log('🔄 Restoring inventory stock for duplicated items...')
      
      // Calculate total quantities to restore
      const stockToRestore = {}
      duplicateItems.forEach(item => {
        const skuMatch = item.description?.match(/SKU: (.+)/)
        const sku = skuMatch ? skuMatch[1] : null
        if (sku) {
          stockToRestore[sku] = (stockToRestore[sku] || 0) + item.quantity
        }
      })
      
      // Restore stock for each SKU
      for (const [sku, quantity] of Object.entries(stockToRestore)) {
        const inventoryItem = inventoryItems.find(inv => inv.sku === sku)
        if (inventoryItem) {
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ quantity: inventoryItem.quantity + quantity })
            .eq('id', inventoryItem.id)
          
          if (updateError) throw updateError
          
          console.log(`  ✅ Restored ${quantity} units to ${inventoryItem.name} (${sku})`)
        }
      }
      
      console.log('\\n🎉 Cleanup completed successfully!')
    } else {
      console.log('✅ No inconsistent items found. Data is clean!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

cleanupProjectItems()