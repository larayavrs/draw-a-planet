"use client";

import type { System } from "@/types/planet";

// Shared client-side cache for systems data.
// Multiple components (Navbar, SystemSwitcher, Draw page) all need this list.
// This module ensures only one fetch happens per page load.

let cache: System[] | null = null;
let promise: Promise<System[]> | null = null;

export function fetchSystems(): Promise<System[]> {
  if (cache) return Promise.resolve(cache);
  if (promise) return promise;

  promise = fetch("/api/systems")
    .then((r) => r.json())
    .then((d) => {
      cache = (d.systems as System[]) ?? [];
      return cache;
    })
    .catch(() => {
      promise = null;
      cache = [];
      return [];
    });

  return promise!;
}

export function getDefaultSystemSlug(): Promise<string | null> {
  return fetchSystems().then((systems) => {
    const def = systems.find((s) => s.is_default);
    return def?.slug ?? systems[0]?.slug ?? null;
  });
}
