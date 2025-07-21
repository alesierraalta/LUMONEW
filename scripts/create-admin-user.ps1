# PowerShell script to create admin user using Supabase CLI
# Make sure you have Supabase CLI installed: npm install -g supabase

Write-Host "🔐 Creating admin user in Supabase Auth..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Project details
$projectRef = "hnbtninlyzpdemyudaqg"
$adminEmail = "alesierraalta@gmail.com"
$adminPassword = "admin123"

Write-Host "📋 Project: $projectRef" -ForegroundColor Blue
Write-Host "📧 Admin Email: $adminEmail" -ForegroundColor Blue
Write-Host ""

# Login to Supabase (if not already logged in)
Write-Host "🔑 Checking Supabase authentication..." -ForegroundColor Cyan
try {
    $loginStatus = supabase projects list 2>&1
    if ($loginStatus -match "not logged in" -or $loginStatus -match "error") {
        Write-Host "⚠️  Please login to Supabase first:" -ForegroundColor Yellow
        Write-Host "   supabase login" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Already logged in to Supabase" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Please login to Supabase first:" -ForegroundColor Yellow
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Creating admin user..." -ForegroundColor Cyan

# Create the admin user using Supabase CLI
try {
    # Use the REST API directly with curl since Supabase CLI doesn't have direct user creation
    Write-Host "📝 Instructions to create admin user manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Go to https://supabase.com/dashboard/project/$projectRef" -ForegroundColor White
    Write-Host "2. Navigate to Authentication → Users" -ForegroundColor White
    Write-Host "3. Click 'Add user'" -ForegroundColor White
    Write-Host "4. Enter the following details:" -ForegroundColor White
    Write-Host "   - Email: $adminEmail" -ForegroundColor Cyan
    Write-Host "   - Password: $adminPassword" -ForegroundColor Cyan
    Write-Host "   - Email Confirm: ✅ (checked)" -ForegroundColor Green
    Write-Host "   - Auto Confirm User: ✅ (checked)" -ForegroundColor Green
    Write-Host "5. Click 'Create user'" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 After creating the user, you can login to the application!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Direct link: https://supabase.com/dashboard/project/$projectRef/auth/users" -ForegroundColor Blue
    
} catch {
    Write-Host "❌ Error occurred: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Setup instructions provided!" -ForegroundColor Green
Write-Host "📝 After creating the user in Supabase dashboard, test the login at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/auth/login" -ForegroundColor Blue