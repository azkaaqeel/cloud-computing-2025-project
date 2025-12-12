#!/bin/bash
# Start Backend Server Script

echo "🚀 Starting HireHive Labs Backend Server..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Using default configuration from server.js"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "🌐 Starting server on http://localhost:3000"
echo "   - Frontend: http://localhost:3000"
echo "   - API: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
