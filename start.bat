@echo off
echo Starting Urban Partner App...

REM Start backend server
echo Starting backend server...
cd "d:\SUPER APP MAIN NEW\SUPER APP MAIN NEW\super_app-main\super_app-main 1\node-backend"
start cmd /k "npm start"

REM Wait for backend to start
timeout /t 5 /nobreak

REM Start frontend
echo Starting frontend...
cd "d:\SUPER APP MAIN NEW\SUPER APP MAIN NEW\super_app-main\urban-partner-app"
start cmd /k "npm start"

echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause
