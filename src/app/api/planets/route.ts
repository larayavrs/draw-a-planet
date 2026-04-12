import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyGuestJwt, hashJti } from "@/lib/auth/guest";
import { getUserTier } from "@/lib/auth/tier";
import { validateCanvasData } from "@/lib/planet/serializer";
import {
  isPlanetTypeAllowed,
  getLifespanDate,
  GUEST_MAX_PLANETS,
  TEXTURE_MAX_BYTES,
} from "@/lib/planet/limits";
import { computeOrbitPlacement } from "@/lib/three/orbitMath";
import type { UserTier } from "@/types/tier";

// Simple in-process rate limit store (per user_id, requests per minute)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

const CreatePlanetSchema = z.object({
  name: z.string().min(1).max(40),
  planet_type: z.enum(["rocky", "gaseous", "icy", "lava", "ocean", "desert", "ringed"]),
  canvas_data: z.unknown(),
  texture_data_url: z.string().regex(/^data:image\/(png|jpeg|webp);base64,/),
  system_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const serviceClient = getSupabaseServiceClient();

  // ── 1. Parse & validate body ─────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreatePlanetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, planet_type, canvas_data, texture_data_url, system_id } = parsed.data;

  // ── 2. Identify caller (auth user or guest JWT) ───────────────────────────
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  let guestSessionId: string | null = null;
  let tier: UserTier = "guest";

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    userId = user.id;
    tier = await getUserTier(userId);
  } else if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const guestPayload = await verifyGuestJwt(token);
    if (!guestPayload) {
      return NextResponse.json({ error: "Invalid guest token" }, { status: 401 });
    }
    // Verify token hash in DB
    const tokenHash = hashJti(guestPayload.jti);
    const { data: session } = await serviceClient
      .from("guest_sessions")
      .select("id, planet_count, expires_at")
      .eq("session_token", tokenHash)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Guest session expired" }, { status: 401 });
    }
    if (session.planet_count >= GUEST_MAX_PLANETS) {
      return NextResponse.json({ error: "guest_limit_reached" }, { status: 429 });
    }

    guestSessionId = session.id;
    tier = "guest";
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 3. Rate limit (registered+) ──────────────────────────────────────────
  if (userId && !checkRateLimit(userId, 10)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // ── 4. Tier-gate planet type ──────────────────────────────────────────────
  if (!isPlanetTypeAllowed(planet_type, tier)) {
    return NextResponse.json({ error: "Planet type not allowed for your tier" }, { status: 403 });
  }

  // ── 5. Sanitize name ─────────────────────────────────────────────────────
  const safeName = sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }).trim();
  if (!safeName) {
    return NextResponse.json({ error: "Invalid planet name" }, { status: 400 });
  }

  // ── 6. Validate canvas_data ───────────────────────────────────────────────
  let validatedCanvas;
  try {
    validatedCanvas = validateCanvasData(canvas_data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid canvas_data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── 7. Check system exists ────────────────────────────────────────────────
  const { data: system } = await serviceClient
    .from("systems")
    .select("id, max_planets")
    .eq("id", system_id)
    .eq("is_active", true)
    .single();

  if (!system) {
    return NextResponse.json({ error: "System not found" }, { status: 404 });
  }

  // Get active planet count for orbit placement
  const { count: activePlanets } = await serviceClient
    .from("planets")
    .select("*", { count: "exact", head: true })
    .eq("system_id", system_id)
    .eq("is_active", true);

  if ((activePlanets ?? 0) >= system.max_planets) {
    return NextResponse.json({ error: "System is full" }, { status: 409 });
  }

  // ── 8. Compute orbit ──────────────────────────────────────────────────────
  const orbit = computeOrbitPlacement(activePlanets ?? 0, tier);

  // ── 9. Upload texture to Supabase Storage ────────────────────────────────
  // Strip the data URL prefix regardless of mime type (png, jpeg, webp)
  const base64Data = texture_data_url.replace(/^data:[^;]+;base64,/, "");
  const textureBuffer = Buffer.from(base64Data, "base64");

  if (textureBuffer.length > TEXTURE_MAX_BYTES) {
    return NextResponse.json({ error: "Texture too large (max 1 MB)" }, { status: 400 });
  }

  // Detect content type and extension from data URL
  const contentType = texture_data_url.match(/^data:(image\/\w+);/)?.[1] ?? "image/png";
  const ext = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";

  // Generate planet ID first so we can use it as the texture filename
  const planetId = crypto.randomUUID();
  const texturePath = `${planetId}.${ext}`;

  const { error: storageError } = await serviceClient.storage
    .from("planet-textures")
    .upload(texturePath, textureBuffer, {
      contentType,
      upsert: false,
    });

  if (storageError) {
    console.error("[planets/route] storage upload error:", storageError);
    return NextResponse.json({ error: "Failed to upload texture" }, { status: 500 });
  }

  const { data: publicUrlData } = serviceClient.storage
    .from("planet-textures")
    .getPublicUrl(texturePath);
  const textureUrl = publicUrlData.publicUrl;

  // ── 10. Insert planet ─────────────────────────────────────────────────────
  const lifespanDate = getLifespanDate(tier);
  const { data: planet, error: insertError } = await serviceClient
    .from("planets")
    .insert({
      id: planetId,
      user_id: userId,
      guest_session_id: guestSessionId,
      name: safeName,
      planet_type,
      canvas_data: validatedCanvas,
      texture_url: textureUrl,
      system_id,
      orbit_radius: orbit.radius,
      orbit_speed: orbit.speed,
      orbit_offset: orbit.offset,
      orbit_inclination: orbit.inclination,
      tier_at_creation: tier,
      lifespan_expires_at: lifespanDate?.toISOString() ?? null,
    })
    .select()
    .single();

  if (insertError || !planet) {
    console.error("[planets/route] insert error:", insertError);
    // Clean up uploaded texture
    await serviceClient.storage.from("planet-textures").remove([texturePath]);
    return NextResponse.json({ error: "Failed to create planet" }, { status: 500 });
  }

  // ── 11. Update guest session counter ─────────────────────────────────────
  if (guestSessionId) {
    // Fetch current count then increment (avoids needing a custom RPC)
    const { data: sess } = await serviceClient
      .from("guest_sessions")
      .select("planet_count")
      .eq("id", guestSessionId)
      .single();
    if (sess) {
      await serviceClient
        .from("guest_sessions")
        .update({ planet_count: (sess.planet_count as number) + 1 })
        .eq("id", guestSessionId);
    }
  }

  return NextResponse.json({ planet }, { status: 201 });
}

// ── GET: list planets for a system ────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const systemId = searchParams.get("system_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (!systemId) {
    return NextResponse.json({ error: "system_id required" }, { status: 400 });
  }

  const serviceClient = getSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from("planets")
    .select(`
      id, name, planet_type, texture_url, system_id,
      orbit_radius, orbit_speed, orbit_offset, orbit_inclination,
      tier_at_creation, lifespan_expires_at, is_active, view_count, created_at,
      user_id,
      users ( username, avatar_url )
    `)
    .eq("system_id", systemId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch planets" }, { status: 500 });
  }

  return NextResponse.json({ planets: data });
}
