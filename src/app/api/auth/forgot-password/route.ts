import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const Schema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url(),
});

// Always return 200 — never reveal whether the email exists.
const OK = NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return OK; // malformed input → silent

  const { email, redirectTo } = parsed.data;
  const serviceClient = getSupabaseServiceClient();

  // Check if the email belongs to a registered user.
  // getUserByEmail queries auth.users — returns error if not found.
  const { data: { user } } = await serviceClient.auth.admin.getUserByEmail(email);

  if (!user) return OK; // email not in system → silent, no email sent

  // Only send reset email for confirmed accounts (not unconfirmed signups).
  if (!user.email_confirmed_at) return OK;

  await serviceClient.auth.resetPasswordForEmail(email, { redirectTo });

  return OK;
}
