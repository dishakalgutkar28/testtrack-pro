$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Testing Project Creation with Audit Logs..." -ForegroundColor Cyan

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
Write-Host "Logged in as admin`n" -ForegroundColor Green

$projectBody = @{
    name = "TestProj_$(Get-Date -Format 'HHmmss')"
    description = "Created via test"
} | ConvertTo-Json

Write-Host "Creating project..." -ForegroundColor Cyan

$headers = @{ Authorization = "Bearer $token" }

$projectRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/projects" -Method Post -Body $projectBody -ContentType "application/json" -Headers $headers

Write-Host "Project created!"  -ForegroundColor Green
Start-Sleep -Seconds 2

$auditRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/audit-logs?limit=10" -Method Get -Headers $headers

Write-Host "`nRecent Audit Logs:" -ForegroundColor Green
foreach ($log in $auditRes | Select-Object -First 5) {
    Write-Host "  $($log.action) - Target: $($log.target_type):$($log.target_id)" -ForegroundColor Yellow
}

$projectLogs = $auditRes | Where-Object { $_.action -eq "CREATE_PROJECT" }
if ($projectLogs) {
    Write-Host "`nSUCCESS! Project audit log found!" -ForegroundColor Green
} else {
    Write-Host "`nERROR: Project audit log NOT found" -ForegroundColor Red
}
