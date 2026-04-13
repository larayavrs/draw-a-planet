"use client";

import { useTranslations } from "next-intl";
import { useCanvasStore, type DrawTool } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";

const TOOLS: { id: DrawTool; label: string; icon: string }[] = [
  { id: "brush",  label: "tool_brush",  icon: "✏️" },
  { id: "fill",   label: "tool_fill",   icon: "🪣" },
  { id: "eraser", label: "tool_eraser", icon: "⬜" },
];

const BRUSH_SIZES = [4, 8, 12, 20, 32];

export function BrushToolbar() {
  const t = useTranslations("draw");
  const { tool, setTool, brushSize, setBrushSize, actions } = useCanvasStore();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tool buttons */}
      <div className="flex gap-1.5">
        {TOOLS.map((tool_) => (
          <button
            key={tool_.id}
            onClick={() => setTool(tool_.id)}
            title={t(tool_.label)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
              tool === tool_.id
                ? "bg-sentry-purple shadow-[0_0_12px_rgba(106,95,193,0.5)]"
                : "bg-border-purple/40 hover:bg-border-purple/80"
            )}
          >
            {tool_.icon}
          </button>
        ))}

        {/* Undo */}
        <button
          onClick={() => actions?.undo()}
          disabled={!actions}
          title={t("tool_undo")}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm bg-border-purple/40 hover:bg-border-purple/80 text-text-muted hover:text-white transition-all disabled:opacity-40"
        >
          ↩
        </button>

        {/* Clear */}
        <button
          onClick={() => actions?.clear()}
          disabled={!actions}
          title={t("tool_clear")}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm bg-border-purple/40 hover:bg-red-900/60 text-text-muted hover:text-red-400 transition-all disabled:opacity-40"
        >
          ✕
        </button>
      </div>

      {/* Brush size dots */}
      <div className="flex items-center gap-2 pl-2 border-l border-border-purple/40">
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            title={`${s}px`}
            className={cn(
              "rounded-full transition-all border shrink-0",
              brushSize === s
                ? "border-sentry-purple bg-sentry-purple/30"
                : "border-border-purple/60 hover:border-border-purple"
            )}
            style={{ width: Math.max(10, s / 2), height: Math.max(10, s / 2) }}
          />
        ))}
      </div>
    </div>
  );
}
