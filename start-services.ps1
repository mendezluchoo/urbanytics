# Urbanytics Services Startup Script
# PowerShell script to start all services in the correct order

Write-Host "[START] Starting Urbanytics Services..." -ForegroundColor Green

# Function to check if a port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$Timeout = 60)
    
    Write-Host "[WAIT] Waiting for $ServiceName on port $Port..." -ForegroundColor Yellow
    $startTime = Get-Date
    $timeoutTime = $startTime.AddSeconds($Timeout)
    
    while ((Get-Date) -lt $timeoutTime) {
        if (Test-Port $Port) {
            Write-Host "[OK] $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Host "[ERROR] Timeout waiting for $ServiceName" -ForegroundColor Red
    return $false
}

# Step 1: Start Database and Redis
Write-Host "[DB] Starting Database and Redis..." -ForegroundColor Cyan
docker-compose up -d db redis

# Wait for database to be ready
if (-not (Wait-ForService -Port 5432 -ServiceName "PostgreSQL")) {
    Write-Host "[ERROR] Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

# Wait for Redis to be ready
if (-not (Wait-ForService -Port 6379 -ServiceName "Redis")) {
    Write-Host "[ERROR] Failed to start Redis" -ForegroundColor Red
    exit 1
}

# Step 2: Start Backend Services
Write-Host "[BACKEND] Starting Backend Services..." -ForegroundColor Cyan
docker-compose up -d backend ml_service

# Wait for backend to be ready
if (-not (Wait-ForService -Port 8080 -ServiceName "Go Backend")) {
    Write-Host "[ERROR] Failed to start Go Backend" -ForegroundColor Red
    exit 1
}

# Wait for ML service to be ready
if (-not (Wait-ForService -Port 5000 -ServiceName "ML Service")) {
    Write-Host "[ERROR] Failed to start ML Service" -ForegroundColor Red
    exit 1
}

# Step 3: Start BFF
Write-Host "[BFF] Starting BFF..." -ForegroundColor Cyan
docker-compose up -d bff

# Wait for BFF to be ready
if (-not (Wait-ForService -Port 3001 -ServiceName "BFF")) {
    Write-Host "[ERROR] Failed to start BFF" -ForegroundColor Red
    exit 1
}

# Step 4: Start Frontend
Write-Host "[FRONTEND] Starting Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Set-Location ..

# Step 5: Show status
Write-Host "`n[SUCCESS] All services started successfully!" -ForegroundColor Green
Write-Host "`n[STATUS] Service Status:" -ForegroundColor White
Write-Host "   • Frontend:     http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • BFF API:      http://localhost:3001" -ForegroundColor Cyan
Write-Host "   • Go Backend:   http://localhost:8080" -ForegroundColor Cyan
Write-Host "   • ML Service:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "   • PostgreSQL:   localhost:5432" -ForegroundColor Cyan
Write-Host "   • Redis:        localhost:6379" -ForegroundColor Cyan

Write-Host "`n[HEALTH] Health Checks:" -ForegroundColor White
Write-Host "   • BFF Health:   http://localhost:3001/health" -ForegroundColor Yellow
Write-Host "   • Backend Health: http://localhost:8080/health" -ForegroundColor Yellow
Write-Host "   • ML Health:    http://localhost:5000/health" -ForegroundColor Yellow

Write-Host "`n[NEXT] Next Steps:" -ForegroundColor White
Write-Host "   1. Open http://localhost:5173 in your browser" -ForegroundColor Green
Write-Host "   2. Test the Machine Learning predictions" -ForegroundColor Green
Write-Host "   3. Explore the admin panel" -ForegroundColor Green
Write-Host "   4. Check the dashboard analytics" -ForegroundColor Green

Write-Host "`n[STOP] To stop all services, run: docker-compose down" -ForegroundColor Red 