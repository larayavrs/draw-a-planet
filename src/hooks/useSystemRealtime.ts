"use client";

import { useEffect, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Planet } from "@/types/planet";

export function useSystemRealtime(
  systemId: string,
  onNewPlanet: (planet: Planet) => void
) {
  const handleNewPlanet = useCallback(onNewPlanet, []); // eslint-disable-line

  useEffect(() => {
    if (!systemId) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`system-${systemId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "planets",
          filter: `system_id=eq.${systemId}`,
        },
        (payload: { new: unknown }) => {
          handleNewPlanet(payload.new as Planet);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [systemId, handleNewPlanet]);
}
