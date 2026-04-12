import { NextRequest, NextResponse } from "next/server";
import { signGuestJwt, hashJti, hashIp } from "@/lib/auth/guest";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServiceClient();

    // Hash the client IP for privacy-preserving storage
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    const ipHash = hashIp(ip);

    // Create a guest session row
    const { data: session, error } = await supabase
      .from("guest_sessions")
      .insert({ ip_hash: ipHash, session_token: "pending", planet_count: 0 })
      .select("id")
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    // Sign the JWT with the session ID
    const token = await signGuestJwt(session.id);

    // Extract jti from the JWT to hash it for storage
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );
    const tokenHash = hashJti(payload.jti);

    // Update session_token with the actual hash
    await supabase
      .from("guest_sessions")
      .update({ session_token: tokenHash })
      .eq("id", session.id);

    return NextResponse.json({ token }, { status: 201 });
  } catch (err) {
    console.error("[guest/route] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
