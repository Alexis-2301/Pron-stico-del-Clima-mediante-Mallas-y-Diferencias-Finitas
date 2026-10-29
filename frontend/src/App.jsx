import React, { useState, useEffect, useRef } from 'react';
import Heatmap from './components/Heatmap';
import Controls from './components/Controls';
import TimeControls from './components/TimeControls';
import StabilityBadge from './components/StabilityBadge';
import Inspector from './components/Inspector';
import ConvergenceGraph from './components/ConvergenceGraph';
import { simulateLocal, checkLocalStability, calculateDtMax } from './services/localKernel';
import { checkBackendHealth, runApiSimulation, fetchStability } from './services/api';
import { CloudRain, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState({
    ny: 50,
    nx: 50,
    dx: 10000,
    alpha: 5000,
    u: 5,
    v: 0,
    dt: 600,
    total_time: 86400,
    save_interval: 600,
    base_temp: 20,
    hot_spot_temp: 35,
    hot_spot_sigma: 4,
    boundary_type: 'dirichlet',
  });

  const [simulation, setSimulation] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedNode, setSelectedNode] = useState({ i: 25, j: 25 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100); // ms por cuadro
  const [backendOnline, setBackendOnline] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showWind, setShowWind] = useState(true);

  // Comprobar estado del backend FastAPI al cargar
  useEffect(() => {
    checkBackendHealth().then((isHealthy) => {
      setBackendOnline(isHealthy);
      if (isHealthy) {
        setUseBackend(true);
      }
    });
  }, []);

  // Función para ejecutar la simulación (sea por API o localmente)
  const executeSimulation = async (currentParams = params, forceBackend = useBackend) => {
    setIsCalculating(true);
    try {
      if (forceBackend && backendOnline) {
        const res = await runApiSimulation({
          ...currentParams,
          enforce_stability: false, // Permitir ver casos inestables con fines pedagógicos
        });
        setSimulation(res);
        setCurrentStep(0);
      } else {
        const res = simulateLocal(currentParams);
        setSimulation(res);
        setCurrentStep(0);
      }
    } catch (err) {
      console.warn('Fallo en API, recurriendo a motor local:', err.message);
      const res = simulateLocal(currentParams);
      setSimulation(res);
      setCurrentStep(0);
    } finally {
      setIsCalculating(false);
    }
  };

  // Ejecutar primera simulación inicial
  useEffect(() => {
    executeSimulation(params, useBackend);
  }, []);

  // Animación del reproductor temporal
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

  // Manejador de cambio de parámetros individuales
  const handleParamChange = (key, value) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    // Si cambia el tamaño, reajustar nodo seleccionado
    if (key === 'ny' || key === 'nx') {
      setSelectedNode({ i: Math.floor(updated.ny / 2), j: Math.floor(updated.nx / 2) });
    }
  };

  // Aplicar presets de escenarios
  const handleApplyPreset = (presetParams) => {
    const updated = { ...params, ...presetParams };
    setParams(updated);
    setSelectedNode({ i: Math.floor(updated.ny / 2), j: Math.floor(updated.nx / 2) });
    executeSimulation(updated);
  };

  // Autoajuste a dt máximo seguro
  const handleAutoFitDt = () => {
    const dtMax = calculateDtMax(params.alpha, params.u, params.v, params.dx);
    const safeDt = Math.max(30, Math.floor((dtMax * 0.95) / 30) * 30);
    handleParamChange('dt', safeDt);
  };

  // Cálculo de estabilidad en tiempo real para la barra de estado
  const liveStability = checkLocalStability(params.alpha, params.u, params.v, params.dx, params.dt);

  // Matriz del paso actual
  const currentMatrix =
    simulation && simulation.snapshots && simulation.snapshots[currentStep]
      ? simulation.snapshots[currentStep]
      : [];

  // Historial temporal del nodo seleccionado
  const nodeHistory =
    simulation && simulation.snapshots && selectedNode
      ? simulation.snapshots.map((snap) => snap[selectedNode.i]?.[selectedNode.j] ?? 0)
      : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
              <CloudRain className="h-4 w-4" />
              <span>Métodos Numéricos · Universidad de los Llanos</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Pronóstico del Clima mediante Mallas
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Simulación 2D de temperatura por diferencias finitas: difusión térmica FTCS ($O(\Delta t, \Delta x^2)$)
              y advección de viento Upwind. Visualiza estabilidad CFL y fenómenos atmosféricos en 24 horas.
            </p>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <span className="block font-semibold text-slate-200">Julian Esteban Romero Guzmán</span>
            <span className="block font-semibold text-slate-200">Eduar Alexis Murcia Rodríguez</span>
            <span className="text-[11px] text-amber-500/80">Ingeniería de Sistemas</span>
          </div>
        </header>

        {/* Layout principal: Visualizador + Panel Lateral */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Mapa de Calor y Controles de Tiempo (7 columnas) */}
          <section className="lg:col-span-7 space-y-4">
            <Heatmap
              matrix={currentMatrix}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              u={params.u}
              v={params.v}
              minVal={12}
              maxVal={38}
              showGrid={showGrid}
              showWind={showWind}
            />

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

          {/* Columna Derecha: Estabilidad y Controles (5 columnas) */}
          <aside className="lg:col-span-5 space-y-4">
            <StabilityBadge
              stability={liveStability}
              onAutoFitDt={handleAutoFitDt}
            />

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
            />
          </aside>
        </main>

        {/* Sección Inferior: Inspector de Nodo y Gráficas de Error / Costo */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

        {/* Pie de página pedagógico */}
        <footer className="border-t border-slate-800 pt-4 pb-8 text-xs text-slate-500 font-mono leading-relaxed">
          <p>
            <strong>Ecuación Gobernativa:</strong> {'∂T/∂t = α(∂²T/∂x² + ∂²T/∂y²) − u(∂T/∂x) − v(∂T/∂y)'}.
            El esquema explícito FTCS + Upwind requiere 4r + |cx| + |cy| ≤ 1 para convergencia y estabilidad numérica.
            Fronteras de Dirichlet fijas. Malla de 10 km × 10 km por celda.
          </p>
        </footer>
      </div>
    </div>
  );
}
