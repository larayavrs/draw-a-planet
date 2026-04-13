import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserTier } from "@/lib/auth/tier";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // ── 1. Auth — guests cannot delete ───────────────────────────────────────
  const authClient = await getSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Rate limit — differentiated by tier ───────────────────────────────
  const tier = await getUserTier(user.id);
  const max = RATE_LIMITS["planet:delete"][tier === "premium" ? "premium" : "registered"];
  const rl = checkRateLimit("planet:delete", user.id, max);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }

  const serviceClient = getSupabaseServiceClient();

  // ── 3. Verify ownership ───────────────────────────────────────────────────
  const { data: planet } = await serviceClient
    .from("planets")
    .select("id, user_id, is_active")
    .eq("id", id)
    .single();

  if (!planet || !planet.is_active) {
    return NextResponse.json({ error: "Planet not found" }, { status: 404 });
  }

  if (planet.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 4. Soft-delete ────────────────────────────────────────────────────────
  const { error } = await serviceClient
    .from("planets")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("[planets/delete] update error:", error);
    return NextResponse.json({ error: "Failed to delete planet" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
