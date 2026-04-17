#!/bin/bash
# setup-local.sh - Automated setup script for Linux/Mac

echo "=========================================="
echo "College Notes Platform - Local Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Please install Node.js 14+ first"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed"
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Navigate to backend directory
cd backend || exit

echo ""
echo "Installing backend dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Install XAMPP and start MySQL"
echo "2. Create database: college_notes_db"
echo "3. Update backend/.env with database credentials"
echo "4. Start backend: npm start"
echo "5. Start frontend: Use Live Server or http-server"
echo "=========================================="
