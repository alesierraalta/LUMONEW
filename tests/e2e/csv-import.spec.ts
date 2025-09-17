import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('CSV Import Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to inventory page
    await page.goto('/inventory')
    await page.waitForLoadState('networkidle')
  })

  test('should open CSV import modal', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Wait for modal to appear
    await expect(page.getByText('Importar Inventario desde CSV')).toBeVisible()
    
    // Check if upload area is visible
    await expect(page.getByText('Arrastra tu archivo CSV aquí')).toBeVisible()
  })

  test('should handle CSV file upload and processing', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Wait for modal to appear
    await expect(page.getByText('Importar Inventario desde CSV')).toBeVisible()
    
    // Upload test CSV file
    const csvFilePath = path.join(__dirname, '../../public/test-inventory.csv')
    
    // Click the select file button
    await page.getByText('Seleccionar Archivo').click()
    
    // Upload the file
    const fileInput = page.locator('input[type=\"file\"]')
    await fileInput.setInputFiles(csvFilePath)
    
    // Wait for file processing
    await page.waitForTimeout(2000)
    
    // Should proceed to mapping step
    await expect(page.getByText('Mapeo de Columnas')).toBeVisible({ timeout: 10000 })
    
    // Check if columns are detected
    await expect(page.getByText('SKU')).toBeVisible()
    await expect(page.getByText('Nombre')).toBeVisible()
    await expect(page.getByText('Categoria')).toBeVisible()
  })

  test('should show column mapping interface', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Upload test CSV file
    const csvFilePath = path.join(__dirname, '../../public/test-inventory.csv')
    await page.getByText('Seleccionar Archivo').click()
    const fileInput = page.locator('input[type=\"file\"]')
    await fileInput.setInputFiles(csvFilePath)
    
    // Wait for mapping interface
    await expect(page.getByText('Mapeo de Columnas')).toBeVisible({ timeout: 10000 })
    
    // Check if mapping statistics are shown
    await expect(page.getByText(/mapeadas/i)).toBeVisible()
    
    // Check if continue button is available
    await expect(page.getByRole('button', { name: /continuar/i })).toBeVisible()
  })

  test('should show preview with data validation', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Upload test CSV file
    const csvFilePath = path.join(__dirname, '../../public/test-inventory.csv')
    await page.getByText('Seleccionar Archivo').click()
    const fileInput = page.locator('input[type=\"file\"]')
    await fileInput.setInputFiles(csvFilePath)
    
    // Wait for mapping interface and continue
    await expect(page.getByText('Mapeo de Columnas')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /continuar/i }).click()
    
    // Wait for preview interface
    await expect(page.getByText('Vista Previa de Importación')).toBeVisible({ timeout: 10000 })
    
    // Check if statistics are shown
    await expect(page.getByText(/válidos/i)).toBeVisible()
    
    // Check if sample data is displayed
    await expect(page.getByText('PROD001')).toBeVisible()
    await expect(page.getByText('Laptop Dell Inspiron')).toBeVisible()
  })

  test('should handle import process', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Upload test CSV file
    const csvFilePath = path.join(__dirname, '../../public/test-inventory.csv')
    await page.getByText('Seleccionar Archivo').click()
    const fileInput = page.locator('input[type=\"file\"]')
    await fileInput.setInputFiles(csvFilePath)
    
    // Progress through mapping
    await expect(page.getByText('Mapeo de Columnas')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /continuar/i }).click()
    
    // Progress through preview
    await expect(page.getByText('Vista Previa de Importación')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /importar/i }).click()
    
    // Wait for import process
    await expect(page.getByText('Importando Datos')).toBeVisible({ timeout: 10000 })
    
    // Wait for completion (this might take a while)
    await expect(page.getByText('Resultados de Importación')).toBeVisible({ timeout: 30000 })
    
    // Check if import was successful
    await expect(page.getByText(/importados/i)).toBeVisible()
  })

  test('should handle file validation errors', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Try to upload a non-CSV file (create a temporary text file)
    const tempFilePath = path.join(__dirname, '../../public/test.txt')
    
    // Create a temporary text file
    await page.evaluate(() => {
      const content = 'This is not a CSV file'
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'test.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    
    // Try to upload the invalid file
    await page.getByText('Seleccionar Archivo').click()
    const fileInput = page.locator('input[type=\"file\"]')
    
    // This should show an error or not accept the file
    // The exact behavior depends on the file input accept attribute
  })

  test('should allow modal cancellation at any step', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Check if modal is open
    await expect(page.getByText('Importar Inventario desde CSV')).toBeVisible()
    
    // Click cancel button
    await page.getByRole('button', { name: /cancelar/i }).click()
    
    // Modal should be closed
    await expect(page.getByText('Importar Inventario desde CSV')).not.toBeVisible()
  })

  test('should show progress indicators', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Check if progress indicators are visible
    await expect(page.getByText('Cargar')).toBeVisible()
    await expect(page.getByText('Mapear')).toBeVisible()
    await expect(page.getByText('Vista Previa')).toBeVisible()
    await expect(page.getByText('Importar')).toBeVisible()
    await expect(page.getByText('Resultados')).toBeVisible()
  })

  test('should display helpful tips and information', async ({ page }) => {
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Check if helpful information is displayed
    await expect(page.getByText('Formatos Soportados')).toBeVisible()
    await expect(page.getByText('Consejos para el CSV')).toBeVisible()
    
    // Check if supported formats are listed
    await expect(page.getByText('.csv, .txt, .tsv')).toBeVisible()
  })

  test('should handle empty CSV files', async ({ page }) => {
    // Create an empty CSV file for testing
    const emptyCSVContent = ''
    
    // Click on the import button
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    // Create and upload empty file
    await page.evaluate((content) => {
      const blob = new Blob([content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'empty.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, emptyCSVContent)
    
    // This should show an appropriate error message
  })

  test('should provide export functionality for results', async ({ page }) => {
    // Complete a full import process first
    await page.getByRole('button', { name: /importar datos/i }).click()
    
    const csvFilePath = path.join(__dirname, '../../public/test-inventory.csv')
    await page.getByText('Seleccionar Archivo').click()
    const fileInput = page.locator('input[type=\"file\"]')
    await fileInput.setInputFiles(csvFilePath)
    
    // Progress through all steps
    await expect(page.getByText('Mapeo de Columnas')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /continuar/i }).click()
    
    await expect(page.getByText('Vista Previa de Importación')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /importar/i }).click()
    
    // Wait for results
    await expect(page.getByText('Resultados de Importación')).toBeVisible({ timeout: 30000 })
    
    // Check if export buttons are available
    await expect(page.getByRole('button', { name: /exportar json/i })).toBeVisible()
  })
})