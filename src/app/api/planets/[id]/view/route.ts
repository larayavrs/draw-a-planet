import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient, getSupabaseServerClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/views";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rawIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Resolve viewer identity and ip hash in parallel
  const [ipHash, authClient] = await Promise.all([
    hashIp(rawIp),
    getSupabaseServerClient(),
  ]);
  const { data: { user } } = await authClient.auth.getUser();

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.rpc("record_planet_view", {
    p_planet_id: id,
    p_viewer_id: user?.id ?? null,
    p_ip_hash: ipHash,
  });

  if (error) {
    // Non-critical — don't surface to user
    console.error("[planet/view] rpc error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
