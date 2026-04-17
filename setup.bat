@echo off
REM setup.bat - Automated setup script for Windows

echo ==========================================
echo College Notes Platform - Local Setup
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js not installed. Please install Node.js 14+ first
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo - Node.js found: %NODE_VERSION%

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo - npm found: %NPM_VERSION%

echo.
echo Installing backend dependencies...
cd backend
call npm install

echo.
echo ==========================================
echo Setup complete!
echo ==========================================
echo.
echo Next Steps:
echo 1. Install XAMPP and start MySQL
echo 2. Create database: college_notes_db
echo 3. Update backend\.env with database credentials
echo 4. Start backend: npm start
echo 5. Start frontend: Use Live Server or http-server
echo.
echo ==========================================
pause
