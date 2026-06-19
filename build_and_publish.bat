@echo off
title Build and Publish Tool - HRM Nhan Phu
echo =======================================================
echo HE THONG DONG GOI TU DONG - HRM NHAN PHU
echo =======================================================
echo.
echo [LUU Y] Vui long tat Visual Studio dang chay (Debug) truoc khi chay tool nay!
echo.
pause

echo.
echo [1/3] Dang dong goi C# Backend (ASP.NET Core API)...
echo.
dotnet publish Quan_ly_nhan_su/Quan_ly_nhan_su.csproj -c Release -o ./publish/backend
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the build Backend. Vui long kiem tra xem Visual Studio co dang chay khong.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Dang tao file SQL Script khoi tao Database (create_database.sql)...
echo.
dotnet ef migrations script -p Quan_ly_nhan_su.Infrastructure/Quan_ly_nhan_su.Infrastructure.csproj -s Quan_ly_nhan_su/Quan_ly_nhan_su.csproj -o ./publish/create_database.sql
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the tao file script database. Kiem tra xem ban da cai dotnet-ef tool chua.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Dang dong goi Next.js Frontend...
echo.
cd frontend
cmd /c npm run build
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the build Frontend Next.js.
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo =======================================================
echo CHUC MUNG! DONG GOI DU AN HOAN TAT!
echo =======================================================
echo.
echo Tat ca cac file san sang de dua len Web da duoc luu o thu muc:
echo [ %CD%\publish ]
echo.
echo Cac file bao gom:
echo 1. Thu muc /backend : Upload len Web Server IIS (hoac Linux Systemd).
echo 2. File create_database.sql : Mo bang SSMS tren VPS va bam Execute de tao tat ca bang.
echo 3. Thu muc /frontend/.next va public: Su dung de chay production server cho Next.js tren VPS.
echo =======================================================
pause
