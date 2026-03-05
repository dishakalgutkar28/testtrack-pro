$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "🧪 Testing /api/admin/users endpoint...`n" -ForegroundColor Cyan

# Login to get token
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful" -ForegroundColor Green
    $token = $loginResponse.token
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Fetch users
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $usersResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users" -Method Get -Headers $headers
    Write-Host "`n✅ Users fetched successfully!" -ForegroundColor Green
    Write-Host "Users count: $($usersResponse.Count)" -ForegroundColor Cyan
    $usersResponse | Format-Table -Property id, email, role, is_active
} catch {
    Write-Host "`n❌ Failed to fetch users!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
