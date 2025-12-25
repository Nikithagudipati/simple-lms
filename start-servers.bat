@echo off
echo Starting LMS Servers...
echo.

echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Server on port 8080...
start "Frontend Server" cmd /k "cd frontend-static && node server.js"

echo.
echo Servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Press any key to exit...
pause >nul

