@echo off
REM Movie NaPi — servidor de desarrollo (Vite)
REM Firebase: movie-napi

cd /d "%~dp0"
echo Movie NaPi — modo desarrollo
echo.
echo Abri: http://localhost:5173
echo.
echo Ctrl+C para detener
echo.

npm run dev

pause
