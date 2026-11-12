import React, { useState, useEffect } from 'react';
import ThreeViewer from './components/ThreeViewer';
import Heatmap from './components/Heatmap';
import Controls from './components/Controls';
import TimeControls from './components/TimeControls';
import StabilityBadge from './components/StabilityBadge';
import Inspector from './components/Inspector';
import ConvergenceGraph from './components/ConvergenceGraph';
import WeatherForecastCard from './components/WeatherForecastCard';
import HourlyStrip from './components/HourlyStrip';
import ForecastChart from './components/ForecastChart';
import Suggestions from './components/Suggestions';
import { Collapsible } from './components/Collapsible';
import { ThemeToggle } from './context/ThemeContext';
import { simulateLocal, checkLocalStability, calculateDtMax } from './services/localKernel';
import { checkBackendHealth, runApiSimulation } from './services/api';
import { loadRealWeatherGrid } from './services/realWeather';
import {
  CloudSun,
  Flame,
  Wind,
  Info,
  GraduationCap,
  Sparkles,
  Layers,
  Box,
  HelpCircle,
  Satellite,
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
  const [realWeatherInfo, setRealWeatherInfo] = useState(null);
  const [isLoadingRealWeather, setIsLoadingRealWeather] = useState(false);
  const [viewMode, setViewMode] = useState('3d');
  const [activeTab, setActiveTab] = useState('simple');
  const [showWind, setShowWind] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [openPanels, setOpenPanels] = useState({
    forecast: true,
    config: true,
    inspector: true,
    convergence: true,
  });

  useEffect(() => {
    checkBackendHealth().then((isHealthy) => {
      setBackendOnline(isHealthy);
      if (isHealthy) setUseBackend(true);
    });
  }, []);

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
    const cleanParams = { ...rest, base_temp: 18, hot_spot_temp: 36, u: 8, v: 3 };
    setParams(cleanParams);
    executeSimulation(cleanParams);
  };

  const liveStability = checkLocalStability(params.alpha, params.u, params.v, params.dx, params.dt);
  const currentMatrix = simulation && simulation.snapshots && simulation.snapshots[currentStep] ? simulation.snapshots[currentStep] : [];
  const nodeHistory = simulation && simulation.snapshots && selectedNode ? simulation.snapshots.map((snap) => snap[selectedNode.i]?.[selectedNode.j] ?? 0) : [];
  const currentNodeTemp = simulation && simulation.snapshots && simulation.snapshots[currentStep] ? simulation.snapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? params.base_temp : params.base_temp;
  const currentNodeHum = simulation && simulation.humiditySnapshots && simulation.humiditySnapshots[currentStep] ? simulation.humiditySnapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? 60 : 60;
  const currentNodePres = simulation && simulation.pressureSnapshots && simulation.pressureSnapshots[currentStep] ? simulation.pressureSnapshots[currentStep][selectedNode.i]?.[selectedNode.j] ?? 1012 : 1012;
  const currentTimeSec = simulation && simulation.timestamps && simulation.timestamps[currentStep] !== undefined ? simulation.timestamps[currentStep] : 0;
  const windMagnitude = Math.hypot(params.u, params.v);
  const hourDisplay = String(Math.floor(currentTimeSec / 3600)).padStart(2, '0');
  const minDisplay = String(Math.floor((currentTimeSec % 3600) / 60)).padStart(2, '0');

  const timeLabel = `${hourDisplay}:${minDisplay}`;
  const minVal = realWeatherInfo ? Math.floor(realWeatherInfo.minT) - 2 : 12;
  const maxVal = realWeatherInfo ? Math.ceil(realWeatherInfo.maxT) + 3 : 38;
  const snapshots = simulation ? simulation.snapshots : [];
  const timestamps = simulation ? simulation.timestamps : [];
  const humiditySnapshots = simulation ? simulation.humiditySnapshots : [];
  const pressureSnapshots = simulation ? simulation.pressureSnapshots : [];

  return (
    <div className="min-h-screen px-3 pb-10 pt-3 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-5 sm:space-y-6">
        {/* CABECERA */}
        <header className="glass sticky top-3 z-30 flex items-center justify-between gap-3 rounded-clay px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="clay-active grid h-11 w-11 shrink-0 place-items-center rounded-2xl">
              <CloudSun className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold leading-tight text-ink sm:text-2xl">Clima-App</h1>
              <p className="truncate text-xs text-mute">Universidad de los Llanos · Pronóstico con diferencias finitas</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="seg" role="group" aria-label="Modo de la interfaz">
              <button type="button" className="seg-item" aria-pressed={activeTab === 'simple'} onClick={() => setActiveTab('simple')}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Intuitivo</span>
              </button>
              <button type="button" className="seg-item" aria-pressed={activeTab === 'tecnico'} onClick={() => setActiveTab('tecnico')}>
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Técnico</span>
              </button>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* ESTADO: clima real o modo didáctico */}
        {realWeatherInfo ? (
          <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-clay-sm px-4 py-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="icon-chip !h-9 !w-9 text-emerald-600 dark:text-emerald-400">
                <Satellite className="h-4 w-4" aria-hidden="true" />
              </span>
              <p className="text-mute">
                <strong className="font-semibold text-ink">Clima real activo:</strong> {realWeatherInfo.regionName}. Viento medido{' '}
                {realWeatherInfo.avgU} m/s Este, {realWeatherInfo.avgV} m/s Norte.
              </p>
            </div>
            <button type="button" onClick={handleClearRealWeather} className="btn-soft">
              Volver al modo didáctico
            </button>
          </div>
        ) : (
          <div className="glass flex items-center gap-3 rounded-clay-sm px-4 py-3 text-sm">
            <span className="icon-chip !h-9 !w-9">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-mute">
              <strong className="font-semibold text-ink">Modo didáctico:</strong> una montaña cálida de {params.hot_spot_temp} °C se mueve con el viento. Cuando
              la humedad supera 70 %, empieza a llover en la vista 3D.
            </p>
          </div>
        )}

        {/* FILA 1: tiempo actual + mapa térmico */}
        <main className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <WeatherForecastCard
              temp={currentNodeTemp}
              humidity={currentNodeHum}
              pressure={currentNodePres}
              windSpeed={windMagnitude}
              currentTimeSec={currentTimeSec}
              selectedNode={selectedNode}
            />
          </div>

          <section className="clay flex flex-col p-4 sm:p-5 lg:col-span-7" aria-label="Mapa térmico">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-xl font-semibold text-ink">Mapa térmico</h2>
                <p className="text-xs text-mute">Temperatura de la malla a las {timeLabel}</p>
              </div>
              <div className="seg" role="group" aria-label="Tipo de vista">
                <button type="button" className="seg-item" aria-pressed={viewMode === '3d'} onClick={() => setViewMode('3d')}>
                  <Box className="h-4 w-4" aria-hidden="true" />
                  3D
                </button>
                <button type="button" className="seg-item" aria-pressed={viewMode === '2d'} onClick={() => setViewMode('2d')}>
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  2D
                </button>
              </div>
            </div>

            <div className="flex-1">
              {viewMode === '3d' ? (
                <ThreeViewer
                  matrix={currentMatrix}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  u={params.u}
                  v={params.v}
                  minVal={minVal}
                  maxVal={maxVal}
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
                  minVal={minVal}
                  maxVal={maxVal}
                  showGrid={showGrid}
                  showWind={showWind}
                />
              )}
            </div>
          </section>

          {/* FILA 2: línea de tiempo */}
          <div className="lg:col-span-12">
            <TimeControls
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onStep={() => setCurrentStep((prev) => Math.min(snapshots.length - 1, prev + 1))}
              onReset={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              currentIndex={currentStep}
              totalSnapshots={simulation ? snapshots.length : 1}
              timestamps={timestamps}
              speed={speed}
              onChangeSpeed={setSpeed}
              onSeek={setCurrentStep}
            />
          </div>

          {/* FILA 3: tira de 24 horas */}
          <div className="lg:col-span-12">
            <HourlyStrip
              snapshots={snapshots}
              humiditySnapshots={humiditySnapshots}
              pressureSnapshots={pressureSnapshots}
              timestamps={timestamps}
              selectedNode={selectedNode}
              windSpeed={windMagnitude}
              currentSec={currentTimeSec}
              onSeek={setCurrentStep}
            />
          </div>

          {/* FILA 4: gráfica + sugerencias y estabilidad */}
          <div className="lg:col-span-8">
            <ForecastChart
              snapshots={snapshots}
              humiditySnapshots={humiditySnapshots}
              pressureSnapshots={pressureSnapshots}
              timestamps={timestamps}
              selectedNode={selectedNode}
              windSpeed={windMagnitude}
              currentStep={currentStep}
              onSeek={setCurrentStep}
            />
          </div>
          <div className="space-y-5 sm:space-y-6 lg:col-span-4">
            <Suggestions temp={currentNodeTemp} humidity={currentNodeHum} pressure={currentNodePres} windSpeed={windMagnitude} />
            <StabilityBadge stability={liveStability} onAutoFitDt={handleAutoFitDt} />
          </div>

          {/* FILA 5: configuración */}
          <div className="lg:col-span-12">
            <Collapsible
              title="Configuración física"
              icon={Settings}
              defaultOpen={openPanels.config}
              onToggle={(isOpen) => setOpenPanels({ ...openPanels, config: isOpen })}
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
          </div>

          {/* MODO TÉCNICO */}
          {activeTab === 'tecnico' && (
            <>
              <div className="lg:col-span-5">
                <Collapsible
                  title="Inspector del nodo"
                  icon={Box}
                  defaultOpen={openPanels.inspector}
                  onToggle={(isOpen) => setOpenPanels({ ...openPanels, inspector: isOpen })}
                >
                  <Inspector matrix={currentMatrix} selectedNode={selectedNode} alpha={params.alpha} u={params.u} v={params.v} dx={params.dx} dt={params.dt} />
                </Collapsible>
              </div>
              <div className="lg:col-span-7">
                <Collapsible
                  title="Evolución y costo computacional"
                  icon={BarChart3}
                  defaultOpen={openPanels.convergence}
                  onToggle={(isOpen) => setOpenPanels({ ...openPanels, convergence: isOpen })}
                >
                  <ConvergenceGraph nodeHistory={nodeHistory} timestamps={timestamps} gridH={params.dx / 1000} />
                </Collapsible>
              </div>
            </>
          )}

          {/* MODO INTUITIVO */}
          {activeTab === 'simple' &&
            [
              { Icon: Flame, title: 'Temperatura', text: 'La difusión térmica reparte el calor entre nodos vecinos hasta buscar equilibrio.' },
              { Icon: Wind, title: 'Viento y presión', text: 'La advección transporta masas de aire. Una presión baja favorece la inestabilidad.' },
              { Icon: HelpCircle, title: 'Humedad y lluvia', text: 'Con humedad sobre 70 % se condensa el vapor y la lluvia aparece en el mapa 3D.' },
            ].map(({ Icon, title, text }) => (
              <article key={title} className="clay p-5 sm:p-6 lg:col-span-4">
                <span className="icon-chip mb-3">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mb-1.5 text-lg font-semibold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-mute">{text}</p>
              </article>
            ))}
        </main>

        {/* PIE DE PÁGINA */}
        <footer className="px-2 pb-2 pt-4 text-center text-sm text-mute">
          <p>Universidad de los Llanos · Pronóstico del clima mediante mallas y diferencias finitas</p>
          <p className="mt-1 text-xs text-faint">Julian Esteban Romero Guzmán · Eduar Alexis Murcia Rodríguez</p>
        </footer>
      </div>
    </div>
  );
}
