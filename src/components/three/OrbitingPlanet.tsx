"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { computeOrbitPosition } from "@/lib/three/orbitMath";
import type { Planet } from "@/types/planet";

// Module-level texture cache — fetch once, reuse everywhere.
// Key = URL, value = THREE.Texture promise.
const textureCache = new Map<string, Promise<THREE.Texture | null>>();

async function loadTexture(url: string): Promise<THREE.Texture | null> {
  try {
    // Fetch as blob → create object URL → load via Image → avoids CORS
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const t = new THREE.Texture(img);
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        URL.revokeObjectURL(objectUrl);
        resolve(t);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

function getTexture(url: string): Promise<THREE.Texture | null> {
  const cached = textureCache.get(url);
  if (cached) return cached;
  const promise = loadTexture(url);
  textureCache.set(url, promise);
  return promise;
}

/* ──────────────────────────────────────────────────────────────────
 *  OrbitingPlanet
 * ────────────────────────────────────────────────────────────────── */
export function OrbitingPlanet({
  planet,
  getElapsed,
  isFocused,
  onClick,
}: {
  planet: Planet;
  getElapsed: () => number;
  isFocused: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const orbitParams = {
    radius: planet.orbit_radius,
    speed: planet.orbit_speed,
    offset: planet.orbit_offset,
    inclination: planet.orbit_inclination,
  };

  useFrame(() => {
    if (!meshRef.current) return;
    const [x, y, z] = computeOrbitPosition(orbitParams, getElapsed());
    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.y += 0.003;
  });

  // Load texture once and assign directly to material ref — no React state,
  // no re-renders, no lost textures on hover/focus changes.
  useEffect(() => {
    if (!planet.texture_url || !matRef.current) return;

    let cancelled = false;
    getTexture(planet.texture_url).then((t) => {
      if (cancelled || !matRef.current) return;
      matRef.current.map = t ?? null;
      matRef.current.color.set(t ? "#ffffff" : getBaseColor(planet.planet_type));
      matRef.current.needsUpdate = true;
    });

    return () => { cancelled = true; };
  }, [planet.texture_url]); // only re-run if URL changes

  const handleClick = useCallback(() => onClick(), [onClick]);

  const radius = PLANET_RADIUS[planet.planet_type] ?? 1;
  const scale = isFocused ? 1.4 : hovered ? 1.1 : 1;
  const creator = planet.creator_username ?? null;
  const baseColor = getBaseColor(planet.planet_type);
  const emissive = isFocused ? "#6a5fc1" : hovered ? "#362d59" : "#000000";
  const emissiveIntensity = isFocused ? 0.7 : hovered ? 0.5 : 0;

  return (
    <Sphere
      ref={meshRef}
      args={[radius, 32, 32]}
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        ref={matRef}
        color={baseColor}
        roughness={0.7}
        metalness={0.1}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />

      {/* Focus ring */}
      {isFocused && (
        <Sphere args={[radius * 1.5, 16, 16]}>
          <meshBasicMaterial color="#6a5fc1" transparent opacity={0.15} wireframe />
        </Sphere>
      )}

      {/* Tooltip on hover */}
      {hovered && !isFocused && (
        <Html center distanceFactor={20} style={{ pointerEvents: "none" }}>
          <div className="bg-darker-purple/90 border border-border-purple rounded-[10px] px-3 py-2 text-sm text-white whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
            <p className="font-semibold">{planet.name}</p>
            <p className="text-text-muted text-xs">
              {creator ? `by ${creator}` : "by Anonymous"} · {planet.planet_type}
            </p>
          </div>
        </Html>
      )}
    </Sphere>
  );
}

/* ── Constants ──────────────────────────────────────────────────── */

const PLANET_RADIUS: Record<string, number> = {
  rocky: 0.8,
  gaseous: 1.4,
  icy: 0.9,
  lava: 1.0,
  ocean: 1.1,
  desert: 0.85,
  ringed: 1.3,
};

const PLANET_BASE_COLOR: Record<string, string> = {
  rocky:   "#8c5940",
  gaseous: "#d98c4d",
  icy:     "#99ccf2",
  lava:    "#d92513",
  ocean:   "#2659b3",
  desert:  "#d9bf73",
  ringed:  "#bf9959",
};

function getBaseColor(type: string): string {
  return PLANET_BASE_COLOR[type] ?? "#6b5ec2";
}
