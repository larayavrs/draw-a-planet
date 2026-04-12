/**
 * Pure orbit math — used both server-side for placement and client-side in useFrame.
 */

export interface OrbitParams {
  radius: number;
  speed: number;
  offset: number;
  inclination: number;
}

/** Returns [x, y, z] position for a planet on its orbit at a given elapsed time. */
export function computeOrbitPosition(
  params: OrbitParams,
  elapsedTime: number
): [number, number, number] {
  const angle = params.offset + elapsedTime * params.speed;
  const x = Math.cos(angle) * params.radius;
  const z = Math.sin(angle) * params.radius;
  const y = Math.sin(angle) * params.radius * Math.sin(params.inclination);
  return [x, y, z];
}

/** Compute initial orbit placement for a new planet in a system. */
export function computeOrbitPlacement(
  activePlanetCount: number,
  tier: "guest" | "registered" | "premium"
): Pick<OrbitParams, "radius" | "speed" | "offset" | "inclination"> {
  const BASE_RADIUS = 18;
  const SPACING = 4;

  // Premium gets priority placement (closer to star)
  const baseRadius = tier === "premium"
    ? BASE_RADIUS + (activePlanetCount % 8) * SPACING
    : BASE_RADIUS + activePlanetCount * SPACING;

  // Jitter to avoid perfect stacking
  const jitter = (Math.random() - 0.5) * 2;
  const radius = Math.max(12, baseRadius + jitter);

  const speedBase: Record<string, number> = {
    guest: 0.08,
    registered: 0.12,
    premium: 0.18,
  };
  const speed = speedBase[tier] + (Math.random() - 0.5) * 0.02;
  const offset = Math.random() * Math.PI * 2;
  const inclination = (Math.random() - 0.5) * 0.3; // slight tilt

  return { radius, speed, offset, inclination };
}
