"use client";

import { useTranslations } from "next-intl";
import { useCanvasStore, type DrawTool } from "@/stores/canvasStore";
import { cn } from "@/lib/utils";

const TOOLS: { id: DrawTool; icon: string }[] = [
  { id: "brush", icon: "✏️" },
  { id: "fill", icon: "🪣" },
  { id: "eraser", icon: "⬜" },
];

const BRUSH_SIZES = [4, 8, 12, 20, 32];

export function BrushToolbar() {
  const t = useTranslations("draw");
  const { tool, setTool, brushSize, setBrushSize, fabricRef } = useCanvasStore();

  function handleUndo() {
    if (!fabricRef?.current) return;
    const fc = fabricRef.current as { undo?: () => void; _objects?: unknown[] };
    if (fc.undo) {
      fc.undo();
    } else {
      // Manual undo: remove last object
      const canvas = fc as { remove?: (o: unknown) => void; _objects?: unknown[]; requestRenderAll?: () => void };
      const objs = canvas._objects;
      if (objs && objs.length > 0 && canvas.remove && canvas.requestRenderAll) {
        canvas.remove(objs[objs.length - 1]);
        canvas.requestRenderAll();
      }
    }
  }

  function handleClear() {
    if (!fabricRef?.current) return;
    const fc = fabricRef.current as { clear?: () => void; requestRenderAll?: () => void; backgroundColor?: string };
    if (fc.clear) {
      fc.clear();
      fc.backgroundColor = "#1a0e2e";
      fc.requestRenderAll?.();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tools */}
      <div className="flex gap-2">
        {TOOLS.map((t_) => (
          <button
            key={t_.id}
            onClick={() => setTool(t_.id)}
            title={t(t_.id === "brush" ? "tool_brush" : t_.id === "fill" ? "tool_fill" : "tool_eraser")}
            className={cn(
              "w-10 h-10 rounded-[8px] flex items-center justify-center text-lg transition-all",
              tool === t_.id
                ? "bg-sentry-purple shadow-[0_0_12px_rgba(106,95,193,0.5)]"
                : "bg-border-purple/40 hover:bg-border-purple/80"
            )}
          >
            {t_.icon}
          </button>
        ))}
        <button
          onClick={handleUndo}
          title={t("tool_undo")}
          className="w-10 h-10 rounded-[8px] flex items-center justify-center text-sm bg-border-purple/40 hover:bg-border-purple/80 text-text-muted hover:text-white transition-all"
        >
          ↩
        </button>
        <button
          onClick={handleClear}
          title={t("tool_clear")}
          className="w-10 h-10 rounded-[8px] flex items-center justify-center text-sm bg-border-purple/40 hover:bg-red-900/60 text-text-muted hover:text-red-400 transition-all"
        >
          ✕
        </button>
      </div>

      {/* Brush size */}
      <div className="flex items-center gap-2">
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            className={cn(
              "rounded-full transition-all border",
              brushSize === s ? "border-sentry-purple bg-sentry-purple/30" : "border-border-purple/60 hover:border-border-purple"
            )}
            style={{ width: Math.max(12, s / 2), height: Math.max(12, s / 2) }}
          />
        ))}
      </div>
    </div>
  );
}
