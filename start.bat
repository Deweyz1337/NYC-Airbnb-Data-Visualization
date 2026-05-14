@echo off
echo =======================================================
echo    Starting Airbnb NYC Data Visualization Dashboard
echo =======================================================
echo.
echo Please wait while we start the local server...
echo The dashboard will automatically open in your default browser.
echo.

:: Open the browser
start "" "http://localhost:8000/Code/index.html"

:: Run http-server in the current directory
npx -y http-server . -p 8000
