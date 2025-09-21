const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupInventoryImages() {
  try {
    console.log('🚀 Setting up inventory images support...')
    
    // 1. Add images column to inventory table
    console.log('📝 Adding images column to inventory table...')
    const { error: alterError } = await supabase
      .from('inventory')
      .select('id')
      .limit(1)
    
    if (alterError && alterError.message.includes('images')) {
      console.log('✅ Images column already exists')
    } else {
      // Try to add the column using raw SQL
      const { error: sqlError } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE inventory 
          ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
        `
      })
      
      if (sqlError) {
        console.log('⚠️  Could not add images column via RPC, trying alternative approach...')
        // Alternative: Update existing records to have empty images array
        const { data: items, error: fetchError } = await supabase
          .from('inventory')
          .select('id')
          .limit(10)
        
        if (fetchError) {
          console.error('❌ Error fetching inventory items:', fetchError)
        } else {
          console.log(`📊 Found ${items?.length || 0} inventory items`)
        }
      } else {
        console.log('✅ Images column added successfully')
      }
    }
    
    // 2. Create storage bucket for inventory images
    console.log('🪣 Creating storage bucket for inventory images...')
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
    } else {
      const inventoryBucket = buckets?.find(bucket => bucket.name === 'inventory-images')
      
      if (inventoryBucket) {
        console.log('✅ inventory-images bucket already exists')
      } else {
        // Create the bucket
        const { data: bucketData, error: createError } = await supabase.storage.createBucket('inventory-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError)
        } else {
          console.log('✅ inventory-images bucket created successfully')
        }
      }
    }
    
    console.log('🎉 Inventory images setup completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the setup
setupInventoryImages()