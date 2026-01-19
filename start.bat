@echo off
echo ========================================
echo  STIMULATOR MUSCULAR - Quick Start
echo ========================================
echo.

echo [1/2] Starting Flask Backend Server...
cd backend
start cmd /k "python app.py"

timeout /t 3 /nobreak > nul

echo.
echo [2/2] Opening Frontend in Browser...
cd ../frontend
start http://localhost:8000
start cmd /k "python -m http.server 8000"

echo.
echo ========================================
echo  Application Started!
echo ========================================
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:8000
echo ========================================
echo.
echo Press any key to exit this window...
pause > nul
