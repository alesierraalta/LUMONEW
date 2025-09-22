# Authentication Tests Runner - PowerShell Version
# Runs all authentication tests and outputs results to console

param(
    [string]$Port = "3000",
    [switch]$Headless = $true,
    [int]$Timeout = 60
)

Write-Host "🚀 Iniciando pruebas de autenticación completas..." -ForegroundColor Green
Write-Host ""

# Configuration
$BaseUrl = "http://localhost:$Port"
$TestTimeout = $Timeout * 1000

Write-Host "📡 URL base configurada: $BaseUrl" -ForegroundColor Cyan
Write-Host "⏱️  Timeout de pruebas: $TestTimeout ms" -ForegroundColor Cyan
Write-Host "👁️  Modo: $(if ($Headless) { 'Headless' } else { 'Con interfaz' })" -ForegroundColor Cyan
Write-Host ""

# Test results tracking
$TestResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
    Errors = @()
}

# Function to run a single test
function Run-Test {
    param(
        [string]$TestName,
        [string]$TestFile
    )
    
    Write-Host ""
    Write-Host "🧪 Ejecutando: $TestName" -ForegroundColor Yellow
    Write-Host "📁 Archivo: $TestFile" -ForegroundColor Gray
    Write-Host ("-" * 50) -ForegroundColor Gray
    
    $TestResults.Total++
    
    try {
        # Create playwright config for this test
        $PlaywrightConfig = @"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/auth-results.json' }]
  ],
  use: {
    baseURL: '$BaseUrl',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: $TestTimeout
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  timeout: $TestTimeout
});
"@
        
        $PlaywrightConfig | Out-File -FilePath "playwright-auth.config.ts" -Encoding UTF8
        
        # Build command
        $Command = "npx playwright test $TestFile --config=playwright-auth.config.ts"
        if ($Headless) {
            $Command += " --headed=false"
        } else {
            $Command += " --headed"
        }
        
        Write-Host "💻 Comando: $Command" -ForegroundColor Gray
        
        # Run the test
        $Output = Invoke-Expression $Command 2>&1
        
        Write-Host "✅ Resultado: ÉXITO" -ForegroundColor Green
        Write-Host "📋 Salida:" -ForegroundColor Gray
        Write-Host $Output
        
        $TestResults.Passed++
        
    } catch {
        Write-Host "❌ Resultado: FALLO" -ForegroundColor Red
        Write-Host "📋 Error:" -ForegroundColor Gray
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        $TestResults.Failed++
        $TestResults.Errors += @{
            Test = $TestName
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ("-" * 50) -ForegroundColor Gray
}

# Function to run unit tests
function Run-UnitTests {
    Write-Host ""
    Write-Host "🧪 Ejecutando pruebas unitarias..." -ForegroundColor Yellow
    Write-Host ("-" * 50) -ForegroundColor Gray
    
    $TestResults.Total++
    
    try {
        $Command = "npx vitest run __tests__/unit/auth-permissions.test.ts --reporter=verbose"
        Write-Host "💻 Comando: $Command" -ForegroundColor Gray
        
        $Output = Invoke-Expression $Command 2>&1
        
        Write-Host "✅ Pruebas unitarias: ÉXITO" -ForegroundColor Green
        Write-Host "📋 Salida:" -ForegroundColor Gray
        Write-Host $Output
        
        $TestResults.Passed++
        
    } catch {
        Write-Host "❌ Pruebas unitarias: FALLO" -ForegroundColor Red
        Write-Host "📋 Error:" -ForegroundColor Gray
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        $TestResults.Failed++
        $TestResults.Errors += @{
            Test = "Unit Tests"
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ("-" * 50) -ForegroundColor Gray
}

# Main execution
function Main {
    Write-Host "📋 Lista de pruebas a ejecutar:" -ForegroundColor Cyan
    Write-Host "1. Login con credenciales inválidas (E2E)"
    Write-Host "2. Logout de usuario (E2E)"
    Write-Host "3. Verificación de roles (Unit)"
    Write-Host "4. Acceso a rutas protegidas (E2E)"
    Write-Host "5. Expiración de sesión (E2E)"
    Write-Host "6. Recuperación de contraseña (E2E)"
    Write-Host "7. Pruebas unitarias de permisos"
    Write-Host ""
    
    # Check if application is running
    Write-Host "🔍 Verificando si la aplicación está ejecutándose..." -ForegroundColor Yellow
    try {
        $Response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ Aplicación respondiendo en $BaseUrl" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ No se puede conectar a $BaseUrl" -ForegroundColor Red
        Write-Host "⚠️  Asegúrate de que la aplicación esté ejecutándose" -ForegroundColor Yellow
        Write-Host "💡 Puedes ejecutar: npm run dev" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Run comprehensive E2E tests
    Run-Test -TestName "Autenticación Completa" -TestFile "tests/automated/authentication-comprehensive.spec.ts"
    
    # Run existing authentication tests
    Run-Test -TestName "Sistema de Autenticación" -TestFile "tests/automated/authentication.spec.ts"
    
    # Run unit tests
    Run-UnitTests
    
    # Generate final report
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Magenta
    Write-Host "📊 RESUMEN FINAL DE PRUEBAS DE AUTENTICACIÓN" -ForegroundColor Magenta
    Write-Host ("=" * 60) -ForegroundColor Magenta
    Write-Host "📈 Total de pruebas: $($TestResults.Total)"
    Write-Host "✅ Exitosas: $($TestResults.Passed)" -ForegroundColor Green
    Write-Host "❌ Fallidas: $($TestResults.Failed)" -ForegroundColor Red
    Write-Host "⏭️  Omitidas: $($TestResults.Skipped)"
    
    $SuccessPercentage = if ($TestResults.Total -gt 0) { 
        [math]::Round(($TestResults.Passed / $TestResults.Total) * 100, 1) 
    } else { 
        0 
    }
    Write-Host "📊 Porcentaje de éxito: $SuccessPercentage%"
    
    if ($TestResults.Errors.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ ERRORES DETALLADOS:" -ForegroundColor Red
        for ($i = 0; $i -lt $TestResults.Errors.Count; $i++) {
            $Error = $TestResults.Errors[$i]
            Write-Host ""
            Write-Host "$($i + 1). $($Error.Test)" -ForegroundColor Red
            Write-Host "   Error: $($Error.Error)" -ForegroundColor Gray
        }
    }
    
    # Save results to file
    $ResultsFile = "test-results/auth-test-summary.json"
    if (-not (Test-Path "test-results")) {
        New-Item -ItemType Directory -Path "test-results" -Force | Out-Null
    }
    $TestResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $ResultsFile -Encoding UTF8
    Write-Host ""
    Write-Host "💾 Resultados guardados en: $ResultsFile" -ForegroundColor Cyan
    
    # Cleanup
    if (Test-Path "playwright-auth.config.ts") {
        Remove-Item "playwright-auth.config.ts" -Force
    }
    
    Write-Host ""
    Write-Host "🎯 Pruebas de autenticación completadas!" -ForegroundColor Green
    
    # Return appropriate exit code
    if ($TestResults.Failed -gt 0) {
        exit 1
    } else {
        exit 0
    }
}

# Run main function
try {
    Main
} catch {
    Write-Host "💥 Error durante la ejecución: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}