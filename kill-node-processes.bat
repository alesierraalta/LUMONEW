@echo off
REM ===============================================
REM 🔥 Kill All Node.js Processes - Windows Batch
REM ===============================================

echo 🔍 Killing Node.js processes...
echo.

REM Kill all Node.js related processes
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Killed node.exe processes
) else (
    echo ℹ️  No node.exe processes found
)

taskkill /f /im npm.cmd >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Killed npm.cmd processes
) else (
    echo ℹ️  No npm.cmd processes found
)

taskkill /f /im npx.cmd >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Killed npx.cmd processes
) else (
    echo ℹ️  No npx.cmd processes found
)

taskkill /f /im yarn.cmd >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Killed yarn.cmd processes
) else (
    echo ℹ️  No yarn.cmd processes found
)

echo.
echo 🎉 Process cleanup completed!
echo.
echo 📋 Alternative commands:
echo    taskkill /f /im node.exe
echo    taskkill /f /im npm.cmd
echo    netstat -ano ^| findstr :3000
echo    taskkill /f /pid ^<PID_NUMBER^>
echo.
pause 