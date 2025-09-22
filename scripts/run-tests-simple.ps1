Write-Host "Starting Data Management Operations Tests" -ForegroundColor Green
Write-Host "=========================================="

Write-Host ""
Write-Host "Step 1: Checking development server..." -ForegroundColor Yellow

# Check if port 3000 is in use
try {
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Write-Host "Development server is running on port 3000" -ForegroundColor Green
    } else {
        Write-Host "No server detected on port 3000" -ForegroundColor Yellow
        Write-Host "Please start the server manually with: npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check port status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Running Playwright tests..." -ForegroundColor Yellow
Write-Host "===================================="

# Run Playwright tests
try {
    npx playwright test tests/data-management-operations.spec.ts --reporter=list
    
    Write-Host ""
    Write-Host "Test execution completed" -ForegroundColor Green
    Write-Host "========================"
    
} catch {
    Write-Host "Error running tests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")