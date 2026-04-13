"use client";

import React, { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Shared with OrbitingPlanet — same cache instance
const preloadLoader = new THREE.TextureLoader();
import Link from "next/link";
import { CentralStar } from "./CentralStar";
import { OrbitingPlanet, orbitRegistry } from "./OrbitingPlanet";
import { computeOrbitPosition } from "@/lib/three/orbitMath";
import { useSystemRealtime } from "@/hooks/useSystemRealtime";
import type { Planet, System } from "@/types/planet";

interface SystemBoardProps {
  system: System;
  initialPlanets: Planet[];
  mini?: boolean;
  locale?: string;
  currentUserId?: string | null;
}

/* ──────────────────────────────────────────────────────────────────
 *  Duration helper
 * ────────────────────────────────────────────────────────────────── */

/**
 * Returns a human-readable duration string from a future date.
 * Shows days and hours (e.g., "24d 6h", "6h 30m", or "Permanente")
 */
function formatTimeRemaining(
  expiresAt: string | null,
  t: ReturnType<typeof useTranslations<"system_board">>,
): string {
  if (!expiresAt) return t("permanent_label");

  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return "0h";

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
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
  paused,
  pauseStartMsRef,
  totalPauseMsRef,
}: {
  system: System;
  planets: Planet[];
  getElapsed: () => number;
  focusedPlanet: Planet | null;
  onFocusPlanet: (planet: Planet | null) => void;
  paused: boolean;
  pauseStartMsRef: React.MutableRefObject<number>;
  totalPauseMsRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();

  // Camera follow refs — mutated every frame in useFrame, read by camera lerp
  const camTarget = useRef(new THREE.Vector3(0, 35, 75));
  const camLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const smoothPos = useRef(new THREE.Vector3(0, 35, 75));
  const smoothLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Single useFrame for everything — pause tracking, all planet positions, camera.
  // Replaces: ClockSync component + n per-planet useFrame subscriptions.
  useFrame(() => {
    // ── B. Pause tracking (was ClockSync) ──
    if (paused) {
      if (pauseStartMsRef.current === 0)
        pauseStartMsRef.current = performance.now();
    } else {
      if (pauseStartMsRef.current > 0) {
        totalPauseMsRef.current +=
          performance.now() - pauseStartMsRef.current;
        pauseStartMsRef.current = 0;
      }
    }

    const elapsed = getElapsed();

    // ── B. All planet positions + rotations in one loop ──
    for (const entry of orbitRegistry.values()) {
      const [x, y, z] = computeOrbitPosition(entry.orbitParams, elapsed);
      entry.mesh.position.set(x, y, z);
      entry.mesh.rotation.y += 0.003;
    }

    // ── Camera follow ──
    if (focusedPlanet) {
      const angle =
        focusedPlanet.orbit_offset + elapsed * focusedPlanet.orbit_speed;
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

    smoothPos.current.lerp(camTarget.current, 0.04);
    smoothLookAt.current.lerp(camLookAt.current, 0.06);
    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLookAt.current);
  });

  return (
    <>
      <color attach="background" args={["#000000"]} />
      {/* Background stars */}
      <Stars
        radius={200}
        depth={60}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Central star */}
      <CentralStar starType={system.star_type} />

      {/* Orbiting planets — position/rotation driven by the single useFrame above */}
      {planets.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          planet={planet}
          isFocused={focusedPlanet?.id === planet.id}
          onClick={() =>
            onFocusPlanet(focusedPlanet?.id === planet.id ? null : planet)
          }
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

function FocusRecovery() {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const recover = () => {
      const renderer = gl as THREE.WebGLRenderer & {
        forceContextRestore?: () => void;
      };
      const ctx = renderer.getContext();
      if (ctx && "isContextLost" in ctx && ctx.isContextLost()) {
        renderer.forceContextRestore?.();
      }
      invalidate();
    };

    const onVisibility = () => {
      if (!document.hidden) recover();
    };

    window.addEventListener("focus", recover);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", recover);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [gl, invalidate]);

  return null;
}

/* ──────────────────────────────────────────────────────────────────
 *  SystemBoard — manages state, passes data into canvas
 * ────────────────────────────────────────────────────────────────── */
export function SystemBoard({
  system,
  initialPlanets,
  mini = false,
  locale = "en",
  currentUserId = null,
}: SystemBoardProps) {
  const t = useTranslations("system_board");
  const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
  const [deleteState, setDeleteState] = useState<"idle" | "confirm" | "pending">("idle");

  // Kick off parallel texture preloads before any OrbitingPlanet mounts.
  // THREE.Cache (enabled in OrbitingPlanet module) stores completed loads by URL,
  // so when each planet's useEffect fires it gets an instant cache hit.
  useEffect(() => {
    // C. Preload solo los primeros 30 (los más recientes).
    // El resto carga on-demand cuando su OrbitingPlanet monta.
    const urls = initialPlanets
      .map((p) => p.texture_url)
      .filter((u): u is string => Boolean(u))
      .slice(0, 30);
    urls.forEach((url) => {
      preloadLoader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
        },
        undefined,
        () => {},
      );
    });
  }, [initialPlanets]);
  const [paused, setPaused] = useState(false);
  const [focusedPlanet, setFocusedPlanet] = useState<Planet | null>(null);

  // Shared elapsed time with frame-rate independent timing
  const startTimeRef = useRef(performance.now());
  const pauseStartMsRef = useRef(0);
  const totalPauseMsRef = useRef(0);

  useEffect(() => {
    // Keep board state in sync when navigating across systems.
    setPlanets(initialPlanets);
    setFocusedPlanet(null);
    setPaused(false);
    startTimeRef.current = performance.now();
    pauseStartMsRef.current = 0;
    totalPauseMsRef.current = 0;
  }, [system.id, initialPlanets]);

  const handleNewPlanet = useCallback((planet: Planet) => {
    setPlanets((prev) => {
      if (prev.find((p) => p.id === planet.id)) return prev;
      return [...prev, planet];
    });
  }, []);

  useSystemRealtime(system.id, handleNewPlanet);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedPlanet(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // Reset delete confirmation when focused planet changes
  useEffect(() => {
    setDeleteState("idle");
  }, [focusedPlanet?.id]);

  async function handleDeletePlanet() {
    if (!focusedPlanet) return;
    setDeleteState("pending");
    try {
      const res = await fetch(`/api/planets/${focusedPlanet.id}`, { method: "DELETE" });
      if (res.ok) {
        setPlanets((prev) => prev.filter((p) => p.id !== focusedPlanet.id));
        setFocusedPlanet(null);
      } else {
        setDeleteState("idle");
      }
    } catch {
      setDeleteState("idle");
    }
  }

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
      return (
        (pauseStartMsRef.current -
          totalPauseMsRef.current -
          startTimeRef.current) /
        1000
      );
    }
    return (
      (performance.now() - totalPauseMsRef.current - startTimeRef.current) /
      1000
    );
  }, []);

  return (
    <div
      className="relative w-full h-full"
      style={{ minHeight: mini ? 400 : undefined }}
    >
      <Canvas
        camera={{ position: [0, 35, 75], fov: 55 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000", 1);
        }}
        onPointerMissed={() => setFocusedPlanet(null)}
      >
        <ambientLight intensity={0.6} />
        <pointLight
          position={[0, 0, 0]}
          intensity={1.5}
          color="#fff8e7"
          distance={200}
        />
        <Suspense fallback={null}>
          <FocusRecovery />
          <BoardContent
            system={system}
            planets={planets}
            getElapsed={getElapsed}
            focusedPlanet={focusedPlanet}
            onFocusPlanet={setFocusedPlanet}
            paused={paused}
            pauseStartMsRef={pauseStartMsRef}
            totalPauseMsRef={totalPauseMsRef}
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
            title={paused ? t("resume") : t("pause")}
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
              {t("back_to_system")}
            </button>
          )}
        </div>
      )}

      {/* Planet detail panel */}
      {focusedPlanet && (
        <div className="absolute top-16 right-4 z-10 w-64 rounded-xl border border-border-purple bg-darker-purple/90 backdrop-blur-sm shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white truncate">
                {focusedPlanet.name}
              </h3>
              <button
                onClick={() => setFocusedPlanet(null)}
                className="text-text-muted hover:text-white transition-colors ml-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">{t("type_label")}</span>
                <span className="text-white capitalize">
                  {focusedPlanet.planet_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("creator_label")}</span>
                <span className="text-white">
                  {focusedPlanet.creator_display_name || focusedPlanet.creator_username || t("anonymous_label")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("views_label")}</span>
                <span className="text-white">{focusedPlanet.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("created_label")}</span>
                <span className="text-white">
                  {new Date(focusedPlanet.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">{t("duration_label")}</span>
                <span className="text-white">
                  {formatTimeRemaining(focusedPlanet.lifespan_expires_at, t)}
                </span>
              </div>
            </div>
            <Link
              href={`/${locale}/planet/${focusedPlanet.id}`}
              className="mt-4 flex items-center justify-center gap-1.5 w-full rounded-lg border border-border-purple bg-sentry-purple/20 hover:bg-sentry-purple/40 transition-colors py-2 text-sm text-white"
            >
              {t("view_planet")}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Delete — only for the planet's owner */}
            {currentUserId && focusedPlanet.user_id === currentUserId && (
              <div className="mt-2">
                {deleteState === "idle" && (
                  <button
                    onClick={() => setDeleteState("confirm")}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors py-2 text-sm text-red-400"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t("delete_planet")}
                  </button>
                )}
                {deleteState === "confirm" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteState("idle")}
                      className="flex-1 rounded-lg border border-border-purple bg-border-purple/20 hover:bg-border-purple/40 transition-colors py-2 text-xs text-text-muted"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={handleDeletePlanet}
                      className="flex-1 rounded-lg border border-red-500/60 bg-red-500/20 hover:bg-red-500/30 transition-colors py-2 text-xs text-red-400 font-semibold"
                    >
                      {t("confirm_delete")}
                    </button>
                  </div>
                )}
                {deleteState === "pending" && (
                  <div className="w-full rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-center text-xs text-red-400/60">
                    {t("deleting")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
