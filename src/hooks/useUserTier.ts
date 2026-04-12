"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserTier } from "@/types/tier";

export function useUserTier(): { tier: UserTier; loading: boolean } {
  const [tier, setTier] = useState<UserTier>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function fetchTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setTier("guest"); setLoading(false); return; }

      const { data } = await supabase
        .from("users")
        .select("tier")
        .eq("id", user.id)
        .single();
      setTier((data?.tier as UserTier) ?? "registered");
      setLoading(false);
    }

    fetchTier();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchTier();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { tier, loading };
}
