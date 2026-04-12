"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import { CentralStar } from "./CentralStar";
import { OrbitingPlanet } from "./OrbitingPlanet";
import { useSystemRealtime } from "@/hooks/useSystemRealtime";
import type { Planet, System } from "@/types/planet";
import * as THREE from "three";

interface SystemBoardProps {
  system: System;
  initialPlanets: Planet[];
  mini?: boolean;
}

/* ──────────────────────────────────────────────────────────────────
 *  BoardContent — lives inside <Canvas>, has access to useThree/useFrame
 * ────────────────────────────────────────────────────────────────── */
function BoardContent({
  system,
  planets,
  getElapsed,
  focusedPlanet,
  onFocusPlanet,
}: {
  system: System;
  planets: Planet[];
  getElapsed: () => number;
  focusedPlanet: Planet | null;
  onFocusPlanet: (planet: Planet | null) => void;
}) {
  const { camera } = useThree();

  // Camera follow refs — mutated every frame in useFrame, read by camera lerp
  const camTarget = useRef(new THREE.Vector3(0, 35, 75));
  const camLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const smoothPos = useRef(new THREE.Vector3(0, 35, 75));
  const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Smoothly follow focused planet or return to default view
  useFrame(() => {
    if (focusedPlanet) {
      // Get the mesh world position of the focused planet
      const mesh = planets
        .map((p) => ({
          p,
          el: document.querySelector(`[data-planet-id="${p.id}"]`) as HTMLElement | null,
        }))
        .find((x) => x.p.id === focusedPlanet.id);

      // Use orbit math to compute current position (same as OrbitingPlanet)
      const angle =
        focusedPlanet.orbit_offset + getElapsed() * focusedPlanet.orbit_speed;
      const px = Math.cos(angle) * focusedPlanet.orbit_radius;
      const pz = Math.sin(angle) * focusedPlanet.orbit_radius;
      const py =
        Math.sin(angle) *
        focusedPlanet.orbit_radius *
        Math.sin(focusedPlanet.orbit_inclination);

      camTarget.current.set(px + 4, py + 3, pz + 6);
      camLookAt.current.set(px, py, pz);
    } else {
      camTarget.current.set(0, 35, 75);
      camLookAt.current.set(0, 0, 0);
    }

    // Smooth interpolation
    smoothPos.current.lerp(camTarget.current, 0.04);
    smoothLookAt.current.lerp(camLookAt.current, 0.06);
    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLookAt.current);
  });

  return (
    <>
      {/* Background stars */}
      <Stars radius={200} depth={60} count={3000} factor={3} saturation={0} fade speed={0.5} />

      {/* Central star */}
      <CentralStar starType={system.star_type} />

      {/* Orbiting planets */}
      {planets.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          planet={planet}
          getElapsed={getElapsed}
          isFocused={focusedPlanet?.id === planet.id}
          onClick={() => onFocusPlanet(focusedPlanet?.id === planet.id ? null : planet)}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enabled={!focusedPlanet}
        enablePan={false}
        minDistance={focusedPlanet ? 3 : 15}
        maxDistance={focusedPlanet ? 20 : 200}
        autoRotate={!focusedPlanet}
        autoRotateSpeed={0.3}
      />
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  SystemBoard — manages state, passes data into canvas
 * ────────────────────────────────────────────────────────────────── */
export function SystemBoard({ system, initialPlanets, mini = false }: SystemBoardProps) {
  const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
  const [paused, setPaused] = useState(false);
  const [focusedPlanet, setFocusedPlanet] = useState<Planet | null>(null);

  // Shared elapsed time with frame-rate independent timing
  const startTimeRef = useRef(performance.now());
  const pauseStartMsRef = useRef(0);
  const totalPauseMsRef = useRef(0);

  const handleNewPlanet = useCallback((planet: Planet) => {
    setPlanets((prev) => {
      if (prev.find((p) => p.id === planet.id)) return prev;
      return [...prev, planet];
    });
  }, []);

  useSystemRealtime(system.id, handleNewPlanet);

  // Unfocus when the focused planet is removed
  useEffect(() => {
    if (focusedPlanet && !planets.find((p) => p.id === focusedPlanet.id)) {
      setFocusedPlanet(null);
    }
  }, [planets, focusedPlanet]);

  // getElapsed: elapsed ms since mount minus accumulated pause ms, in seconds
  const getElapsed = useCallback(() => {
    if (pauseStartMsRef.current > 0) {
      // Still paused — return the frozen time
      return (pauseStartMsRef.current - totalPauseMsRef.current - startTimeRef.current) / 1000;
    }
    return (performance.now() - totalPauseMsRef.current - startTimeRef.current) / 1000;
  }, []);

  // Clock: every frame, accumulate pause time
  function ClockSync() {
    useFrame(() => {
      if (paused) {
        if (pauseStartMsRef.current === 0) {
          pauseStartMsRef.current = performance.now();
        }
      } else {
        if (pauseStartMsRef.current > 0) {
          totalPauseMsRef.current += performance.now() - pauseStartMsRef.current;
          pauseStartMsRef.current = 0;
        }
      }
    });
    return null;
  }

  return (
    <div className="relative w-full h-full" style={{ minHeight: mini ? 400 : undefined }}>
      <Canvas
        camera={{ position: [0, 35, 75], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[0, 0, 0]} intensity={1.5} color="#fff8e7" distance={200} />
        <Suspense fallback={null}>
          <ClockSync />
          <BoardContent
            system={system}
            planets={planets}
            getElapsed={getElapsed}
            focusedPlanet={focusedPlanet}
            onFocusPlanet={setFocusedPlanet}
          />
        </Suspense>
      </Canvas>

      {/* Bottom controls */}
      {!mini && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {/* Pause/Play */}
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-full border border-border-purple bg-darker-purple/80 backdrop-blur-sm p-2 text-white hover:bg-sentry-purple/60 transition-colors"
            title={paused ? "Reanudar" : "Pausar"}
          >
            {paused ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            )}
          </button>

          {/* Unfocus button */}
          {focusedPlanet && (
            <button
              onClick={() => setFocusedPlanet(null)}
              className="rounded-full border border-border-purple bg-darker-purple/80 backdrop-blur-sm px-4 py-2 text-sm text-white hover:bg-sentry-purple/60 transition-colors"
            >
              ← Back to system
            </button>
          )}
        </div>
      )}

      {/* Planet detail panel */}
      {focusedPlanet && (
        <div className="absolute top-16 right-4 z-10 w-64 rounded-xl border border-border-purple bg-darker-purple/90 backdrop-blur-sm shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white truncate">{focusedPlanet.name}</h3>
              <button
                onClick={() => setFocusedPlanet(null)}
                className="text-text-muted hover:text-white transition-colors ml-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Tipo</span>
                <span className="text-white capitalize">{focusedPlanet.planet_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Creado por</span>
                <span className="text-white">
                  {focusedPlanet.creator_username || "Anónimo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Vistas</span>
                <span className="text-white">{focusedPlanet.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Creado</span>
                <span className="text-white">
                  {new Date(focusedPlanet.created_at).toLocaleDateString()}
                </span>
              </div>
              {focusedPlanet.lifespan_expires_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Expira</span>
                  <span className="text-white">
                    {new Date(focusedPlanet.lifespan_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {!focusedPlanet.lifespan_expires_at && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Duración</span>
                  <span className="text-lime font-medium">Permanente</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
