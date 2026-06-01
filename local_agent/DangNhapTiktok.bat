@echo off
echo ===================================================
echo   KHOI DONG LOCAL AGENT - AUTO REUP TIKTOK
echo ===================================================
echo.
echo Dang cai dat thu vien (neu chua co)...
call npm install
echo.
echo Dang chay Agent...
node agent.js
pause
