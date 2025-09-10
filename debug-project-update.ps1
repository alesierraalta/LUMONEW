# Test 1: With Date object (current approach)
Write-Host "=== Test 1: With Date object ===" -ForegroundColor Yellow

$headers = @{
    'Content-Type' = 'application/json'
}

$body1 = @{
    id = '9ed9d1fa-c8d7-4d72-b84b-574cf7f17062'
    status = 'completed'
    actualEndDate = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
} | ConvertTo-Json

Write-Host "Request body: $body1" -ForegroundColor Cyan

try {
    $response1 = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -Method PUT -Headers $headers -Body $body1 -TimeoutSec 30
    Write-Host "SUCCESS! Status: $($response1.StatusCode)" -ForegroundColor Green
    $response1.Content
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
        $reader.Close()
    }
}

Write-Host "`n=== Test 2: Just status change ===" -ForegroundColor Yellow

$body2 = @{
    id = '9ed9d1fa-c8d7-4d72-b84b-574cf7f17062'
    status = 'completed'
} | ConvertTo-Json

Write-Host "Request body: $body2" -ForegroundColor Cyan

try {
    $response2 = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -Method PUT -Headers $headers -Body $body2 -TimeoutSec 30
    Write-Host "SUCCESS! Status: $($response2.StatusCode)" -ForegroundColor Green
    $response2.Content
} catch {
    Write-Host "ERROR:" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
        $reader.Close()
    }
}

