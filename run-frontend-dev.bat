@echo off
REM Levanta el frontend en modo desarrollo local
REM Requiere: Node.js instalado
REM Verifica: Backend debe estar corriendo en http://localhost:8000

echo.
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Verificando dependencias...
if not exist "frontend\node_modules" (
    echo     Instalando dependencias...
    cd frontend
    call npm install
    cd ..
) else (
    echo     OK: Dependencias ya instaladas
)

echo [3/4] Iniciando servidor de desarrollo...
echo.
echo ====================================================
echo   Frontend Desarrollo Local
echo   URL: http://localhost:5173
echo   Press Ctrl+C para detener
echo ====================================================
echo.

cd frontend
call npm run dev
