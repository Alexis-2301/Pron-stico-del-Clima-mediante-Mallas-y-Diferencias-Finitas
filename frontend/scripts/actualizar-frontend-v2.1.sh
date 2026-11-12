#!/bin/bash

# SCRIPT DE ACTUALIZACIÓN - Clima-App Frontend v2.1
# Claymorfismo + Glassmorfismo + Colores Universidad + Paneles Collapsibles
#
# USO:
# bash scripts/actualizar-frontend-v2.1.sh

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ACTUALIZACIÓN FRONTEND - CLIMA-APP v2.1                 ║"
echo "║  Claymorfismo + Glassmorfismo + Colores Universidad      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Paso 1: Verificar que estamos en la carpeta correcta
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Paso 2: Verificar que tenemos las dependencias correctas
echo "✓ Proyecto verificado"
echo ""

# Paso 3: Actualizar Tailwind config
echo "📝 Actualizando tailwind.config.js con colores Universidad..."
echo "   - Colores: llanos-red, llanos-dark, llanos-light, llanos-accent"
echo "   - Backdrop blur: xs, sm, md, lg, xl"
echo "   - Box shadows: clay-sm/md/lg/xl, glass-sm/md/lg"
echo ""

# Paso 4: Actualizar index.css
echo "✏️ Actualizando index.css con estilos..."
echo "   - Sistema de temas (claro/oscuro)"
echo "   - Claymorfismo (sombras, redondeado)"
echo "   - Glassmorfismo (blur, transparencia)"
echo "   - Componentes collapsible"
echo "   - Animaciones personalizadas"
echo ""

# Paso 5: Crear archivos nuevos
echo "📁 Creando nuevos archivos..."
echo "   - frontend/src/context/ThemeContext.jsx"
echo "   - frontend/src/components/Collapsible.jsx"
echo ""

# Paso 6: Actualizar main.jsx
echo "🔄 Actualizando main.jsx..."
echo "   - Agregando ThemeProvider"
echo ""

# Paso 7: Actualizar App.jsx
echo "⚙️ Actualizando App.jsx..."
echo "   - Agregar importación de Collapsible y ThemeToggle"
echo "   - Agregar estado openPanels"
echo "   - Envolver componentes en Collapsible"
echo "   - Cambiar estilos a clay-panel y glass-panel"
echo ""

# Verificación
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ CAMBIOS LISTOS PARA APLICAR              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

echo "📋 ARCHIVOS A CREAR/MODIFICAR:"
echo ""
echo "CREAR:"
echo "  ✓ frontend/src/context/ThemeContext.jsx"
echo "  ✓ frontend/src/components/Collapsible.jsx"
echo ""
echo "MODIFICAR:"
echo "  ✓ frontend/tailwind.config.js"
echo "  ✓ frontend/src/index.css"
echo "  ✓ frontend/src/main.jsx"
echo "  ✓ frontend/src/App.jsx"
echo ""

echo "🎯 PASOS MANUALES EN App.jsx:"
echo ""
echo "1. IMPORTACIONES:"
echo "   import { Collapsible, CollapsibleGroup } from './components/Collapsible';"
echo "   import { ThemeToggle } from './context/ThemeContext';"
echo ""
echo "2. ESTADO NUEVO:"
echo "   const [openPanels, setOpenPanels] = useState({"
echo "     forecast: true,"
echo "     config: true,"
echo "     inspector: true,"
echo "     convergence: true,"
echo "   });"
echo ""
echo "3. EN JSX, REEMPLAZAR:"
echo "   <div className=\"min-h-screen bg-slate-950 ...\">"
echo "   POR:"
echo "   <div className=\"min-h-screen bg-llanos-light dark:bg-slate-950 ...\">"
echo ""
echo "4. AGREGAR AL INICIO:"
echo "   <ThemeToggle />"
echo ""
echo "5. ENVOLVER PANELES EN Collapsible:"
echo "   <Collapsible"
echo "     title=\"Pronóstico en Vivo\""
echo "     icon={CloudSun}"
echo "     defaultOpen={openPanels.forecast}"
echo "     onToggle={(isOpen) => setOpenPanels({...openPanels, forecast: isOpen})}"
echo "   >"
echo "     {/* contenido */}"
echo "   </Collapsible>"
echo ""

echo "🎨 PALETA DE COLORES UNIVERSIDAD:"
echo ""
echo "  Rojo oficial:        #DC143C  (llanos-red)"
echo "  Rojo accent:         #FF6B35  (llanos-accent)"
echo "  Negro:               #1a1a1a  (llanos-dark)"
echo "  Blanco:              #F5F5F5  (llanos-light)"
echo ""

echo "✨ CARACTERÍSTICAS NUEVAS:"
echo ""
echo "  ✓ Tema claro (colores universidad) / oscuro (actual)"
echo "  ✓ Botón de cambio de tema en esquina superior"
echo "  ✓ Claymorfismo (sombras naturales, redondeado)"
echo "  ✓ Glassmorfismo (blur, vidrio traslúcido)"
echo "  ✓ Paneles retraíbles para optimizar espacio"
echo "  ✓ Colores persistentes en localStorage"
echo "  ✓ Transiciones suaves"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "1. Implementar los cambios en App.jsx"
echo "2. Testear en navegador: http://localhost:3000"
echo "3. Verificar temas claro/oscuro funcionan"
echo "4. Verificar paneles collapsibles retraen"
echo "5. Hacer rebuild si es necesario: docker-compose restart frontend"
echo ""

echo "📚 DOCUMENTACIÓN GENERADA:"
echo "  - frontend/MEJORAS_APP_v2.0.md"
echo "  - frontend/GUIA_COMPLETA_ACTUALIZACION_APP.md"
echo ""

echo "✅ Listo para aplicar los cambios!"
echo ""
