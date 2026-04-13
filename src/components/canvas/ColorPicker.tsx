"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useTranslations } from "next-intl";
import { useCanvasStore } from "@/stores/canvasStore";
import { GUEST_PALETTE, REGISTERED_PALETTE } from "@/lib/planet/limits";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { UserTier } from "@/types/tier";

export function ColorPicker({ tier }: { tier: UserTier }) {
  const t = useTranslations("draw");
  const { currentColor, setCurrentColor } = useCanvasStore();
  const [showWheel, setShowWheel] = useState(false);

  const palette = tier === "guest" ? GUEST_PALETTE : REGISTERED_PALETTE;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        {t("color_picker_title")}
      </p>

      {/* Swatches — wrap into rows; parent card will handle scrolling */}
      <div className="flex flex-wrap gap-1.5">
        {palette.map((color) => (
          <button
            key={color}
            onClick={() => setCurrentColor(color)}
            className={cn(
              "w-7 h-7 rounded-full shrink-0",
              currentColor === color &&
                "ring-2 ring-white ring-offset-1 ring-offset-deep-purple",
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Premium: full color wheel */}
      {tier === "premium" && (
        <div>
          <button
            onClick={() => setShowWheel((v) => !v)}
            className="text-xs text-lime"
          >
            {showWheel ? "▲ Hide wheel" : "▼ Custom color"}
          </button>
          {showWheel && (
            <div className="mt-3 flex flex-col gap-2 items-center">
              <HexColorPicker color={currentColor} onChange={setCurrentColor} />
              <Input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setCurrentColor(v);
                }}
                className="font-mono text-center"
                maxLength={7}
              />
            </div>
          )}
        </div>
      )}

      {/* Upsell for non-premium */}
      {tier !== "premium" && (
        <p className="text-xs text-text-muted">{t("locked_color_msg")}</p>
      )}

      {/* Current color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full border border-white/20 shrink-0"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-xs font-mono text-text-muted">
          {currentColor}
        </span>
      </div>
    </div>
  );
}
