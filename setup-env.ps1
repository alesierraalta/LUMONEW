# Set SUPABASE_SERVICE_ROLE_KEY environment variable for the current session
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYnRuaW5seXpwZGVteXVkYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5Mjc5NCwiZXhwIjoyMDY4NjY4Nzk0fQ.Cgbmm19Uvfk-R_-QhUs-E-YasSYRGpsWXPuSYhODbpk"

Write-Host "SUPABASE_SERVICE_ROLE_KEY has been set for this PowerShell session"
Write-Host "Service role key: Present"

# Optional: Set the environment variable for the current user (persists across sessions)
# [Environment]::SetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", $env:SUPABASE_SERVICE_ROLE_KEY, "User")
# Write-Host "Environment variable has been set globally for the current user"
