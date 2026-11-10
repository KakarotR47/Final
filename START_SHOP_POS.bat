@echo off
:: ====================================================================
:: SA BROTHERS VENDORS - LOCAL SHOP COMPUTER POS LAUNCHER
:: Double-click this file to launch the POS software on your shop PC.
:: Runs 100% locally on your computer. All data is saved to hard disk.
:: ====================================================================

title SA Brothers Vendors POS - Local Terminal
color 0A
cd /d "%~dp0"

echo.
echo  ==============================================================
echo     SA BROTHERS VENDORS - POINT OF SALE & INVENTORY TERMINAL
echo  ==============================================================
echo     Mode: Local Shop Counter Computer Only
echo     Data Storage: Local Hard Drive (100%% Offline Ready)
echo  ==============================================================
echo.

:: 0. If standalone SA_Brothers_POS.exe is present, launch it directly (zero dependencies!)
if exist "SA_Brothers_POS.exe" (
    echo [LAUNCH] Starting standalone Windows application SA_Brothers_POS.exe...
    start "" "SA_Brothers_POS.exe"
    exit /b
)

:: 1. Otherwise check if Node.js is installed on computer
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] SA_Brothers_POS.exe or Node.js was not found!
    echo Please place SA_Brothers_POS.exe in this folder or install Node.js from https://nodejs.org
    echo.
    pause
    exit /b
)

:: 2. Check dependencies
if not exist "node_modules\" (
    echo [SETUP] First-time setup detected. Installing local packages...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install packages. Please check your internet connection for first-time setup.
        pause
        exit /b
    )
)

:: 3. Start local background server using tsx
echo [1/3] Initializing local POS database engine on port 3000...
start /B npx tsx server.ts > local_server.log 2>&1

:: Wait 3 seconds for local server to spin up
echo [2/3] Waiting for local server to be ready...
timeout /t 3 /nobreak >nul

:: 4. Launch Clean Desktop App Window (No address bar, looks like native software)
echo [3/3] Opening SA Brothers POS desktop application...

:: Try Google Chrome App Mode
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1366,768
    goto launched
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000 --window-size=1366,768
    goto launched
)

:: Try Microsoft Edge App Mode
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1366,768
    goto launched
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000 --window-size=1366,768
    goto launched
)

:: Fallback to default browser
start http://localhost:3000

:launched
echo.
echo  ==============================================================
echo     SUCCESS: POS is now running on your shop computer!
echo     URL: http://localhost:3000
echo     Keep this command window open or minimized while using POS.
echo  ==============================================================
echo.
