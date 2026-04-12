"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import type { UserTier } from "@/types/tier";

const CANVAS_SIZE = 512;

interface PlanetCanvasProps {
  tier?: UserTier;
}

export function PlanetCanvas({ tier = "guest" }: PlanetCanvasProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const store = useCanvasStore();
  const isPremium = tier === "premium";

  // Responsive scale: fit the canvas inside the viewport
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function updateScale() {
      // Leave 32px padding on each side; cap at CANVAS_SIZE
      const available = Math.min(CANVAS_SIZE, window.innerWidth - 64);
      setScale(available / CANVAS_SIZE);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    if (!canvasEl.current) return;

    let disposed = false;
    let fc: { dispose: () => void } | null = null;

    import("fabric").then(({ Canvas, PencilBrush, Circle }) => {
      if (disposed || !canvasEl.current) return;

      const canvas = canvasEl.current as HTMLCanvasElement & {
        _fabricjs?: unknown;
      };
      if (canvas._fabricjs) return;

      fc = new Canvas(canvasEl.current, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: "#1a0e2e",
        isDrawingMode: true,
        selection: false,
      });

      canvas._fabricjs = true;

      const clipCircle = new Circle({
        radius: CANVAS_SIZE / 2,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
      });
      (fc as unknown as Record<string, unknown>).clipPath = clipCircle;

      const brush = new PencilBrush(fc as never);
      (brush as unknown as Record<string, unknown>).color = store.currentColor;
      (brush as unknown as Record<string, unknown>).width = store.brushSize;
      (fc as unknown as Record<string, unknown>).freeDrawingBrush = brush;

      fabricRef.current = fc;
      store.setFabricRef(fabricRef);
      store.setCanvasEl(canvasEl);
    });

    return () => {
      disposed = true;
      fc?.dispose();
      if (canvasEl.current) {
        (canvasEl.current as HTMLCanvasElement & { _fabricjs?: unknown })._fabricjs = undefined;
      }
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!fabricRef.current) return;
    const fc = fabricRef.current as Record<string, unknown>;
    const brush = fc.freeDrawingBrush as Record<string, unknown> | null;

    if (store.tool === "eraser") {
      if (brush) brush.color = "#1a0e2e";
      fc.isDrawingMode = true;
    } else if (store.tool === "brush") {
      if (brush) brush.color = store.currentColor;
      fc.isDrawingMode = true;
    } else if (store.tool === "fill") {
      fc.isDrawingMode = false;
    }
  }, [store.tool, store.currentColor]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const fc = fabricRef.current as Record<string, unknown>;
    const brush = fc.freeDrawingBrush as Record<string, unknown> | null;
    if (brush) brush.width = store.brushSize;
  }, [store.brushSize]);

  const handleClick = useCallback(() => {
    if (store.tool !== "fill" || !fabricRef.current) return;
    const fc = fabricRef.current as Record<string, unknown>;
    (fc as { backgroundColor: string }).backgroundColor = store.currentColor;
    (fc as { requestRenderAll: () => void }).requestRenderAll();
  }, [store.tool, store.currentColor]);

  const displaySize = Math.round(CANVAS_SIZE * scale);

  return (
    <>
      {/* Premium glow keyframes */}
      {isPremium && (
        <style>{`
          @keyframes premium-pulse {
            0%, 100% {
              box-shadow:
                0 0 18px 4px rgba(194,239,78,0.45),
                0 0 40px 8px rgba(106,95,193,0.35);
            }
            50% {
              box-shadow:
                0 0 28px 8px rgba(194,239,78,0.7),
                0 0 60px 14px rgba(106,95,193,0.55);
            }
          }
          @keyframes badge-shine {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 1; }
          }
        `}</style>
      )}

      <div className="relative flex items-center justify-center">
        {/* Scaling wrapper — keeps layout flow correct */}
        <div style={{ width: displaySize, height: displaySize }}>
          {/* Ring + glow */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: CANVAS_SIZE + 16,
              height: CANVAS_SIZE + 16,
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${scale})`,
              ...(isPremium
                ? {
                    border: "3px solid rgba(194,239,78,0.6)",
                    animation: "premium-pulse 2.5s ease-in-out infinite",
                  }
                : {
                    border: "2px solid rgba(54,45,89,0.4)",
                  }),
            }}
          />

          {/* Canvas — CSS scaled, stays 512×512 internally */}
          <canvas
            ref={canvasEl}
            onClick={handleClick}
            className="rounded-full cursor-crosshair touch-none"
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div
            className="absolute top-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider"
            style={{
              background: "rgba(21,15,35,0.85)",
              border: "1px solid rgba(194,239,78,0.5)",
              color: "#c2ef4e",
              animation: "badge-shine 2.5s ease-in-out infinite",
              zIndex: 10,
            }}
          >
            ✦ PREMIUM
          </div>
        )}
      </div>
    </>
  );
}
