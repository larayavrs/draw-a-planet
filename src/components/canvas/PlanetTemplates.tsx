"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCanvasStore } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";
import type { UserTier } from "@/types/tier";

const CANVAS_SIZE = 512;

// ─── Fabric types (minimal subset used by templates) ─────────────────────────

type FabricCanvas = {
  clear: () => void;
  add: (obj: unknown) => void;
  requestRenderAll: () => void;
  backgroundColor: string;
  clipPath: unknown;
};

type FabricLib = {
  Circle: new (opts: Record<string, unknown>) => unknown;
  Rect:   new (opts: Record<string, unknown>) => unknown;
  Line:   new (points: number[], opts: Record<string, unknown>) => unknown;
  Path:   new (path: string, opts: Record<string, unknown>) => unknown;
};

export type TemplateId = "rock" | "ice" | "lava" | "ocean" | "desert" | "gas";

interface Template {
  id: TemplateId;
  label: string;
  emoji: string;
  previewGradient: string;
  draw: (fc: FabricCanvas, lib: FabricLib) => void;
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Template definitions ─────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: "rock",
    label: "Bare Rock",
    emoji: "🪨",
    previewGradient: "radial-gradient(circle, #7a6050 0%, #4a3828 60%, #2a2018 100%)",
    draw(fc, { Circle }) {
      fc.clear();
      fc.backgroundColor = "#3a2c1e";
      const rand = seededRand(42);
      const colors = ["#8c6a4a","#6a4a2e","#9a8060","#5a4030","#b09070","#4a3828","#7a5a3a"];
      for (let i = 0; i < 120; i++) {
        const r = rand() * 80 + 6;
        const x = rand() * CANVAS_SIZE;
        const y = rand() * CANVAS_SIZE;
        fc.add(new Circle({ radius: r, left: x - r, top: y - r, fill: colors[Math.floor(rand() * colors.length)], opacity: rand() * 0.5 + 0.2, selectable: false, evented: false }));
      }
      for (let i = 0; i < 20; i++) {
        const r = rand() * 30 + 10;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: "transparent", stroke: "#2a1e10", strokeWidth: rand() * 3 + 1, opacity: rand() * 0.6 + 0.2, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
  {
    id: "ice",
    label: "Ice World",
    emoji: "❄️",
    previewGradient: "radial-gradient(circle, #e8f4ff 0%, #a0c8e8 50%, #5090c0 100%)",
    draw(fc, { Circle, Rect }) {
      fc.clear();
      fc.backgroundColor = "#c8e8f8";
      const rand = seededRand(7);
      for (let i = 0; i < 40; i++) {
        fc.add(new Rect({ left: rand() * CANVAS_SIZE, top: rand() * CANVAS_SIZE, width: rand() * 80 + 10, height: rand() * 3 + 1, angle: rand() * 360, fill: "#7ab8e0", opacity: rand() * 0.4 + 0.1, selectable: false, evented: false }));
      }
      fc.add(new Circle({ radius: 200, left: CANVAS_SIZE / 2 - 200, top: -140, fill: "#eef8ff", opacity: 0.85, selectable: false, evented: false }));
      fc.add(new Circle({ radius: 180, left: CANVAS_SIZE / 2 - 180, top: CANVAS_SIZE - 60, fill: "#eef8ff", opacity: 0.75, selectable: false, evented: false }));
      for (let i = 0; i < 30; i++) {
        const r = rand() * 25 + 5;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: "#f0faff", opacity: rand() * 0.5 + 0.2, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
  {
    id: "lava",
    label: "Lava Core",
    emoji: "🌋",
    previewGradient: "radial-gradient(circle, #ff6020 0%, #c82000 40%, #300808 100%)",
    draw(fc, { Circle, Path }) {
      fc.clear();
      fc.backgroundColor = "#1a0800";
      const rand = seededRand(13);
      const poolColors = ["#ff4010","#ff6020","#ff8030","#ffa040","#e03010"];
      for (let i = 0; i < 30; i++) {
        const r = rand() * 60 + 10;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: poolColors[Math.floor(rand() * poolColors.length)], opacity: rand() * 0.6 + 0.2, selectable: false, evented: false }));
      }
      for (let i = 0; i < 25; i++) {
        const sx = rand() * CANVAS_SIZE; const sy = rand() * CANVAS_SIZE;
        let path = `M ${sx} ${sy}`;
        for (let j = 0; j < 4; j++) path += ` L ${sx + (rand() - 0.5) * 120} ${sy + (rand() - 0.5) * 120}`;
        fc.add(new Path(path, { stroke: rand() > 0.5 ? "#ff8030" : "#ffb060", strokeWidth: rand() * 4 + 1, fill: "transparent", opacity: rand() * 0.7 + 0.3, selectable: false, evented: false }));
      }
      for (let i = 0; i < 20; i++) {
        const r = rand() * 50 + 15;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: "#1a0800", opacity: rand() * 0.7 + 0.3, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
  {
    id: "ocean",
    label: "Deep Ocean",
    emoji: "🌊",
    previewGradient: "radial-gradient(circle, #40a0e0 0%, #1060a0 50%, #082040 100%)",
    draw(fc, { Rect, Circle }) {
      fc.clear();
      fc.backgroundColor = "#082848";
      const rand = seededRand(99);
      const layerColors = ["#0a3060","#0c3870","#0e4080","#104890","#1258a0"];
      for (let i = 0; i < layerColors.length; i++) {
        fc.add(new Rect({ left: 0, top: (CANVAS_SIZE / layerColors.length) * i, width: CANVAS_SIZE, height: CANVAS_SIZE / layerColors.length + 2, fill: layerColors[i], opacity: 0.7, selectable: false, evented: false }));
      }
      for (let i = 0; i < 35; i++) {
        fc.add(new Rect({ left: rand() * CANVAS_SIZE, top: rand() * CANVAS_SIZE, width: rand() * 100 + 20, height: rand() * 4 + 1, angle: rand() * 40 - 20, fill: "#60d0ff", opacity: rand() * 0.25 + 0.05, selectable: false, evented: false }));
      }
      for (let i = 0; i < 5; i++) {
        const r = rand() * 50 + 20;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: "#1a8040", opacity: rand() * 0.5 + 0.3, selectable: false, evented: false }));
      }
      for (let i = 0; i < 20; i++) {
        const r = rand() * 15 + 3;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * 80 - r, fill: "#a0e8ff", opacity: rand() * 0.3 + 0.1, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
  {
    id: "desert",
    label: "Desert",
    emoji: "🏜️",
    previewGradient: "radial-gradient(circle, #e8b060 0%, #c07030 50%, #804020 100%)",
    draw(fc, { Rect, Circle }) {
      fc.clear();
      fc.backgroundColor = "#c07030";
      const rand = seededRand(55);
      const duneColors = ["#d08040","#c87030","#e09050","#b86028","#d89060","#c07030","#e8a070"];
      for (let i = 0; i < duneColors.length; i++) {
        fc.add(new Rect({ left: 0, top: (CANVAS_SIZE / duneColors.length) * i, width: CANVAS_SIZE, height: CANVAS_SIZE / duneColors.length + 2, fill: duneColors[i], opacity: 0.75, selectable: false, evented: false }));
      }
      for (let i = 0; i < 18; i++) {
        fc.add(new Rect({ left: rand() * CANVAS_SIZE, top: rand() * CANVAS_SIZE, width: rand() * 180 + 60, height: rand() * 12 + 3, angle: rand() * 15 - 7, fill: "#f0c080", rx: 30, ry: 30, opacity: rand() * 0.4 + 0.1, selectable: false, evented: false }));
      }
      for (let i = 0; i < 8; i++) {
        const r = rand() * 30 + 8;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: "transparent", stroke: "#904020", strokeWidth: 2, opacity: rand() * 0.5 + 0.2, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
  {
    id: "gas",
    label: "Gas Giant",
    emoji: "🌀",
    previewGradient: "linear-gradient(180deg,#e8c080 0%,#d09050 20%,#c07040 40%,#e8a060 60%,#b06030 80%,#d08040 100%)",
    draw(fc, { Rect, Circle }) {
      fc.clear();
      fc.backgroundColor = "#c88040";
      const rand = seededRand(21);
      const bands = [
        { color: "#e8c080", h: 0.08 }, { color: "#c07840", h: 0.06 }, { color: "#e0a060", h: 0.10 },
        { color: "#b06030", h: 0.05 }, { color: "#d89050", h: 0.12 }, { color: "#c07040", h: 0.07 },
        { color: "#f0d090", h: 0.09 }, { color: "#a85828", h: 0.06 }, { color: "#e8b870", h: 0.10 },
        { color: "#c87038", h: 0.08 }, { color: "#d8a060", h: 0.09 }, { color: "#b86030", h: 0.10 },
      ];
      let y = 0;
      for (const band of bands) {
        const h = band.h * CANVAS_SIZE;
        fc.add(new Rect({ left: 0, top: y, width: CANVAS_SIZE, height: h + 2, fill: band.color, opacity: 0.85, selectable: false, evented: false }));
        y += h;
      }
      fc.add(new Circle({ radius: 40, left: CANVAS_SIZE * 0.65 - 40, top: CANVAS_SIZE * 0.45 - 40, fill: "#d04820", opacity: 0.8, selectable: false, evented: false }));
      fc.add(new Circle({ radius: 25, left: CANVAS_SIZE * 0.65 - 25, top: CANVAS_SIZE * 0.45 - 25, fill: "#e86030", opacity: 0.9, selectable: false, evented: false }));
      for (let i = 0; i < 8; i++) {
        const r = rand() * 12 + 4;
        fc.add(new Circle({ radius: r, left: rand() * CANVAS_SIZE - r, top: rand() * CANVAS_SIZE - r, fill: rand() > 0.5 ? "#f0d090" : "#903010", opacity: rand() * 0.5 + 0.2, selectable: false, evented: false }));
      }
      fc.requestRenderAll();
    },
  },
];

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function TemplateThumbnail({
  template,
  active,
  onClick,
}: {
  template: Template;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={template.label}
      className={cn(
        "relative flex flex-col items-center gap-1.5 p-2 rounded-[10px] border transition-all text-xs font-medium",
        active
          ? "border-lime bg-lime/10 text-lime"
          : "border-border-purple/40 bg-border-purple/20 text-text-muted hover:border-border-purple hover:text-white"
      )}
    >
      <div className="w-10 h-10 rounded-full" style={{ background: template.previewGradient }} />
      <span className="leading-tight text-center w-full truncate">{template.label}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PlanetTemplatesProps {
  tier: UserTier;
  locale: string;
  activeTemplate: TemplateId | null;
  onSelect: (id: TemplateId) => void;
}

export function PlanetTemplates({ tier, locale, activeTemplate, onSelect }: PlanetTemplatesProps) {
  const t = useTranslations("draw");
  const { actions } = useCanvasStore();
  const isPremium = tier === "premium";

  const applyTemplate = useCallback(
    async (id: TemplateId) => {
      if (!actions) return;
      await actions.applyTemplate(id);
      onSelect(id);
    },
    [actions, onSelect]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex-1">
          {t("templates_title")}
        </p>
        {isPremium && (
          <span className="text-[10px] font-bold text-lime bg-lime/10 border border-lime/30 px-1.5 py-0.5 rounded-full">
            ✦ PREMIUM
          </span>
        )}
      </div>

      <div className="relative">
        <div className={cn("grid grid-cols-3 gap-2", !isPremium && "pointer-events-none select-none")}>
          {TEMPLATES.map((tpl) => (
            <TemplateThumbnail
              key={tpl.id}
              template={tpl}
              active={activeTemplate === tpl.id}
              onClick={() => applyTemplate(tpl.id)}
            />
          ))}
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[10px] bg-darker-purple/80 backdrop-blur-[2px] gap-2">
            <span className="text-2xl">🔒</span>
            <p className="text-xs text-text-muted text-center px-3">{t("templates_locked")}</p>
            <Link
              href={`/${locale}/premium`}
              className="text-xs font-semibold text-lime border border-lime/40 px-3 py-1 rounded-full hover:bg-lime/10 transition-colors"
            >
              {t("templates_upgrade_cta")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
