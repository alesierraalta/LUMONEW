#!/usr/bin/env pwsh

Write-Host "🚀 Starting Data Management Operations Tests" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Step 1: Checking if development server is running..." -ForegroundColor Yellow

# Check if port 3000 is in use
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port3000) {
    Write-Host "✅ Development server is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "⚠️ No server detected on port 3000" -ForegroundColor Yellow
    Write-Host "💡 Starting development server..." -ForegroundColor Blue
    
    # Start development server in background
    $job = Start-Job -ScriptBlock { Set-Location $using:PWD; npm run dev }
    
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Blue
    Start-Sleep -Seconds 15
    
    # Check if server started successfully
    $port3000After = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000After) {
        Write-Host "✅ Development server started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start development server" -ForegroundColor Red
        Write-Host "Please start the server manually with: npm run dev" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🧪 Step 2: Running Playwright tests..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Green

# Run Playwright tests
try {
    $testOutput = npx playwright test tests/data-management-operations.spec.ts --reporter=list 2>&1
    Write-Host $testOutput
    
    Write-Host ""
    Write-Host "📊 Step 3: Test execution completed" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    
    # Parse results
    $passedTests = ($testOutput | Select-String "✓" | Measure-Object).Count
    $failedTests = ($testOutput | Select-String "✗" | Measure-Object).Count
    $skippedTests = ($testOutput | Select-String "⏭" | Measure-Object).Count
    
    Write-Host ""
    Write-Host "📈 SUMMARY:" -ForegroundColor Cyan
    Write-Host "✅ Passed: $passedTests" -ForegroundColor Green
    Write-Host "❌ Failed: $failedTests" -ForegroundColor Red
    Write-Host "⏭️ Skipped: $skippedTests" -ForegroundColor Yellow
    
    if ($failedTests -gt 0) {
        Write-Host ""
        Write-Host "🔧 Issues found that need attention:" -ForegroundColor Yellow
        Write-Host "• Check the failed tests above for specific error details" -ForegroundColor White
        Write-Host "• Verify API endpoints are working correctly" -ForegroundColor White
        Write-Host "• Check database connections and permissions" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "🎉 All tests passed! Data management operations are working correctly." -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error running tests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Clean up background job if created
if ($job) {
    Stop-Job $job
    Remove-Job $job
}