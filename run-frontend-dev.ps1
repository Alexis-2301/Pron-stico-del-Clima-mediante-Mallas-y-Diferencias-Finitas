# Script PowerShell para levantar frontend en desarrollo

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Levantador de Frontend - Modo Desarrollo            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# [1/3] Verificar Node.js
Write-Host "[1/3] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "      ✓ Node.js $nodeVersion encontrado" -ForegroundColor Green
} catch {
    Write-Host "      ✗ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "      Descárgalo desde: https://nodejs.org/" -ForegroundColor Red
    Read-Host "Presiona Enter para continuar..."
    exit
}

# [2/3] Verificar dependencias
Write-Host "`n[2/3] Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "      Instalando dependencias (esto puede tardar 2-3 min)..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
    Write-Host "      ✓ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "      ✓ Dependencias ya instaladas" -ForegroundColor Green
}

# [3/3] Iniciar servidor
Write-Host "`n[3/3] Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  Frontend listo en: http://localhost:5173             ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  Backend debe estar en: http://localhost:8000         ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║  Presiona Ctrl+C para detener                          ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Push-Location frontend
npm run dev
Pop-Location
