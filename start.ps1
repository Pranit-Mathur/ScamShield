# ScamShield Full Stack Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             Starting ScamShield Platform                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI AI Engine (Port 8000)
Write-Host "[1/3] Launching FastAPI AI Engine on port 8000..." -ForegroundColor Green
$aiProcess = Start-Process python -ArgumentList "-m", "uvicorn", "services.ai.app.main:app", "--host", "127.0.0.1", "--port", "8000" -PassThru

# 2. Start Node.js API Gateway (Port 5001)
Write-Host "[2/3] Launching Node.js Gateway & WebSocket on port 5001..." -ForegroundColor Green
$gatewayProcess = Start-Process node -ArgumentList "apps/gateway/server.js" -PassThru

# 3. Start React Vite Web Frontend (Port 3000)
Write-Host "[3/3] Launching React Vite Web App on port 3000..." -ForegroundColor Green
Set-Location apps/web
$webProcess = Start-Process npm -ArgumentList "run", "dev" -PassThru
Set-Location ../..

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ScamShield Full Stack is Live!" -ForegroundColor Yellow
Write-Host "  Web App UI:     http://localhost:3000" -ForegroundColor White
Write-Host "  Node Gateway:   http://localhost:5001" -ForegroundColor White
Write-Host "  WebSocket:      ws://localhost:5001/api/stream" -ForegroundColor White
Write-Host "  AI Service API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

