"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeletePlanetButtonProps {
  planetId: string;
  systemSlug: string;
  locale: string;
}

export function DeletePlanetButton({ planetId, systemSlug, locale }: DeletePlanetButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "pending">("idle");

  async function handleDelete() {
    setState("pending");
    try {
      const res = await fetch(`/api/planets/${planetId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/${locale}/system/${systemSlug}`);
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  if (state === "idle") {
    return (
      <button
        onClick={() => setState("confirm")}
        className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors px-4 py-2 text-sm text-red-400"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Eliminar planeta
      </button>
    );
  }

  if (state === "confirm") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-400">¿Eliminar permanentemente?</span>
        <button
          onClick={() => setState("idle")}
          className="rounded-lg border border-border-purple bg-border-purple/20 hover:bg-border-purple/40 transition-colors px-3 py-2 text-sm text-text-muted"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg border border-red-500/60 bg-red-500/20 hover:bg-red-500/30 transition-colors px-3 py-2 text-sm text-red-400 font-semibold"
        >
          Confirmar
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-red-400/60">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Eliminando...
    </div>
  );
}
