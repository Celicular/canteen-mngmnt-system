@echo off
start "Canteen Management - Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"
start "Canteen Management - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
