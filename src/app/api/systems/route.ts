import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("systems")
    .select("id, name, slug, star_type, description, is_default, max_planets")
    .eq("is_active", true)
    .order("is_default", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch systems" }, { status: 500 });
  }

  return NextResponse.json({ systems: data });
}
