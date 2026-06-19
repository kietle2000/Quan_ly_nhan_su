# Script khoi dong he thong HRM Nhan Phu
# Chay bang: .\start.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   HRM Nhan Phu - Khoi dong he thong" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Them nodejs vao PATH
$env:Path = "$PSScriptRoot\nodejs;" + $env:Path

# Kiem tra Node.js
if (-not (Test-Path "$PSScriptRoot\nodejs\node.exe")) {
    Write-Host "[CANH BAO] Khong tim thay Node.js. Chay setup.ps1 truoc." -ForegroundColor Yellow
}

# Khoi dong Backend
Write-Host "[1/2] Khoi dong Backend ASP.NET Core..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\Quan_ly_nhan_su'; Write-Host 'Backend HRM Nhan Phu' -ForegroundColor Cyan; dotnet run --urls 'http://localhost:5000;https://localhost:5001'"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# Khoi dong Frontend
Write-Host "[2/2] Khoi dong Frontend Next.js..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "`$env:Path = '$PSScriptRoot\nodejs;' + `$env:Path; cd '$PSScriptRoot\frontend'; Write-Host 'Frontend HRM Nhan Phu' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  He thong dang khoi dong..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "  Swagger UI:  http://localhost:5000/swagger" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  Tai khoan demo:" -ForegroundColor Gray
Write-Host "  Admin    : admin@nhanphu.edu.vn / adminPassword123" -ForegroundColor Gray
Write-Host "  Manager  : manager@nhanphu.edu.vn / managerPassword123" -ForegroundColor Gray
Write-Host "  Employee : employee@nhanphu.edu.vn / employeePassword123" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
