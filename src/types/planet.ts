import type { PlanetType, StarType, UserTier, CosmeticEffect } from "./tier";

export interface CanvasData {
  version: 1;
  width: 512;
  height: 512;
  objects: unknown[];
  backgroundColor: string;
}

export interface Planet {
  id: string;
  user_id: string | null;
  guest_session_id: string | null;
  name: string;
  planet_type: PlanetType;
  canvas_data: CanvasData;
  texture_url: string | null;
  system_id: string;
  orbit_radius: number;
  orbit_speed: number;
  orbit_offset: number;
  orbit_inclination: number;
  tier_at_creation: UserTier;
  cosmetic_effect: CosmeticEffect | null;
  lifespan_expires_at: string | null;
  last_activity_at: string;
  is_active: boolean;
  view_count: number;
  created_at: string;
  // joined
  creator_username?: string | null;
  creator_display_name?: string | null;
  creator_avatar?: string | null;
}

export interface System {
  id: string;
  name: string;
  slug: string;
  star_type: StarType;
  description: string | null;
  max_planets: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PlanetCreatePayload {
  name: string;
  planet_type: PlanetType;
  canvas_data: CanvasData;
  texture_data_url: string; // base64 PNG for upload
  system_id: string;
}
