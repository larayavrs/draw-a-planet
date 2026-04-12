import type { UserTier } from "@/types/tier";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Fetch the current tier for an authenticated user.
 * Always reads from DB — never trust client-supplied values.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("users")
    .select("tier")
    .eq("id", userId)
    .single();
  return (data?.tier as UserTier) ?? "registered";
}
