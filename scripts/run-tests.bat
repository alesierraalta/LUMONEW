@echo off
echo 🚀 Starting Data Management Operations Tests
echo ============================================

echo.
echo 📋 Step 1: Checking if development server is running...
netstat -ano | findstr :3000 > nul
if %errorlevel% == 0 (
    echo ✅ Development server is running on port 3000
) else (
    echo ⚠️ No server detected on port 3000
    echo 💡 Starting development server...
    start /B npm run dev
    echo ⏳ Waiting for server to start...
    timeout /t 10 /nobreak > nul
)

echo.
echo 🧪 Step 2: Running Playwright tests...
echo ============================================

npx playwright test tests/data-management-operations.spec.ts --reporter=list

echo.
echo 📊 Step 3: Test execution completed
echo ============================================

pause