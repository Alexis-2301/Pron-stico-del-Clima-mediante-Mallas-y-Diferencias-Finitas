/*
 * GUÍA DE ACTUALIZACIÓN - App.jsx v2.0
 * 
 * Este archivo contiene la estrategia completa para actualizar el App.jsx
 * con Claymorfismo, Glassmorfismo, Colores Universidad y Paneles Collapsibles
 */

// PASO 1: AGREGAR ESTAS IMPORTACIONES AL INICIO
// ================================================

import { Collapsible, CollapsibleGroup } from './components/Collapsible';
import { ThemeToggle } from './context/ThemeContext';
import {
  Clock,
  Settings,
  BarChart3,
  // ... mantener los otros iconos existentes
} from 'lucide-react';

// PASO 2: AGREGAR ESTOS ESTADOS AL COMPONENTE
// ================================================

const [openPanels, setOpenPanels] = useState({
  forecast: true,
  config: true,
  inspector: true,
  convergence: true,
});

// PASO 3: REEMPLAZAR LA SECCIÓN DE RETORNO
// ================================================

// REEMPLAZAR TODA LA SECCIÓN return POR:

return (
  <div className="min-h-screen bg-llanos-light dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-3 sm:p-6 lg:p-8 transition-colors duration-300">
    
    {/* Botón de cambio de tema */}
    <ThemeToggle />
    
    {/* RESTO DEL CONTENIDO IGUAL PERO CON ESTOS CAMBIOS: */}
    
    <div className="max-w-7xl mx-auto space-y-5">
      
      {/* Cabecera mejorada con claymorfismo */}
      <header className="clay-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest llanos-red-text mb-1">
            <CloudSun className="h-4 w-4" />
            <span>Simulador de Clima 3D · Métodos Numéricos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight llanos-red-text flex items-center gap-2">
            Pronóstico Meteorológico con Diferencias Finitas
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Predice el clima en 24 horas usando la ecuación de advección-difusión 2D. Conecta datos reales satelitales
            de Open-Meteo o simula frentes atmosféricos en 3D.
          </p>
        </div>

        {/* Selector de modo Simple vs Académico */}
        <div className="flex rounded-xl glass-panel-sm self-start md:self-center">
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'simple'
                ? 'gradient-llanos text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Vista Intuitiva
          </button>
          <button
            onClick={() => setActiveTab('tecnico')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'tecnico'
                ? 'gradient-llanos text-white shadow-md'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            Modo Académico
          </button>
        </div>
      </header>

      {/* Banner de Estado: Modo Real vs Modo Sintético */}
      {realWeatherInfo ? (
        <div className="clay-card-sm border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-500/20 p-2.5 text-emerald-600 dark:text-emerald-400">
                <Satellite className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <span>Modo Clima Real en Vivo Activo</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </span>
                <p className="text-gray-600 dark:text-slate-300 text-xs">
                  Malla alimentada con estaciones de: <strong>{realWeatherInfo.regionName}</strong> vía Open-Meteo.
                  Viento medio medido: {realWeatherInfo.avgU} m/s Este, {realWeatherInfo.avgV} m/s Norte.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearRealWeather}
              className="clay-button-secondary text-xs font-mono"
            >
              Restablecer a modo didáctico
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-panel border-l-4 border-llanos-red">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-llanos-red/10 dark:bg-llanos-red/20 p-2.5 text-llanos-red shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm space-y-1">
              <span className="font-bold llanos-red-text block">¿Cómo interpretar el mapa?</span>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-xs">
                🏔️ <strong>Montaña cálida:</strong> Masa caliente ({params.hot_spot_temp} °C). <br />
                🌧️ <strong>Lluvia en 3D:</strong> Cuando el aire caliente choca con humedad saturada (&gt;72%), verás
                caer gotas de lluvia en 3D.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Zona Principal de Trabajo */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Lado Izquierdo: Visualizador 3D o 2D + Reproductor de Tiempo (7 cols) */}
        <section className="lg:col-span-7 space-y-4">
          <div className="glass-panel h-96">
            {viewMode === '3d' ? (
              <ThreeViewer
                matrix={currentMatrix}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                u={params.u}
                v={params.v}
                minVal={realWeatherInfo ? Math.floor(realWeatherInfo.minT) - 2 : 12}
                maxVal={realWeatherInfo ? Math.ceil(realWeatherInfo.maxT) + 3 : 38}
                showGrid={showGrid}
                showWind={showWind}
                showRain={currentNodeHum >= 70}
                reliefHeight={2.8}
              />
            ) : (
              <Heatmap
                matrix={currentMatrix}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                u={params.u}
                v={params.v}
                minVal={realWeatherInfo ? Math.floor(realWeatherInfo.minT) - 2 : 12}
                maxVal={realWeatherInfo ? Math.ceil(realWeatherInfo.maxT) + 3 : 38}
                showGrid={showGrid}
                showWind={showWind}
              />
            )}
          </div>

          {/* Controles de Reproducción 24 Horas - COLLAPSIBLE */}
          <Collapsible
            title="Pronóstico en Vivo - Hora Simulada 00:00"
            icon={Clock}
            defaultOpen={openPanels.forecast}
            onToggle={(isOpen) => setOpenPanels({...openPanels, forecast: isOpen})}
          >
            <TimeControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStep={() => setCurrentStep((prev) => Math.min(simulation.snapshots.length - 1, prev + 1))}
              onReset={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              currentIndex={currentStep}
              totalSnapshots={simulation ? simulation.snapshots.length : 1}
              timestamps={simulation ? simulation.timestamps : []}
              speed={speed}
              onChangeSpeed={setSpeed}
              onSeek={setCurrentStep}
            />
          </Collapsible>
        </section>

        {/* Lado Derecho: Paneles Retraíbles (5 cols) */}
        <aside className="lg:col-span-5 space-y-4">
          
          {/* Pronóstico en Vivo - COLLAPSIBLE */}
          <Collapsible
            title="Pronóstico en Vivo"
            icon={CloudSun}
            defaultOpen={openPanels.forecast}
            onToggle={(isOpen) => setOpenPanels({...openPanels, forecast: isOpen})}
          >
            <WeatherForecastCard
              temp={currentNodeTemp}
              humidity={currentNodeHum}
              pressure={currentNodePres}
              windSpeed={windMagnitude}
              currentTimeSec={currentTimeSec}
              onJumpToTime={setCurrentStep}
              snapshots={simulation ? simulation.snapshots : []}
              humiditySnapshots={simulation ? simulation.humiditySnapshots : []}
              pressureSnapshots={simulation ? simulation.pressureSnapshots : []}
              timestamps={simulation ? simulation.timestamps : []}
              selectedNode={selectedNode}
            />
          </Collapsible>

          {/* Configuración Física - COLLAPSIBLE */}
          <Collapsible
            title="Configuración Física"
            icon={Settings}
            defaultOpen={openPanels.config}
            onToggle={(isOpen) => setOpenPanels({...openPanels, config: isOpen})}
          >
            <Controls
              params={params}
              onChangeParam={handleParamChange}
              onApplyPreset={handleApplyPreset}
              backendOnline={backendOnline}
              useBackend={useBackend}
              onToggleUseBackend={() => setUseBackend(!useBackend)}
              showGrid={showGrid}
              onToggleGrid={setShowGrid}
              showWind={showWind}
              onToggleWind={setShowWind}
              onRunSimulation={() => executeSimulation(params)}
              isCalculating={isCalculating}
              onLoadRealWeather={handleLoadRealWeather}
              isLoadingRealWeather={isLoadingRealWeather}
              realWeatherInfo={realWeatherInfo}
              onClearRealWeather={handleClearRealWeather}
            />
          </Collapsible>

          {/* Estabilidad CFL */}
          <div className="glass-panel">
            <StabilityBadge
              C={Math.abs(params.u) * params.dt / params.dx}
              r={params.alpha * params.dt / (params.dx * params.dx)}
              isStable={liveStability.is_stable}
              isOptimal={liveStability.is_optimal}
              message={liveStability.message}
            />
          </div>
        </aside>
      </main>

      {/* Sección Inferior: Modo Académico */}
      {activeTab === 'tecnico' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-llanos-red border-opacity-20 pt-6">
          
          {/* Inspector del Nodo - COLLAPSIBLE */}
          <div className="lg:col-span-4">
            <Collapsible
              title="Inspector del Nodo"
              icon={Box}
              defaultOpen={openPanels.inspector}
              onToggle={(isOpen) => setOpenPanels({...openPanels, inspector: isOpen})}
            >
              <Inspector
                matrix={currentMatrix}
                selectedNode={selectedNode}
                alpha={params.alpha}
                u={params.u}
                v={params.v}
                dx={params.dx}
                dt={params.dt}
              />
            </Collapsible>
          </div>

          {/* Evolución del Nodo - COLLAPSIBLE */}
          <div className="lg:col-span-8">
            <Collapsible
              title="Evolución del Nodo en 24 Horas"
              icon={BarChart3}
              defaultOpen={openPanels.convergence}
              onToggle={(isOpen) => setOpenPanels({...openPanels, convergence: isOpen})}
            >
              <ConvergenceGraph
                nodeHistory={nodeHistory}
                timestamps={simulation ? simulation.timestamps : []}
                gridH={params.dx / 1000}
              />
            </Collapsible>
          </div>
        </section>
      )}

    </div>
  </div>
);

/*
 * CAMBIOS CLAVE REALIZADOS:
 * 
 * 1. TEMA (Light/Dark):
 *    - Fondo claro (llanos-light) con colores de la universidad
 *    - Fondo oscuro (slate-950) para modo oscuro
 *    - Botón ThemeToggle en esquina superior derecha
 * 
 * 2. CLAYMORFISMO:
 *    - Clases `.clay-panel`, `.clay-card-sm`
 *    - Sombras suaves y naturales
 *    - Bordes redondeados (24px, 16px, 12px)
 *    - Colores de relleno con transparencias
 * 
 * 3. GLASSMORFISMO:
 *    - Clases `.glass-panel`, `.glass-panel-sm`
 *    - backdrop-filter: blur(12px)
 *    - Bordes translúcidos
 *    - Sombras sutiles
 * 
 * 4. COLORES UNIVERSIDAD:
 *    - Rojo: #DC143C (llanos-red)
 *    - Rojo accent: #FF6B35 (llanos-accent)
 *    - Negro: #1a1a1a (llanos-dark)
 *    - Blanco: #F5F5F5 (llanos-light)
 * 
 * 5. PANELES COLLAPSIBLES:
 *    - Todos los paneles principales ahora son collapsibles
 *    - Estado guardado en `openPanels`
 *    - Iconos descriptivos
 *    - Transiciones suaves
 * 
 * 6. ESTRUCTURA MEJORADA:
 *    - Cabecera con estilos university
 *    - Visualizador en glass-panel
 *    - Controles retraíbles
 *    - Sección académica con collapsibles
 */
