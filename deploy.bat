@echo off
REM TestTrack Pro - Docker Deployment Script for Windows

setlocal enabledelayedexpansion

echo ==================================
echo TestTrack Pro - Docker Setup
echo ==================================
echo.

REM Check Docker installation
echo Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed. Please install Docker Desktop for Windows.
    echo Visit: https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo [OK] Docker Desktop is running
echo.

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo.
    echo WARNING: Please edit .env with your configuration!
    echo Edit .env and set these values:
    echo   - MYSQL_PASSWORD
    echo   - JWT_SECRET
    echo   - GMAIL_USER and GMAIL_PASSWORD
    echo.
    pause
)

REM Start services
echo.
echo Building Docker images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

REM Wait for database
echo.
echo Waiting for database to start...
set /a count=0
:wait_db
    docker-compose exec -T database mysql -u testtrack -ptesttrack123 testtrack -e "SELECT 1" >nul 2>&1
    if errorlevel 1 (
        set /a count+=1
        if !count! leq 30 (
            echo Waiting... (!count!/30)
            timeout /t 1 /nobreak >nul
            goto wait_db
        )
    ) else (
        echo [OK] Database is ready
    )

REM Run migrations
echo.
echo Running database migrations...
docker-compose exec -T backend mysql -h database -u testtrack -ptesttrack123 testtrack < backend\migrations\001_add_indexes.sql

REM Wait for services
echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

REM Check health
echo.
echo Checking services health...
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARN] Backend is not responding yet
) else (
    echo [OK] Backend is healthy
)

curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo [WARN] Frontend is not responding yet
) else (
    echo [OK] Frontend is healthy
)

REM Display results
echo.
echo ==================================
echo Deployment Complete!
echo ==================================
echo.
echo Services are running at:
echo Frontend:   http://localhost:3000
echo Backend:    http://localhost:5000
echo API Docs:   http://localhost:5000/api/docs
echo.
echo Useful commands:
echo   View logs:           docker-compose logs -f
echo   Stop services:       docker-compose down
echo   Run tests:           docker-compose exec backend npm test
echo   Access database:     docker-compose exec database mysql -u testtrack -p testtrack
echo.
echo Note: Allow 30-60 seconds for all services to fully start
echo.
pause
