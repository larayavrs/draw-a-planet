"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { computeOrbitPosition } from "@/lib/three/orbitMath";
import type { Planet } from "@/types/planet";

interface OrbitingPlanetProps {
  planet: Planet;
  getElapsed: () => number;
  isFocused: boolean;
  onClick: () => void;
}

const PLANET_RADIUS: Record<string, number> = {
  rocky: 0.8,
  gaseous: 1.4,
  icy: 0.9,
  lava: 1.0,
  ocean: 1.1,
  desert: 0.85,
  ringed: 1.3,
};

const PLANET_BASE_COLOR: Record<string, [number, number, number]> = {
  rocky: [0.55, 0.35, 0.25],
  gaseous: [0.85, 0.55, 0.30],
  icy: [0.60, 0.80, 0.95],
  lava: [0.85, 0.15, 0.05],
  ocean: [0.15, 0.35, 0.70],
  desert: [0.85, 0.75, 0.45],
  ringed: [0.75, 0.60, 0.35],
};

function getPlanetBaseColor(type: string): string {
  const rgb = PLANET_BASE_COLOR[type] ?? [0.42, 0.37, 0.76];
  return `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`;
}

export function OrbitingPlanet({ planet, getElapsed, isFocused, onClick }: OrbitingPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Load texture from Supabase Storage URL
  useEffect(() => {
    if (!planet.texture_url) {
      console.log(`[OrbitingPlanet] No texture_url for "${planet.name}" (id: ${planet.id}), using base color`);
      return;
    }
    console.log(`[OrbitingPlanet] Loading texture for "${planet.name}" from:`, planet.texture_url);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      planet.texture_url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true;
        setTexture(t);
        console.log(`[OrbitingPlanet] Texture loaded OK for "${planet.name}"`);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          console.log(`[OrbitingPlanet] ${((xhr.loaded / xhr.total) * 100).toFixed(0)}% loaded for "${planet.name}"`);
        }
      },
      (err) => {
        console.warn(`[OrbitingPlanet] FAILED to load texture for "${planet.name}":`, planet.texture_url, err);
      }
    );
  }, [planet.texture_url, planet.name]);

  const orbitParams = {
    radius: planet.orbit_radius,
    speed: planet.orbit_speed,
    offset: planet.orbit_offset,
    inclination: planet.orbit_inclination,
  };

  // Each frame, compute orbit position from the shared elapsed time (keeps relative positions correct)
  useFrame(() => {
    if (!meshRef.current) return;
    const [x, y, z] = computeOrbitPosition(orbitParams, getElapsed());
    meshRef.current.position.set(x, y, z);
    meshRef.current.rotation.y += 0.003;
  });

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const radius = PLANET_RADIUS[planet.planet_type] ?? 1;
  const scale = isFocused ? 1.4 : hovered ? 1.1 : 1;
  const creator = planet.creator_username ?? null;

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
        map={texture ?? undefined}
        color={texture ? "#ffffff" : getPlanetBaseColor(planet.planet_type)}
        roughness={0.7}
        metalness={0.1}
        emissive={isFocused ? "#6a5fc1" : hovered ? "#362d59" : "#000000"}
        emissiveIntensity={isFocused ? 0.7 : hovered ? 0.5 : 0}
      />

      {/* Focus ring */}
      {isFocused && (
        <Sphere args={[radius * 1.5, 16, 16]}>
          <meshBasicMaterial
            color="#6a5fc1"
            transparent
            opacity={0.15}
            wireframe
          />
        </Sphere>
      )}

      {/* Tooltip on hover */}
      {hovered && !isFocused && (
        <Html
          center
          distanceFactor={20}
          style={{ pointerEvents: "none" }}
        >
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
