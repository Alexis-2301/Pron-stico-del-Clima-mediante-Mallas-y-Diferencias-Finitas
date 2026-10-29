import React, { useState, useEffect } from 'react';
import ThreeViewer from './components/ThreeViewer';
import Heatmap from './components/Heatmap';
import Controls from './components/Controls';
import TimeControls from './components/TimeControls';
import StabilityBadge from './components/StabilityBadge';
import Inspector from './components/Inspector';
import ConvergenceGraph from './components/ConvergenceGraph';
import WeatherForecastCard from './components/WeatherForecastCard';
import { simulateLocal, checkLocalStability, calculateDtMax } from './services/localKernel';
import { checkBackendHealth, runApiSimulation } from './services/api';
import { loadRealWeatherGrid } from './services/realWeather';
import {
  CloudSun,
  Flame,
  Wind,
  Info,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Layers,
  Box,
  HelpCircle,
  Satellite,
  Globe,
} from 'lucide-react';

export default function App() {
  const [params, setParams] = useState({
    ny: 40,
    nx: 40,
    dx: 10000,
    alpha: 6000,
    u: 8,
    v: 3,
    dt: 450,
    total_time: 86400,
    save_interval: 600,
    base_temp: 18,
    hot_spot_temp: 36,
    hot_spot_sigma: 4.5,
    boundary_type: 'dirichlet',
  });

  const [simulation, setSimulation] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState({ i: 20, j: 20 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [backendOnline, setBackendOnline] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Clima real
  const [realWeatherInfo, setRealWeatherInfo] = useState(null);
  const [isLoadingRealWeather, setIsLoadingRealWeather] = useState(false);

  // Opciones de visualización
  const [viewMode, setViewMode] = useState('3d');
  const [activeTab, setActiveTab] = useState('simple');
  const [showWind, setShowWind] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Probar estado de API al iniciar
  useEffect(() => {
    checkBackendHealth().then((isHealthy) => {
      setBackendOnline(isHealthy);
      if (isHealthy) setUseBackend(true);
    });
  }, []);

  // Ejecución de la simulación
  const executeSimulation = async (currentParams = params, forceBackend = useBackend) => {
    setIsCalculating(true);
    try {
      if (forceBackend && backendOnline && !currentParams.initialT) {
        const res = await runApiSimulation({
          ...currentParams,
          enforce_stability: false,
        });
        setSimulation(res);
        setCurrentStep(0);
      } else {
        const res = simulateLocal(currentParams);
        setSimulation(res);
        setCurrentStep(0);
      }
    } catch (err) {
      console.warn('API error, using local engine:', err.message);
      const res = simulateLocal(currentParams);
      setSimulation(res);
      setCurrentStep(0);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    executeSimulation(params, useBackend);
  }, []);

  // Bucle de reproducción de 24 horas
  useEffect(() => {
    let timer = null;
    if (isPlaying && simulation && simulation.snapshots.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= simulation.snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, simulation]);

  const handleParamChange = (key, value) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    if (key === 'ny' || key === 'nx') {
      setSelectedNode({ i: Math.floor(updated.ny / 2), j: Math.floor(updated.nx / 2) });
    }
  };

  const handleApplyPreset = (presetParams) => {
    setRealWeatherInfo(null);
    const { initialT, initialH, initialP, ...rest } = params;
    const updated = { ...rest, ...presetParams };
    setParams(updated);
    setSelectedNode({ i: Math.floor(updated.ny / 2), j: Math.floor(updated.nx / 2) });
    executeSimulation(updated);
  };

  const handleAutoFitDt = () => {
    const dtMax = calculateDtMax(params.alpha, params.u, params.v, params.dx);
    const safeDt = Math.max(30, Math.floor((dtMax * 0.9) / 30) * 30);
    handleParamChange('dt', safeDt);
  };

  // Cargar Clima Real de Open-Meteo
  const handleLoadRealWeather = async (regionId) => {
    setIsLoadingRealWeather(true);
    try {
      const realData = await loadRealWeatherGrid(regionId, params.ny, params.nx);
      setRealWeatherInfo(realData);

      const updatedParams = {
        ...params,
        u: realData.avgU,
        v: realData.avgV,
        initialT: realData.T,
        initialH: realData.H,
        initialP: realData.P,
        base_temp: Math.floor(realData.minT),
        hot_spot_temp: Math.ceil(realData.maxT),
      };
      setParams(updatedParams);
      await executeSimulation(updatedParams, false);
    } catch (err) {
      alert('Error cargando clima real: ' + err.message);
    } finally {
      setIsLoadingRealWeather(false);
    }
  };

  const handleClearRealWeather = () => {
    setRealWeatherInfo(null);
    const { initialT, initialH, initialP, ...rest } = params;
    const cleanParams = {
      ...rest,
      base_temp: 18,
      hot_spot_temp: 36,
      u: 8,
      v: 3,
    };
    setParams(cleanParams);
    executeSimulation(cleanParams);
  };

  const liveStability = checkLocalStability(params.alpha, params.u, params.v, params.dx, params.dt);

  const currentMatrix =
    simulation && simulation.snapshots && simulation.snapshots[currentStep]
      ? simulation.snapshots[currentStep]
      : [];

  const nodeHistory =
    simulation && simulation.snapshots && selectedNode
      ? simulation.snapshots.map((snap) => snap[selectedNode.i]?.[selectedNode.j] ?? 0)
      : [];

  const currentNodeTemp =
    simulation && simulation.snapshots && simulation.snapshots[currentStep]
      ? simulation.snapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? params.base_temp
      : params.base_temp;

  const currentNodeHum =
    simulation && simulation.humiditySnapshots && simulation.humiditySnapshots[currentStep]
      ? simulation.humiditySnapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? 60
      : 60;

  const currentNodePres =
    simulation && simulation.pressureSnapshots && simulation.pressureSnapshots[currentStep]
      ? simulation.pressureSnapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? 1012
      : 1012;

  const currentTimeSec =
    simulation && simulation.timestamps && simulation.timestamps[currentStep] !== undefined
      ? simulation.timestamps[currentStep]
      : 0;

  const windMagnitude = Math.hypot(params.u, params.v);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Cabecera Principal */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
              <CloudSun className="h-4 w-4" />
              <span>Simulador de Clima 3D · Métodos Numéricos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Pronóstico Meteorológico con Diferencias Finitas
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Predice el clima en 24 horas usando la ecuación de advección-difusión 2D. Conecta datos reales satelitales
              de Open-Meteo o simula frentes atmosféricos en 3D.
            </p>
          </div>

          {/* Selector de modo Simple vs Académico */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 self-start md:self-center">
            <button
              onClick={() => setActiveTab('simple')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'simple'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Vista Intuitiva
            </button>
            <button
              onClick={() => setActiveTab('tecnico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tecnico'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Modo Académico
            </button>
          </div>
        </header>

        {/* Banner de Estado: Modo Real vs Modo Sintético */}
        {realWeatherInfo ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900/50 to-teal-950/40 p-4 shadow-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400">
                <Satellite className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-emerald-300 flex items-center gap-2">
                  <span>Modo Clima Real en Vivo Activo</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                </span>
                <p className="text-slate-300 text-xs">
                  Malla alimentada con estaciones de: <strong>{realWeatherInfo.regionName}</strong> vía Open-Meteo.
                  Viento medio medido: {realWeatherInfo.avgU} m/s Este, {realWeatherInfo.avgV} m/s Norte.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearRealWeather}
              className="text-xs font-mono text-emerald-300 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/60 px-3 py-1.5 rounded-lg transition"
            >
              Restablecer a modo didáctico
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-slate-900/40 to-sky-950/30 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 shrink-0 mt-0.5">
                <Info className="h-5 w-5" />
              </div>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-bold text-amber-300 block">¿Cómo interpretar el mapa?</span>
                <p className="text-slate-300 leading-relaxed text-xs">
                  🏔️ <strong>Montaña cálida:</strong> Masa caliente ({params.hot_spot_temp} °C). <br />
                  🌧️ <strong>Lluvia en 3D:</strong> Cuando el aire caliente choca con humedad saturada (&gt;72%), verás
                  caer gotas de lluvia en 3D. O usa el botón <strong>"Cargar Clima Real en Vivo"</strong> para usar satélites reales.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setViewMode('3d')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === '3d' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Box className="h-3.5 w-3.5" />
                Relieve 3D
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === '2d' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Mapa 2D
              </button>
            </div>
          </div>
        )}

        {/* Zona Principal de Trabajo */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lado Izquierdo: Visualizador 3D o 2D + Reproductor de Tiempo (7 cols) */}
          <section className="lg:col-span-7 space-y-4">
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

            {/* Controles de Reproducción 24 Horas */}
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
          </section>

          {/* Lado Derecho: Tarjeta del Clima Humano + Controles (5 cols) */}
          <aside className="lg:col-span-5 space-y-4">
            {/* Tarjeta de Pronóstico Humano */}
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

            {/* Tarjeta de Estabilidad Numérica */}
            <div
              className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition ${
                liveStability.is_stable
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-rose-500/40 bg-rose-950/30 animate-pulse'
              }`}
            >
              <div className="flex items-center gap-2">
                {liveStability.is_stable ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                )}
                <span className="font-bold text-sm">
                  {liveStability.is_stable ? 'Cálculo Numérico Estable' : '¡La Simulación se Rompió!'}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                {liveStability.is_stable ? (
                  <>
                    Avanzando en pasos de <strong>{Math.round(params.dt / 60)} min</strong>. La física se calcula sin
                    errores.
                  </>
                ) : (
                  <>
                    Paso de <strong>{Math.round(params.dt / 60)} min</strong> muy grande. El viento superó el límite
                    CFL y la temperatura explotó.
                  </>
                )}
              </p>

              {!liveStability.is_stable && (
                <button
                  onClick={handleAutoFitDt}
                  className="mt-3 w-full rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold py-2 text-xs transition"
                >
                  Corregir a paso seguro ({Math.floor(liveStability.dt_max)} s)
                </button>
              )}
            </div>

            {/* Panel de Controles */}
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
          </aside>
        </main>

        {/* Sección Inferior: Conmutable entre Modo Intuitivo y Académico */}
        {activeTab === 'tecnico' ? (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-slate-800 pt-6">
            <div className="lg:col-span-4">
              <Inspector
                matrix={currentMatrix}
                selectedNode={selectedNode}
                alpha={params.alpha}
                u={params.u}
                v={params.v}
                dx={params.dx}
                dt={params.dt}
              />
            </div>

            <div className="lg:col-span-8">
              <ConvergenceGraph
                nodeHistory={nodeHistory}
                timestamps={simulation ? simulation.timestamps : []}
                gridH={params.dx / 1000}
              />
            </div>
          </section>
        ) : (
          /* Explicación didáctica simple */
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                <Flame className="h-4 w-4" />
                <span>1. Calor y Temperatura (T)</span>
              </div>
              <p className="leading-relaxed">
                Muestra si el aire es cálido o frío. La difusión térmica reparte el calor suavemente entre los nodos
                vecinos buscando el equilibrio natural.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-400 text-sm">
                <Wind className="h-4 w-4" />
                <span>2. Viento y Presión (P, V)</span>
              </div>
              <p className="leading-relaxed">
                El viento transporta las masas de aire a lo largo del mapa. La baja presión en el centro caliente crea
                inestabilidad que puede desatar tormentas.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-sm">
                <HelpCircle className="h-4 w-4" />
                <span>3. Humedad y Lluvia (H)</span>
              </div>
              <p className="leading-relaxed">
                Cuando la humedad en un punto supera el 70%, el vapor se condensa. El sistema activa automáticamente la
                alerta de lluvia y muestra gotas cayendo en 3D.
              </p>
            </div>
          </section>
        )}

        {/* Pie de página */}
        <footer className="border-t border-slate-800/80 pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <span>Universidad de los Llanos · Métodos Numéricos</span>
          <span>Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez</span>
        </footer>
      </div>
    </div>
  );
}
