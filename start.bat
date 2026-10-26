@echo off
echo ==========================================================
echo              Starting ScamShield Platform                  
echo ==========================================================

echo [1/3] Starting FastAPI AI Service on port 8000...
start "ScamShield AI Service" cmd /k "python -m uvicorn services.ai.app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting Node.js Gateway on port 5001...
start "ScamShield Gateway" cmd /k "node apps/gateway/server.js"

echo [3/3] Starting React Web App on port 3000...
start "ScamShield Web" cmd /k "cd apps\web && npm run dev"

echo ==========================================================
echo ScamShield services launched in separate windows!
echo Web UI: http://localhost:3000
echo ==========================================================

