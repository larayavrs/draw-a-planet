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
        .select("tier, premium_purchased_at")
        .eq("id", user.id)
        .single();

      // Grant premium if tier is set OR if they have a purchase timestamp
      const purchasedAt = data?.premium_purchased_at;
      const dbTier = data?.tier as UserTier;

      if (purchasedAt || dbTier === "premium") {
        setTier("premium");
      } else {
        setTier(dbTier ?? "registered");
      }
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
