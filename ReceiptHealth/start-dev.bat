@echo off
REM ReceiptHealth Development Server Starter for Windows
REM This script starts both the backend and frontend servers

echo.
echo 🚀 Starting ReceiptHealth Development Servers...
echo.

REM Start backend server
echo 📡 Starting .NET Backend on http://localhost:5000...
cd %~dp0
start "ReceiptHealth Backend" cmd /k "dotnet run"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server
echo ⚛️  Starting React Frontend on http://localhost:5173...
cd client
start "ReceiptHealth Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting in separate windows!
echo.
echo 📝 Access the application at: http://localhost:5173
echo 📝 API documentation at: http://localhost:5000/swagger
echo.
echo Close the command windows to stop the servers
echo.

pause
