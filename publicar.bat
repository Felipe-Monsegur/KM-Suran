@echo off
REM KM Suran — build + deploy a Firebase (km-suran-96a95)
REM Requiere: npm install, firebase login, .firebaserc con proyecto km-suran-96a95

cd /d "%~dp0"
echo ========================================
echo   KM Suran — publicar en Firebase
echo   Proyecto: km-suran-96a95
echo ========================================
echo.

echo Paso 1: Construyendo la aplicacion...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: La construccion fallo
    pause
    exit /b 1
)
echo.

echo Paso 2: Desplegando Hosting y reglas de Firestore...
firebase deploy --only hosting,firestore:rules
if %errorlevel% neq 0 (
    echo ERROR: El despliegue fallo
    echo Asegurate de haber ejecutado: firebase login
    pause
    exit /b 1
)
echo.

echo ========================================
echo   Publicacion completada
echo ========================================
echo.
echo La URL aparece arriba en la salida de firebase deploy.
echo.
pause
