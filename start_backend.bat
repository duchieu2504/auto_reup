@echo off
echo =======================================================
echo Starting Auto Reup TikTok (Backend Native)
echo =======================================================

cd /d "%~dp0backend"

echo.
echo [*] Starting Backend API Server (Uvicorn)...
:: LƯU Ý: Đã xóa "--reload" để tối ưu hiệu năng và tránh memory leak trong môi trường Production.
start "Backend API Server" cmd /k ".venv\Scripts\uvicorn.exe main:app --host 127.0.0.1 --port 8000"

echo [*] Starting Celery Worker...
start "Celery Worker" cmd /k ".venv\Scripts\celery.exe -A app.core.celery_app worker --loglevel=info --pool=solo"

echo.
echo [*] Commands sent successfully!
echo [*] The system is running in the background.
echo [*] This window will close automatically...
timeout /t 3 >nul
exit
