#!/bin/bash
# Script de verificación rápida de servicios

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Verificando Estado de Servicios                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo

echo "[1/3] Verificando Docker Compose..."
docker-compose ps
echo

echo "[2/3] Verificando Backend..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ Backend responde en http://localhost:8000"
    curl -s http://localhost:8000/ | head -c 100
    echo
else
    echo "⏳ Backend aún no responde, mostrando logs..."
    docker-compose logs --tail=20 backend
fi
echo

echo "[3/3] Verificando Frontend..."
if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend responde en http://localhost:3000"
else
    echo "⏳ Frontend aún no responde"
fi
echo

echo "╔════════════════════════════════════════════════════════╗"
echo "║  URLs Disponibles                                       ║"
echo "║  🌐 Frontend:    http://localhost:3000                 ║"
echo "║  📡 Backend:     http://localhost:8000                 ║"
echo "║  📚 API Docs:    http://localhost:8000/docs            ║"
echo "╚════════════════════════════════════════════════════════╝"
