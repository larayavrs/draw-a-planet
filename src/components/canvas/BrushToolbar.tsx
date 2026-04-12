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
    const fc = fabricRef.current as { 
      _objects?: unknown[]; 
      remove?: (obj: unknown) => void; 
      requestRenderAll?: () => void;
      clearUndo?: () => void;
    };
    const objects = fc._objects;
    if (objects && objects.length > 0) {
      const lastObj = objects[objects.length - 1];
      if (fc.remove && fc.requestRenderAll) {
        fc.remove(lastObj);
        fc.requestRenderAll();
      }
    }
  }

  function handleClear() {
    if (!fabricRef?.current) return;
    const fc = fabricRef.current as { 
      _objects?: unknown[]; 
      remove?: (obj: unknown) => void; 
      requestRenderAll?: () => void;
      backgroundColor?: string;
    };
    // Remove all objects from canvas
    const objects = fc._objects ? [...fc._objects] : [];
    if (fc.remove && fc.requestRenderAll) {
      for (const obj of objects) {
        fc.remove(obj);
      }
      fc.backgroundColor = "#1a0e2e";
      fc.requestRenderAll();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Draw tools */}
      <div className="flex gap-1.5">
        {TOOLS.map((t_) => (
          <button
            key={t_.id}
            onClick={() => setTool(t_.id)}
            title={t(t_.id === "brush" ? "tool_brush" : t_.id === "fill" ? "tool_fill" : "tool_eraser")}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all",
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
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm bg-border-purple/40 hover:bg-border-purple/80 text-text-muted hover:text-white transition-all"
        >
          ↩
        </button>
        <button
          onClick={handleClear}
          title={t("tool_clear")}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm bg-border-purple/40 hover:bg-red-900/60 text-text-muted hover:text-red-400 transition-all"
        >
          ✕
        </button>
      </div>

      {/* Brush sizes — inline after tools on mobile, own row inside desktop sidebar */}
      <div className="flex items-center gap-2 pl-1 border-l border-border-purple/40">
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            title={`${s}px`}
            className={cn(
              "rounded-full transition-all border shrink-0",
              brushSize === s ? "border-sentry-purple bg-sentry-purple/30" : "border-border-purple/60 hover:border-border-purple"
            )}
            style={{ width: Math.max(12, s / 2), height: Math.max(12, s / 2) }}
          />
        ))}
      </div>
    </div>
  );
}
