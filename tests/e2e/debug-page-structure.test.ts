import { test, expect } from '@playwright/test'

test('Debug page structure', async ({ page }) => {
  console.log('🔍 Starting page structure debug...')
  
  // Navigate to user creation page
  await page.goto('/users/create')
  console.log('✓ Navigated to /users/create')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  console.log('✓ Page loaded')
  
  // Get page title
  const title = await page.title()
  console.log(`📄 Page title: ${title}`)
  
  // Check if page has any content
  const bodyText = await page.locator('body').textContent()
  console.log(`📝 Body text length: ${bodyText?.length || 0}`)
  
  // Look for any h1 elements
  const h1Elements = await page.locator('h1').all()
  console.log(`🏷️ Found ${h1Elements.length} h1 elements`)
  
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent()
    console.log(`  H1 ${i + 1}: "${text}"`)
  }
  
  // Look for all input elements
  const inputs = await page.locator('input').all()
  console.log(`📝 Found ${inputs.length} input elements`)
  
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type')
    const name = await inputs[i].getAttribute('name')
    const placeholder = await inputs[i].getAttribute('placeholder')
    const id = await inputs[i].getAttribute('id')
    console.log(`  Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`)
  }
  
  // Look for labels
  const labels = await page.locator('label').all()
  console.log(`🏷️ Found ${labels.length} label elements`)
  
  for (let i = 0; i < labels.length; i++) {
    const text = await labels[i].textContent()
    console.log(`  Label ${i + 1}: "${text}"`)
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-page-structure.png', fullPage: true })
  console.log('📸 Screenshot saved as debug-page-structure.png')
  
  // Get the full HTML for inspection
  const html = await page.content()
  console.log(`📄 Full HTML length: ${html.length}`)
  
  // Look for any error messages or loading states
  const errorElements = await page.locator('[class*="error"], [class*="Error"], .text-red, .text-danger').all()
  console.log(`❌ Found ${errorElements.length} potential error elements`)
  
  const loadingElements = await page.locator('[class*="loading"], [class*="Loading"], .spinner').all()
  console.log(`⏳ Found ${loadingElements.length} potential loading elements`)
  
  console.log('🔍 Debug completed')
})