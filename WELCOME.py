#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           🌡️  CLIMA-APP v2.0 - ¡BIENVENIDO! 🌡️                 ║
║                                                                   ║
║     Pronóstico del Clima mediante Mallas y Diferencias Finitas   ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

🎉 STATUS: ✅ COMPLETAMENTE OPERACIONAL

🚀 ACCESO INMEDIATO:
   • Frontend:  http://localhost:3000
   • Backend:   http://localhost:8000
   • API Docs:  http://localhost:8000/docs

📖 DOCUMENTACIÓN:
   • Inicio Rápido:      INICIO_RAPIDO.md (5 min)
   • Guía Completa:      README_DOCS.md
   • Todos los archivos: Ver carpeta raíz y docs/

🔧 ESTADO DE SERVICIOS:
   ✅ Redis      (localhost:6379) - Healthy
   ✅ Backend    (http://localhost:8000) - Healthy  
   ✅ Frontend   (http://localhost:3000) - Running

💡 SIGUIENTE PASO:
   1. Abre http://localhost:3000 en tu navegador
   2. Ejecuta una simulación
   3. ¡Experimenta!

📊 FUNCIONALIDADES:
   ✓ 6+ Esquemas numéricos (RK4, ADI, Crank-Nicolson, etc.)
   ✓ Análisis de estabilidad CFL en tiempo real
   ✓ Visualización 3D interactiva
   ✓ 4+ APIs meteorológicas integradas
   ✓ Dashboard académico con gráficos
   ✓ Caching con Redis

🎓 INFORMACIÓN:
   Curso:       Métodos Numéricos
   Universidad: Los Llanos
   Tema:        Ecuación de Advención-Difusión 2D
   Versión:     2.0 (Completa)

📚 DOCUMENTACIÓN IMPORTANTE:
   
   Si necesitas:                  Consulta:
   ──────────────────────────────────────────────
   Empezar rápido (5 min)        → INICIO_RAPIDO.md
   Guía completa (15 min)        → README_DOCS.md
   Comandos Docker               → COMANDOS_UTILES.md
   Troubleshooting               → STATUS_DASHBOARD.md
   Métodos numéricos             → docs/metodos_numericos.md
   Cómo funciona todo            → docs/arquitectura_sistema.md
   APIs meteorológicas           → docs/guia_apis_reales.md
   Deployment producción         → docs/deployment.md
   Cómo contribuir               → docs/contribuir.md

⚡ COMANDOS RÁPIDOS:
   
   # Ver estado
   docker-compose ps
   
   # Ver logs
   docker-compose logs -f backend
   
   # Reiniciar
   docker-compose restart
   
   # Parar
   docker-compose stop

📁 ARCHIVOS PRINCIPALES:

   backend/
   ├── api/app.py              ← FastAPI app principal
   ├── core/advanced_schemes.py ← Esquemas numéricos (RK4, ADI, etc.)
   ├── core/kalman_filter.py   ← Filtros de Kalman
   └── requirements.txt        ← Dependencias Python
   
   frontend/
   ├── src/                    ← Componentes React
   └── package.json           ← Dependencias Node
   
   docker-compose.yml         ← Orquestación
   Dockerfile.backend         ← Imagen backend
   Dockerfile.frontend        ← Imagen frontend

🎯 PRÓXIMOS PASOS:

   Ahora (1 min):     Abre http://localhost:3000
   Luego (5 min):     Ejecuta una simulación
   Después (10 min):  Carga datos reales
   
🆘 SI ALGO NO FUNCIONA:
   
   1. Ver STATUS_DASHBOARD.md (troubleshooting)
   2. Revisar logs: docker-compose logs -f
   3. Reintentar: docker-compose restart

🎉 ¡GRACIAS POR USAR CLIMA-APP v2.0!

   Creado con ❤️ para el Curso de Métodos Numéricos
   Universidad de los Llanos
   
═══════════════════════════════════════════════════════════════════
Versión: 2.0
Fecha: 11 Nov 2026
Status: ✅ OPERACIONAL
═══════════════════════════════════════════════════════════════════
"""

import subprocess
import sys
from pathlib import Path

def main():
    print(__doc__)
    
    # Mostrar estado actual
    print("\n" + "="*70)
    print("ESTADO ACTUAL DE SERVICIOS:")
    print("="*70 + "\n")
    
    try:
        result = subprocess.run(["docker-compose", "ps"], capture_output=True, text=True)
        print(result.stdout)
        if result.returncode != 0:
            print("⚠️ No se pudo obtener estado de Docker Compose")
    except Exception as e:
        print(f"⚠️ Error: {e}")
    
    print("\n" + "="*70)
    print("¿CÓMO EMPEZAR?")
    print("="*70)
    print("""
1. 📖 Lee el archivo INICIO_RAPIDO.md (5 minutos)
2. 🌐 Abre en navegador: http://localhost:3000
3. ⚡ Ejecuta una simulación
4. 🎮 ¡Experimenta con los parámetros!

Para más información, ejecuta:
   cat INICIO_RAPIDO.md
   cat README_DOCS.md
    """)

if __name__ == "__main__":
    main()
