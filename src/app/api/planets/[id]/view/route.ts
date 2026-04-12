import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.rpc("increment_planet_views", { planet_id: id });
  if (error) {
    // Non-critical — don't surface to user
    console.error("[planet/view] error:", error);
  }

  return NextResponse.json({ ok: true });
}
