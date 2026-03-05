$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Creating a backup..." -ForegroundColor Cyan

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token

$headers = @{ Authorization = "Bearer $token" }

# Create backup
$backupRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/backup" -Method Post -ContentType "application/json" -Headers $headers

Write-Host "Backup created!" -ForegroundColor Green
Write-Host "Backup Name: $($backupRes.name)" -ForegroundColor Yellow
Write-Host "Backup ID: $($backupRes.backup_id)" -ForegroundColor Yellow

Start-Sleep -Seconds 1

# Fetch all backups
$backupsRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/backups" -Method Get -Headers $headers

Write-Host "`nAll Backups:" -ForegroundColor Green
foreach ($backup in $backupsRes) {
    $status = $backup.status
    Write-Host "  - Name: $($backup.name) | Status: $status" -ForegroundColor Yellow
}

Write-Host "`nNow refresh your admin dashboard to see the backup count increase!" -ForegroundColor Cyan
