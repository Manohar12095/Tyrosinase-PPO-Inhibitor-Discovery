@echo off
echo =======================================================
echo     CTRL+CELL: Tyrosinase/PPO Inhibitor Discovery 
echo =======================================================
echo.

:: Ensure we are in the correct directory (in case run as admin)
cd /d "%~dp0"

echo Ensuring data files are copied to the webapp...
if not exist "stage6_webapp\public\data" mkdir "stage6_webapp\public\data"
copy /Y "outputs\*.json" "stage6_webapp\public\data\" > nul
copy /Y "outputs\*.md" "stage6_webapp\public\data\" > nul
copy /Y "outputs\*.csv" "stage6_webapp\public\data\" > nul

cd stage6_webapp

echo.
echo Starting the Next.js Server...
:: We start the server in the current window so the user sees the logs
:: We use 'start' to open the browser concurrently in the background

start http://localhost:3000

echo If the browser opens before the server is ready, just refresh the page in a few seconds!
echo.
call npm run start || call npm run dev

pause
