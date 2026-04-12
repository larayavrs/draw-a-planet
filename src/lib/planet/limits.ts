import type { PlanetType, UserTier } from "@/types/tier";

// Planet types allowed per tier
export const ALLOWED_PLANET_TYPES: Record<UserTier, PlanetType[]> = {
  guest: ["rocky"],
  registered: ["rocky", "gaseous", "icy"],
  premium: ["rocky", "gaseous", "icy", "lava", "ocean", "desert", "ringed"],
};

// Color swatches per tier (guest/registered use these; premium gets full wheel)
export const GUEST_PALETTE = [
  "#c2543a", "#d4844e", "#8cb87a", "#4a7fb5", "#b5a84a", "#7a5f8c", "#3a7a6a", "#e0d0a0",
];

export const REGISTERED_PALETTE = [
  // Warm
  "#c2543a", "#d4844e", "#e8b86a", "#f0e0a0",
  // Cool
  "#4a7fb5", "#6ab5d4", "#3a7a6a", "#8cb87a",
  // Purple/Violet
  "#7a5f8c", "#9b6fc1", "#b5a84a", "#c2ef4e",
  // Neutrals
  "#e0d0a0", "#cfcfdb", "#8a8a9a", "#3a3050",
  // Special
  "#fa7faa", "#ffb287", "#ff6b6b", "#ffd93d",
];

// Lifespan per tier
export const LIFESPAN_DAYS: Record<UserTier, number | null> = {
  guest: 1,       // 24 hours
  registered: 30, // 30 days
  premium: null,  // permanent
};

// Orbit parameters per tier
export const BASE_ORBIT_RADIUS = 18;
export const ORBIT_SPACING = 4;

export const ORBIT_SPEED_MULTIPLIER: Record<UserTier, number> = {
  guest: 0.08,
  registered: 0.12,
  premium: 0.18, // slightly faster / closer to star
};

// Guest: max 1 planet per session (enforced in DB + API)
export const GUEST_MAX_PLANETS = 1;

// Registered: rate limit
export const REGISTERED_RATE_LIMIT_PER_MINUTE = 10;

// Canvas data limits
export const CANVAS_MAX_OBJECTS = 500;
export const CANVAS_MAX_JSON_BYTES = 100_000; // 100 KB
export const TEXTURE_MAX_BYTES = 1_048_576;   // 1 MB

export function isPlanetTypeAllowed(type: PlanetType, tier: UserTier): boolean {
  return ALLOWED_PLANET_TYPES[tier].includes(type);
}

export function getLifespanDate(tier: UserTier): Date | null {
  const days = LIFESPAN_DAYS[tier];
  if (days === null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
