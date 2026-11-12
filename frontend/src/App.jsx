import React, { useState, useEffect } from 'react';
import ThreeViewer from './components/ThreeViewer';
import Heatmap from './components/Heatmap';
import Controls from './components/Controls';
import TimeControls from './components/TimeControls';
import StabilityBadge from './components/StabilityBadge';
import Inspector from './components/Inspector';
import ConvergenceGraph from './components/ConvergenceGraph';
import WeatherForecastCard from './components/WeatherForecastCard';
import { Collapsible, CollapsibleGroup } from './components/Collapsible';
import { ThemeToggle } from './context/ThemeContext';
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
  Clock,
  Settings,
  BarChart3,
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

  // Estado de paneles retraíbles
  const [openPanels, setOpenPanels] = useState({
    forecast: true,
    config: true,
    inspector: true,
    convergence: true,
  });

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

  const hourDisplay = String(Math.floor(currentTimeSec / 3600)).padStart(2, '0');
  const minDisplay = String(Math.floor((currentTimeSec % 3600) / 60)).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-llanos-light via-slate-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 font-sans p-6 lg:p-8 transition-colors duration-300">
      <ThemeToggle />

      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* ENCABEZADO - Moderno y Limpio */}
        <header className="clay-panel">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <CloudSun className="h-6 w-6 llanos-red-text" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider llanos-red-text">Simulador 3D</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 llanos-red-text">Pronóstico de Clima</h1>
              <p className="text-lg text-gray-600 dark:text-slate-400 font-medium">
                Métodos numéricos avanzados con Runge-Kutta 4, Crank-Nicolson y Kalman Filter
              </p>
            </div>

            {/* Selector de Modo */}
            <div className="flex rounded-xl glass-panel-sm p-1 self-start lg:self-center">
              <button
                onClick={() => setActiveTab('simple')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'simple'
                    ? 'gradient-llanos text-white shadow-md'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Intuitivo
              </button>
              <button
                onClick={() => setActiveTab('tecnico')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'tecnico'
                    ? 'gradient-llanos text-white shadow-md'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                Técnico
              </button>
            </div>
          </div>
        </header>

        {/* BANNER ESTADO */}
        {realWeatherInfo ? (
          <div className="clay-panel card-gradient-green border-l-4 border-emerald-500">
            <div className="flex items-center gap-4">
              <Satellite className="h-8 w-8 text-emerald-500 animate-pulse" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Modo Clima Real Activo</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Datos de {realWeatherInfo.regionName} · Viento: {realWeatherInfo.avgU} m/s E, {realWeatherInfo.avgV} m/s N
                </p>
              </div>
              <button
                onClick={handleClearRealWeather}
                className="clay-button text-sm whitespace-nowrap"
              >
                Modo Didáctico
              </button>
            </div>
          </div>
        ) : (
          <div className="clay-panel card-gradient-blue border-l-4 border-blue-500">
            <div className="flex items-start lg:items-center gap-4 flex-col lg:flex-row">
              <Info className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">Modo Didáctico</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Simula frentes atmosféricos con montaña caliente a {params.hot_spot_temp}°C. Lluvia se activa cuando humedad &gt; 70%
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition ${ viewMode === '3d' ? 'gradient-llanos text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300' }`}
                >
                  <Box className="h-4 w-4 inline mr-1" /> 3D
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition ${ viewMode === '2d' ? 'gradient-llanos text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300' }`}
                >
                  <Layers className="h-4 w-4 inline mr-1" /> 2D
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GRID PRINCIPAL - Dashboard 3 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA 1-2: Visualizador Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Tarjeta Visualizador */}
            <div className="clay-panel card-gradient-purple overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <Box className="h-6 w-6 text-purple-500" />
                <h2 className="text-2xl font-bold">Visualizador Interactivo</h2>
                <span className="ml-auto text-sm font-mono bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-lg">
                  {hourDisplay}:{minDisplay}
                </span>
              </div>
              <div className="h-[500px] bg-slate-900 rounded-xl overflow-hidden">
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
            </div>

            {/* Tarjeta Controles de Tiempo */}
            <div className="clay-panel card-gradient-blue">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-blue-500" />
                <h2 className="text-2xl font-bold">Línea de Tiempo</h2>
                <span className="ml-auto text-sm font-semibold llanos-red-text">
                  {currentStep} / {simulation ? simulation.snapshots.length : 0}
                </span>
              </div>
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
            </div>
          </div>

          {/* COLUMNA 3: Paneles Laterales */}
          <div className="space-y-8">
            {/* Pronóstico en Vivo */}
            <div className="clay-panel card-gradient-orange">
              <div className="flex items-center gap-3 mb-4">
                <CloudSun className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold">Pronóstico</h2>
              </div>
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
            </div>

            {/* Estabilidad Numérica */}
            <div className={`clay-panel ${liveStability.is_stable ? 'card-gradient-green' : 'card-gradient-red'} transition`}>
              <div className="flex items-center gap-3 mb-4">
                {liveStability.is_stable ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-rose-500" />
                )}
                <h2 className="text-xl font-bold">
                  {liveStability.is_stable ? 'Estable' : 'Inestable'}
                </h2>
              </div>
              <p className="text-sm mb-4">
                {liveStability.is_stable ? (
                  <>Paso {Math.round(params.dt / 60)} min sin errores</>
                ) : (
                  <>Paso muy grande - Máximo: {Math.floor(liveStability.dt_max)}s</>
                )}
              </p>
              {!liveStability.is_stable && (
                <button onClick={handleAutoFitDt} className="clay-button w-full text-sm">
                  Auto-corregir
                </button>
              )}
            </div>

            {/* Configuración */}
            <Collapsible
              title="Configuración Física"
              icon={Settings}
              defaultOpen={openPanels.config}
              onToggle={(isOpen) => setOpenPanels({...openPanels, config: isOpen})}
            >
              <div className="clay-panel card-gradient-orange mt-2">
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
              </div>
            </Collapsible>
          </div>
        </div>

        {/* SECCIÓN INFERIOR - Modo Técnico */}
        {activeTab === 'tecnico' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-slate-300 dark:border-slate-700">
            {/* Inspector del Nodo */}
            <Collapsible
              title="Inspector del Nodo"
              icon={Box}
              defaultOpen={openPanels.inspector}
              onToggle={(isOpen) => setOpenPanels({...openPanels, inspector: isOpen})}
            >
              <div className="clay-panel card-gradient-blue mt-2">
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
            </Collapsible>

            {/* Evolución Temporal */}
            <Collapsible
              title="Evolución en 24 Horas"
              icon={BarChart3}
              defaultOpen={openPanels.convergence}
              onToggle={(isOpen) => setOpenPanels({...openPanels, convergence: isOpen})}
            >
              <div className="clay-panel card-gradient-purple mt-2">
                <ConvergenceGraph
                  nodeHistory={nodeHistory}
                  timestamps={simulation ? simulation.timestamps : []}
                  gridH={params.dx / 1000}
                />
              </div>
            </Collapsible>
          </div>
        )}

        {/* MODO INTUITIVO - Explicación */}
        {activeTab === 'simple' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            <div className="clay-panel card-gradient-red">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-bold">Temperatura</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Difusión térmica que reparte el calor entre nodos vecinos, buscando equilibrio natural
              </p>
            </div>

            <div className="clay-panel card-gradient-orange">
              <div className="flex items-center gap-3 mb-3">
                <Wind className="h-6 w-6 text-orange-500" />
                <h3 className="text-lg font-bold">Viento y Presión</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Advección que transporta masas de aire. La baja presión crea inestabilidad
              </p>
            </div>

            <div className="clay-panel card-gradient-green">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="h-6 w-6 text-green-500" />
                <h3 className="text-lg font-bold">Humedad y Lluvia</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Condensación cuando humedad &gt; 70%. Se activa lluvia en 3D automáticamente
              </p>
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA */}
        <footer className="border-t border-slate-300 dark:border-slate-700 pt-8 pb-4 text-center text-sm text-gray-600 dark:text-slate-400 font-medium">
          <p>Universidad de Los Llanos · Pronóstico del Clima mediante Mallas y Diferencias Finitas</p>
          <p className="text-xs mt-2">Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez</p>
        </footer>
      </div>
    </div>
  );
}
