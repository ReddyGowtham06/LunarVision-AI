@echo off
echo ========================================================
echo  Launching LunarVision AI - Scientific Imaging Platform
echo ========================================================
echo.

echo Starting Python FastAPI backend on http://127.0.0.1:8000 ...
start "LunarVision AI Backend" cmd /k "backend\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite React TypeScript frontend on http://127.0.0.1:5173 ...
start "LunarVision AI Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo  Both services launched!
echo  Open your browser to: http://localhost:5173/
echo ========================================================
pause
