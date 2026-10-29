import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Rotate3D, Eye, Compass, ZoomIn } from 'lucide-react';

// Paleta de colores térmica científica
function getThermalColorThree(norm) {
  const n = Math.max(0, Math.min(1, norm));
  if (n < 0.25) {
    const f = n / 0.25;
    return new THREE.Color(20 / 255 + (30 / 255) * f, 50 / 255 + (120 / 255) * f, 220 / 255 - (40 / 255) * f);
  } else if (n < 0.5) {
    const f = (n - 0.25) / 0.25;
    return new THREE.Color(50 / 255 + (150 / 255) * f, 170 / 255 + (60 / 255) * f, 180 / 255 - (150 / 255) * f);
  } else if (n < 0.75) {
    const f = (n - 0.5) / 0.25;
    return new THREE.Color(200 / 255 + (45 / 255) * f, 230 / 255 - (90 / 255) * f, 30 / 255 - (20 / 255) * f);
  } else {
    const f = (n - 0.75) / 0.25;
    return new THREE.Color(245 / 255 + (10 / 255) * f, 140 / 255 - (100 / 255) * f, 10 / 255 + (20 / 255) * f);
  }
}

export default function ThreeViewer({
  matrix,
  selectedNode,
  onSelectNode,
  u = 5,
  v = 0,
  minVal = 15,
  maxVal = 35,
  showGrid = true,
  showWind = true,
  showRain = true,
  reliefHeight = 2.5,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);
  const wireMeshRef = useRef(null);
  const arrowsGroupRef = useRef(null);
  const rainGroupRef = useRef(null);
  const pinRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);

  // Dimensiones del mundo 3D
  const WORLD_SIZE = 12;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');

    // 2. Cámara
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraRef.current = camera;
    // Vista isométrica atractiva por defecto
    camera.position.set(13, 11, 13);
    camera.lookAt(0, 0, 0);

    // 3. Renderer con antialias
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.85);
    dirLight.position.set(10, 18, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    fillLight.position.set(-10, 8, -10);
    scene.add(fillLight);

    // 5. Cuadrícula de base y suelo
    const floorGrid = new THREE.GridHelper(WORLD_SIZE * 1.3, 13, 0x1e293b, 0x0f172a);
    floorGrid.position.y = -0.05;
    scene.add(floorGrid);

    // 6. Pin 3D para el nodo seleccionado
    const pinGroup = new THREE.Group();
    const pinHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, emissive: 0xb45309, emissiveIntensity: 0.4 })
    );
    const pinPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.02, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
    );
    pinHead.position.y = 1.2;
    pinPole.position.y = 0.6;
    pinGroup.add(pinHead, pinPole);
    scene.add(pinGroup);
    pinRef.current = pinGroup;

    // 7. Grupo de flechas de viento 3D y lluvia
    const arrowsGroup = new THREE.Group();
    scene.add(arrowsGroup);
    arrowsGroupRef.current = arrowsGroup;

    const rainGroup = new THREE.Group();
    scene.add(rainGroup);
    rainGroupRef.current = rainGroup;

    // Sistema de partículas de lluvia (gotas)
    const rainCount = 450;
    const rainGeom = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let p = 0; p < rainCount; p++) {
      rainPos[p * 3] = (Math.random() - 0.5) * WORLD_SIZE;
      rainPos[p * 3 + 1] = Math.random() * 4 + 1;
      rainPos[p * 3 + 2] = (Math.random() - 0.5) * WORLD_SIZE;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
    });
    const rainParticles = new THREE.Points(rainGeom, rainMat);
    rainGroup.add(rainParticles);

    // 8. Controles de rotación tipo órbita manual (suave y táctil)
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 19, theta: Math.PI / 4, phi: Math.PI / 3.2 };

    const updateCameraPos = () => {
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi));
      spherical.radius = Math.max(6, Math.min(30, spherical.radius));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.4, 0);
    };

    updateCameraPos();

    const onPointerDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      spherical.theta -= dx * 0.007;
      spherical.phi -= dy * 0.007;
      updateCameraPos();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius += e.deltaY * 0.015;
      updateCameraPos();
    };

    // Raycast para seleccionar nodo con clic
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onCanvasClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current);
        if (intersects.length > 0 && intersects[0].point) {
          const pt = intersects[0].point;
          // Mapear de coordenadas mundo a indices (i, j)
          const normX = (pt.x + WORLD_SIZE / 2) / WORLD_SIZE;
          const normZ = (pt.z + WORLD_SIZE / 2) / WORLD_SIZE;

          const nx = matrixRefCurrent.nx;
          const ny = matrixRefCurrent.ny;

          const j = Math.max(0, Math.min(nx - 1, Math.round(normX * (nx - 1))));
          // En 3D Z positivo va hacia el Sur, por lo que Norte es -Z
          const i = Math.max(0, Math.min(ny - 1, Math.round((1.0 - normZ) * (ny - 1))));

          if (onSelectNode) {
            onSelectNode({ i, j });
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('click', onCanvasClick);

    // Animación continua
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotateRef.current && !isDragging) {
        spherical.theta += 0.004;
        updateCameraPos();
      }

      // Caída suave de gotas de lluvia
      if (rainGroupRef.current && rainGroupRef.current.children[0]) {
        const pts = rainGroupRef.current.children[0];
        const posAttr = pts.geometry.attributes.position;
        for (let k = 0; k < posAttr.count; k++) {
          let y = posAttr.getY(k) - 0.12;
          if (y < 0.2) y = 4.5;
          posAttr.setY(k, y);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onCanvasClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  const matrixRefCurrent = {
    ny: matrix && matrix.length ? matrix.length : 50,
    nx: matrix && matrix[0] ? matrix[0].length : 50,
  };

  // Actualizar la malla 3D cuando cambia la matriz de temperatura
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !matrix || !matrix.length) return;

    const ny = matrix.length;
    const nx = matrix[0].length;
    matrixRefCurrent.ny = ny;
    matrixRefCurrent.nx = nx;

    // Si la geometría previa tiene otra resolución, recrear
    if (
      !meshRef.current ||
      meshRef.current.geometry.parameters.widthSegments !== nx - 1 ||
      meshRef.current.geometry.parameters.heightSegments !== ny - 1
    ) {
      if (meshRef.current) {
        scene.remove(meshRef.current);
        scene.remove(wireMeshRef.current);
        meshRef.current.geometry.dispose();
      }

      const geom = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, nx - 1, ny - 1);
      geom.rotateX(-Math.PI / 2); // Acostarlo en el plano horizontal XZ

      // Material con iluminación suave y colores de vértices
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });

      const mesh = new THREE.Mesh(geom, mat);
      const wire = new THREE.Mesh(geom, wireMat);
      wire.position.y = 0.01;

      scene.add(mesh);
      scene.add(wire);
      meshRef.current = mesh;
      wireMeshRef.current = wire;
    }

    const mesh = meshRef.current;
    const wire = wireMeshRef.current;
    if (wire) wire.visible = showGrid;
    if (rainGroupRef.current) rainGroupRef.current.visible = showRain;

    const positions = mesh.geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    const range = maxVal - minVal || 1e-4;

    let vertexIdx = 0;
    // PlaneGeometry genera vértices de arriba a abajo (-Z a +Z en plano horizontal)
    // Para alinear con la física meteorológica:
    // Norte = fila ny-1 (Z negativo), Sur = fila 0 (Z positivo)
    for (let row = 0; row < ny; row++) {
      // i: fila física (ny-1 arriba, 0 abajo)
      const i = ny - 1 - row;
      for (let j = 0; j < nx; j++) {
        const val = matrix[i] ? matrix[i][j] : minVal;
        const norm = Math.max(0, Math.min(1, (val - minVal) / range));

        // Elevación en Y proporcional a la temperatura
        const elevation = norm * reliefHeight;
        positions.setY(vertexIdx, elevation);

        // Color térmico del vértice
        const c = getThermalColorThree(norm);
        colors[vertexIdx * 3] = c.r;
        colors[vertexIdx * 3 + 1] = c.g;
        colors[vertexIdx * 3 + 2] = c.b;

        vertexIdx++;
      }
    }

    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    positions.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    // Actualizar posición del pin en el nodo seleccionado
    if (selectedNode && pinRef.current) {
      const { i, j } = selectedNode;
      if (i >= 0 && i < ny && j >= 0 && j < nx) {
        const normX = j / (nx - 1);
        const normZ = 1.0 - i / (ny - 1);

        const worldX = (normX - 0.5) * WORLD_SIZE;
        const worldZ = (normZ - 0.5) * WORLD_SIZE;

        const val = matrix[i][j];
        const norm = Math.max(0, Math.min(1, (val - minVal) / range));
        const worldY = norm * reliefHeight;

        pinRef.current.position.set(worldX, worldY, worldZ);
        pinRef.current.visible = true;
      }
    }

    // Actualizar flechas de viento 3D
    const arrowsGroup = arrowsGroupRef.current;
    if (arrowsGroup) {
      arrowsGroup.clear();
      if (showWind && (Math.abs(u) > 0.2 || Math.abs(v) > 0.2)) {
        const spd = Math.hypot(u, v);
        // En 3D: Este es +X, Norte es -Z
        const dir = new THREE.Vector3(u, 0, -v).normalize();
        const arrowLength = 0.8 + Math.min(1.5, spd * 0.08);

        const density = 5;
        const step = WORLD_SIZE / (density + 1);

        for (let gx = 1; gx <= density; gx++) {
          for (let gz = 1; gz <= density; gz++) {
            const posX = -WORLD_SIZE / 2 + gx * step;
            const posZ = -WORLD_SIZE / 2 + gz * step;
            const origin = new THREE.Vector3(posX, reliefHeight + 0.6, posZ);

            const arrowHelper = new THREE.ArrowHelper(dir, origin, arrowLength, 0x38bdf8, 0.35, 0.22);
            arrowsGroup.add(arrowHelper);
          }
        }
      }
    }
  }, [matrix, selectedNode, minVal, maxVal, reliefHeight, showGrid, showWind, u, v]);

  // Restablecer ángulo de cámara
  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(13, 11, 13);
      cameraRef.current.lookAt(0, 0.4, 0);
    }
  };

  const selectedTemp =
    selectedNode && matrix && matrix[selectedNode.i] && matrix[selectedNode.i][selectedNode.j] !== undefined
      ? matrix[selectedNode.i][selectedNode.j]
      : null;

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Barra de cabecera con controles 3D */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <Compass className="h-4 w-4 text-amber-400" />
          <span>Superficie 3D Térmica · Norte (arriba), Este (derecha)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 transition ${
              autoRotate
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-slate-800 bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Giro automático continuo de la cámara"
          >
            <Rotate3D className="h-3.5 w-3.5" />
            <span>Giro auto</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800 px-2.5 py-1 text-slate-400 hover:text-slate-200 transition"
            title="Restablecer posición inicial de la cámara"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Vista inicial</span>
          </button>
        </div>
      </div>

      {/* Contenedor del lienzo 3D */}
      <div className="relative w-full h-[400px] sm:h-[480px] cursor-grab active:cursor-grabbing bg-slate-950">
        <div ref={containerRef} className="w-full h-full touch-none" />

        {/* Indicador flotante del nodo seleccionado */}
        {selectedTemp !== null && (
          <div className="absolute top-3 left-3 rounded-xl border border-amber-500/30 bg-slate-950/85 px-3 py-2 text-xs font-mono backdrop-blur-md shadow-xl pointer-events-none">
            <span className="block text-[10px] uppercase text-amber-400 font-bold">Punto Marcado 📍</span>
            <span className="text-base font-extrabold text-white">{selectedTemp.toFixed(1)} °C</span>
            <span className="block text-[10px] text-slate-400">
              Coordenada [{selectedNode.i}, {selectedNode.j}]
            </span>
          </div>
        )}

        {/* Instrucción de uso táctil */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-md pointer-events-none text-center shadow-lg">
          Arrastra para rotar · Rueda para hacer zoom · Clic para clavar un marcador
        </div>
      </div>

      {/* Leyenda de escala térmica */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
          <span className="text-blue-400 font-semibold">{minVal.toFixed(0)} °C (Valle Frío)</span>
        </div>

        <div className="h-2.5 w-36 sm:w-56 rounded-full shadow-inner bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600"></div>

        <div className="flex items-center gap-2">
          <span className="text-red-400 font-semibold">{maxVal.toFixed(0)} °C (Montaña de Calor)</span>
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
        </div>
      </div>
    </div>
  );
}
