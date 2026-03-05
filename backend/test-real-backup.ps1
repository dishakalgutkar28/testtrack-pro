$loginBody = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Testing REAL Database Backup..." -ForegroundColor Cyan

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.token
Write-Host "Logged in as admin`n" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token" }

Write-Host "Creating REAL database backup (this will actually export the database)..." -ForegroundColor Yellow

# Create backup
$backupRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/backup" -Method Post -ContentType "application/json" -Headers $headers

Write-Host "`n SUCCESS! Real backup created!" -ForegroundColor Green
Write-Host "Backup ID: $($backupRes.backup_id)" -ForegroundColor Cyan
Write-Host "Backup Name: $($backupRes.name)" -ForegroundColor Cyan
Write-Host "File Name: $($backupRes.fileName)" -ForegroundColor Cyan
Write-Host "File Size: $($backupRes.fileSize)" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Fetch all backups
$backupsRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/backups" -Method Get -Headers $headers

Write-Host "`nAll Backups in Database:" -ForegroundColor Green
foreach ($backup in $backupsRes) {
    Write-Host "  ID: $($backup.id) | Name: $($backup.name) | Status: $($backup.status) | Size: $([Math]::Round($backup.file_size / 1MB, 2)) MB" -ForegroundColor Yellow
}

Write-Host "`nBackup file saved to: backend/backups/$($backupRes.fileName)" -ForegroundColor Cyan
Write-Host "`nNow you can:" -ForegroundColor White
Write-Host "  1. Download the backup file" -ForegroundColor Green
Write-Host "  2. Restore from this backup" -ForegroundColor Green  
Write-Host "  3. Delete old backups" -ForegroundColor Green
Write-Host "`nRefresh your admin dashboard to see the updated backup count!" -ForegroundColor Cyan
