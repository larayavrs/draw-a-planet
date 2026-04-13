"use client";

import { useEffect, useRef } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import type { UserTier } from "@/types/tier";
import { TEMPLATES } from "./PlanetTemplates";

// Fabric.js internal resolution — always 512×512 inside, visually scaled down
const CANVAS_SIZE = 512;
const BG_COLOR = "#1a0e2e";

// Typed Fabric canvas surface — only the methods we actually call
type FC = {
  dispose: () => void;
  requestRenderAll: () => void;
  getObjects: () => unknown[];
  remove: (o: unknown) => void;
  add: (o: unknown) => void;
  sendObjectToBack: (o: unknown) => void;
  getZoom: () => number;
  setZoom: (z: number) => void;
  setDimensions: (d: { width: number; height: number }) => void;
  toJSON: () => object;
  toDataURL: (o: object) => string;
  clipPath: unknown;
  backgroundColor: string;
  isDrawingMode: boolean;
  freeDrawingBrush: { color: string; width: number } | null;
  wrapperEl: HTMLElement;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
  clear: () => void;
};

interface PlanetCanvasProps {
  tier?: UserTier;
}

export function PlanetCanvas({ tier = "guest" }: PlanetCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  // Keep a ref to the Fabric instance for cleanup even across async boundaries
  const fcRef        = useRef<FC | null>(null);
  const isPremium    = tier === "premium";

  useEffect(() => {
    let disposed = false;
    // Collects synchronous cleanup fns set up inside the async block
    const cleanups: Array<() => void> = [];

    import("fabric").then(({ Canvas, PencilBrush, Circle, Rect, Path, Line }) => {
      if (disposed || !containerRef.current || !canvasRef.current) return;

      // ── 1. Fabric canvas at full 512×512 ─────────────────────────────
      const fc = new Canvas(canvasRef.current, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: BG_COLOR,
        isDrawingMode: true,
        selection: false,
        renderOnAddRemove: false,
      }) as unknown as FC;

      fcRef.current = fc;

      // ── 2. Circular clip ──────────────────────────────────────────────
      // Circle at left:0, top:0, radius:256 → covers full internal 512×512.
      // With setZoom(s) everything (including the clip) scales proportionally,
      // so the circle always fills the visual viewport exactly.
      const clipCircle = new Circle({
        radius: CANVAS_SIZE / 2,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
      });
      fc.clipPath = clipCircle;

      // ── 3. Initial pencil brush ───────────────────────────────────────
      const brush = new PencilBrush(fc as never);
      const { currentColor, brushSize } = useCanvasStore.getState();
      (brush as unknown as { color: string; width: number }).color = currentColor;
      (brush as unknown as { color: string; width: number }).width = brushSize;
      fc.freeDrawingBrush = brush as unknown as FC["freeDrawingBrush"];

      // ── 4. Responsive scaling via Fabric's wrapperEl ──────────────────
      // Fabric creates a wrapper div that contains BOTH the lower canvas
      // (drawing surface) and the upper canvas (event handler).
      // The bug in the old code was CSS-scaling only the lower canvas,
      // leaving the upper canvas unscaled → clicks misaligned with visuals.
      // We scale the WRAPPER so both canvases move together.
      const wrapper = fc.wrapperEl;
      wrapper.style.transformOrigin = "top left";
      wrapper.style.position = "absolute";
      wrapper.style.top = "0";
      wrapper.style.left = "0";
      wrapper.style.pointerEvents = "auto";

      function applyScale() {
        const cont = containerRef.current;
        if (!cont || disposed) return;
        const s = Math.min(1, cont.clientWidth / CANVAS_SIZE);
        wrapper.style.transform = `scale(${s})`;
        // Inform Fabric of the zoom so its internal pointer math is correct
        fc.setZoom(s);
        fc.setDimensions({ width: CANVAS_SIZE, height: CANVAS_SIZE });
        fc.requestRenderAll();
      }

      applyScale();

      const ro = new ResizeObserver(applyScale);
      ro.observe(containerRef.current);
      cleanups.push(() => ro.disconnect());

      // ── 5. Fill tool via Fabric's mouse:down ──────────────────────────
      // We register ONE handler and read current tool/color via getState()
      // to avoid stale closures in re-renders.
      const fillHandler = async () => {
        const { tool, currentColor: col } = useCanvasStore.getState();
        if (tool !== "fill") return;

        const fillRect = new Rect({
          left: 0, top: 0,
          width: CANVAS_SIZE, height: CANVAS_SIZE,
          fill: col,
          selectable: false, evented: false,
        });
        fc.add(fillRect as unknown as unknown);
        fc.sendObjectToBack(fillRect as unknown as unknown);
        fc.requestRenderAll();
      };

      fc.on("mouse:down", fillHandler);
      cleanups.push(() => fc.off("mouse:down", fillHandler));

      // ── 6. Sync store state → Fabric ──────────────────────────────────
      const unsubStore = useCanvasStore.subscribe((state, prev) => {
        if (disposed || !fcRef.current) return;
        const fc_ = fcRef.current;

        if (state.tool !== prev.tool || state.currentColor !== prev.currentColor) {
          if (state.tool === "fill") {
            fc_.isDrawingMode = false;
          } else if (state.tool === "eraser") {
            fc_.isDrawingMode = true;
            if (fc_.freeDrawingBrush) fc_.freeDrawingBrush.color = BG_COLOR;
          } else {
            fc_.isDrawingMode = true;
            if (fc_.freeDrawingBrush) fc_.freeDrawingBrush.color = state.currentColor;
          }
        }

        if (state.brushSize !== prev.brushSize && fc_.freeDrawingBrush) {
          fc_.freeDrawingBrush.width = state.brushSize;
        }
      });
      cleanups.push(unsubStore);

      // ── 7. Register canvas actions in store ───────────────────────────
      useCanvasStore.getState().registerActions({
        undo() {
          const fc_ = fcRef.current;
          if (!fc_) return;
          const objs = fc_.getObjects();
          if (objs.length > 0) {
            fc_.remove(objs[objs.length - 1]);
            fc_.requestRenderAll();
          }
        },

        clear() {
          const fc_ = fcRef.current;
          if (!fc_) return;
          const objs = [...fc_.getObjects()];
          for (const o of objs) fc_.remove(o);
          fc_.backgroundColor = BG_COLOR;
          fc_.requestRenderAll();
        },

        async applyTemplate(id: string) {
          const fc_ = fcRef.current;
          if (!fc_) return;

          const tpl = TEMPLATES.find((t) => t.id === id);
          if (!tpl) return;

          // Preserve clip before clear() (defensive: Fabric v7 keeps clipPath
          // across clear() but we restore it in case a future version changes)
          const savedClip = fc_.clipPath;

          tpl.draw(
            {
              clear: () => fc_.clear(),
              add:   (o) => fc_.add(o),
              requestRenderAll: () => fc_.requestRenderAll(),
              get backgroundColor() { return fc_.backgroundColor; },
              set backgroundColor(v) { fc_.backgroundColor = v; },
              get clipPath() { return fc_.clipPath; },
              set clipPath(v) { fc_.clipPath = v; },
            },
            // Pass Fabric constructors captured in this closure
            {
              Circle: Circle as never,
              Rect:   Rect as never,
              Line:   Line as never,
              Path:   Path as never,
            }
          );

          // Restore clip if it was cleared
          if (!fc_.clipPath && savedClip) {
            fc_.clipPath = savedClip;
          }
          fc_.requestRenderAll();
        },

        exportCanvas() {
          const fc_ = fcRef.current;
          if (!fc_) return null;
          try {
            const json = fc_.toJSON();
            // Export at a fixed ~256px for lightweight WebP
            const zoom    = fc_.getZoom();
            const target  = 256;
            const multiplier = target / (CANVAS_SIZE * zoom);
            let dataUrl = fc_.toDataURL({ format: "webp", quality: 0.82, multiplier });
            if (!dataUrl.startsWith("data:image/webp")) {
              dataUrl = fc_.toDataURL({ format: "jpeg", quality: 0.82, multiplier });
            }
            return {
              canvas_data: { version: 1, width: CANVAS_SIZE, height: CANVAS_SIZE, ...json },
              texture_data_url: dataUrl,
            };
          } catch {
            return null;
          }
        },
      });

      fc.requestRenderAll();
    });

    return () => {
      disposed = true;
      for (const fn of cleanups) fn();
      if (fcRef.current) {
        fcRef.current.dispose();
        fcRef.current = null;
      }
      useCanvasStore.getState().clearActions();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {isPremium && (
        <style>{`
          @keyframes premium-pulse {
            0%,100% { box-shadow: 0 0 18px 4px rgba(194,239,78,.45), 0 0 40px 8px rgba(106,95,193,.35); }
            50%      { box-shadow: 0 0 28px 8px rgba(194,239,78,.7), 0 0 60px 14px rgba(106,95,193,.55); }
          }
        `}</style>
      )}

      {/* Outer div — limits max size and centers the canvas */}
      <div className="relative w-full" style={{ maxWidth: CANVAS_SIZE }}>

        {/* Decorative ring around the planet */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "-4px",
            ...(isPremium
              ? { border: "3px solid rgba(194,239,78,0.6)", animation: "premium-pulse 2.5s ease-in-out infinite" }
              : { border: "2px solid rgba(54,45,89,0.5)" }),
          }}
        />

        {/* Square container that drives the ResizeObserver */}
        <div
          ref={containerRef}
          className="w-full relative overflow-hidden rounded-full"
          style={{ aspectRatio: "1 / 1" }}
        >
          {/*
            Fabric will wrap this <canvas> in its own div (wrapperEl).
            We do NOT apply CSS transforms here — we do it on wrapperEl above
            so both the lower canvas and the upper (event) canvas scale together.
          */}
          <canvas ref={canvasRef} className="touch-none" />
        </div>

        {isPremium && (
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider pointer-events-none"
            style={{
              background: "rgba(21,15,35,0.85)",
              border: "1px solid rgba(194,239,78,0.5)",
              color: "#c2ef4e",
            }}
          >
            ✦ PREMIUM
          </div>
        )}
      </div>
    </>
  );
}
