"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import type { StarType } from "@/types/tier";

const STAR_COLORS: Record<StarType, string> = {
  yellow_dwarf: "#ffe066",
  red_dwarf: "#ff6633",
  blue_giant: "#99ccff",
  white_dwarf: "#eeeeff",
  neutron: "#cc88ff",
};

export function CentralStar({ starType = "yellow_dwarf" }: { starType?: StarType }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = STAR_COLORS[starType];

  useFrame(() => {
    if (!meshRef.current) return;
    const t = performance.now() / 1000;
    meshRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
  });

  return (
    <group>
      {/* Core */}
      <Sphere ref={meshRef} args={[3, 32, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          roughness={0.8}
        />
      </Sphere>
      {/* Glow light */}
      <pointLight color={color} intensity={80} distance={200} decay={2} />
      {/* Ambient */}
      <ambientLight intensity={0.3} color="#362d59" />
    </group>
  );
}
