"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/stores/canvasStore";
import { ALLOWED_PLANET_TYPES } from "@/lib/planet/limits";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PlanetType, UserTier } from "@/types/tier";
import Link from "next/link";

const PLANET_TYPE_ICONS: Record<PlanetType, string> = {
  rocky: "🪨",
  gaseous: "🌀",
  icy: "❄️",
  lava: "🌋",
  ocean: "🌊",
  desert: "🏜️",
  ringed: "💫",
};

const ALL_TYPES: PlanetType[] = ["rocky", "gaseous", "icy", "lava", "ocean", "desert", "ringed"];

export function PlanetTypeSelector({ tier, locale }: { tier: UserTier; locale: string }) {
  const t = useTranslations("draw");
  const tTypes = useTranslations("planet_types");
  const tGate = useTranslations("tier_gate");
  const { planetType, setPlanetType } = useCanvasStore();
  const [upsellOpen, setUpsellOpen] = useState(false);
  const allowed = ALLOWED_PLANET_TYPES[tier];

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {t("planet_type_label")}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ALL_TYPES.map((type) => {
            const isAllowed = allowed.includes(type);
            return (
              <button
                key={type}
                onClick={() => {
                  if (!isAllowed) { setUpsellOpen(true); return; }
                  setPlanetType(type);
                }}
                title={tTypes(type)}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-[8px] text-xs font-medium transition-all",
                  isAllowed
                    ? planetType === type
                      ? "bg-sentry-purple/40 text-white ring-1 ring-sentry-purple"
                      : "bg-border-purple/30 text-text-muted hover:bg-border-purple/60 hover:text-white"
                    : "bg-border-purple/20 text-text-muted/40 cursor-pointer"
                )}
              >
                <span className="text-lg">{PLANET_TYPE_ICONS[type]}</span>
                <span className="leading-tight text-center">{tTypes(type)}</span>
                {!isAllowed && (
                  <span className="absolute top-1 right-1 text-[10px] text-text-muted/50">🔒</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Modal open={upsellOpen} onClose={() => setUpsellOpen(false)} title={tGate("title")}>
        <p className="text-text-muted text-sm mb-4">
          {tier === "guest" ? tGate("guest_to_registered") : tGate("registered_to_premium")}
        </p>
        <div className="flex gap-3">
          {tier === "guest" && (
            <Link href={`/${locale}/auth/register`}>
              <Button variant="cta">{tGate("cta_register")}</Button>
            </Link>
          )}
          <Link href={`/${locale}/premium`}>
            <Button variant="primary">{tGate("cta_premium")}</Button>
          </Link>
          <Button variant="ghost" onClick={() => setUpsellOpen(false)}>
            {useTranslations("common")("cancel")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
