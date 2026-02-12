#!/bin/bash

# ReceiptHealth Development Server Starter
# This script starts both the backend and frontend servers

echo "🚀 Starting ReceiptHealth Development Servers..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Register cleanup function
trap cleanup EXIT INT TERM

# Start backend server
echo "📡 Starting .NET Backend on http://localhost:5000..."
cd "$(dirname "$0")"
dotnet run &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "⚛️  Starting React Frontend on http://localhost:5173..."
cd client
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo ""
echo "📝 Access the application at: http://localhost:5173"
echo "📝 API documentation at: http://localhost:5000/swagger"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for background processes
wait
