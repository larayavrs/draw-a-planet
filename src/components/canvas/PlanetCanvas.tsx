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
  renderAll: () => void;
  getObjects: () => unknown[];
  remove: (...o: unknown[]) => void;
  add: (o: unknown) => void;
  sendObjectToBack: (o: unknown) => void;
  getZoom: () => number;
  setZoom: (z: number) => void;
  setDimensions: (d: { width: number; height: number }) => void;
  // loadFromJSON returns a Promise in Fabric v7
  loadFromJSON: (json: object) => Promise<FC>;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Keep a ref to the Fabric instance for cleanup even across async boundaries
  const fcRef = useRef<FC | null>(null);
  const isPremium = tier === "premium";

  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    // ── Undo history: stack of serialized canvas snapshots ──────────────
    // Each entry is the full toJSON() output after each action.
    const history: object[] = [];
    const MAX_HISTORY = 30;

    import("fabric").then(
      ({ Canvas, PencilBrush, Circle, Rect, Path, Line }) => {
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
        (brush as unknown as { color: string; width: number }).color =
          currentColor;
        (brush as unknown as { color: string; width: number }).width =
          brushSize;
        fc.freeDrawingBrush = brush as unknown as FC["freeDrawingBrush"];

        // ── 4. Responsive scaling ─────────────────────────────────────────
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
          fc.setZoom(s);
          fc.setDimensions({ width: CANVAS_SIZE, height: CANVAS_SIZE });
          fc.requestRenderAll();
        }

        applyScale();

        const ro = new ResizeObserver(applyScale);
        ro.observe(containerRef.current);
        cleanups.push(() => ro.disconnect());

        // ── Helpers ───────────────────────────────────────────────────────

        /** Snapshot the current canvas state onto the undo stack. */
        function pushHistory() {
          const snap = fc.toJSON();
          history.push(snap);
          if (history.length > MAX_HISTORY) history.shift();
        }

        /**
         * Restore a snapshot. loadFromJSON re-adds all objects and restores
         * backgroundColor, so we just need to re-attach the clipPath after.
         */
        async function restoreSnapshot(snap: object) {
          await fc.loadFromJSON(snap);
          // Re-attach the circular clip (loadFromJSON may clear it if it
          // wasn't part of the snapshot; we always keep the clip separate)
          if (!fc.clipPath) fc.clipPath = clipCircle;
          fc.requestRenderAll();
        }

        // ── 5. Fill tool ──────────────────────────────────────────────────
        // Find an existing fill-circle by tag so we can replace its color
        // instead of stacking multiple circles on top of each other.
        const FILL_TAG = "__planetFill__";

        function applyFill(col: string) {
          // Look for an existing fill circle (tagged by our custom prop)
          const objs = fc.getObjects() as Array<Record<string, unknown>>;
          const existing = objs.find((o) => o[FILL_TAG] === true);

          if (existing) {
            // Update color in-place — no need to remove/re-add
            (
              existing as unknown as { set: (k: string, v: unknown) => void }
            ).set("fill", col);
          } else {
            const fillCircle = new Circle({
              left: CANVAS_SIZE / 2,
              top: CANVAS_SIZE / 2,
              radius: CANVAS_SIZE / 2,
              fill: col,
              originX: "center",
              originY: "center",
              selectable: false,
              evented: false,
            }) as unknown as Record<string, unknown>;
            fillCircle[FILL_TAG] = true;
            fc.add(fillCircle as never);
            fc.sendObjectToBack(fillCircle as never);
          }

          fc.requestRenderAll();
        }

        const fillHandler = () => {
          const { tool, currentColor: col } = useCanvasStore.getState();
          if (tool !== "fill") return;
          applyFill(col);
          // push the snapshot AFTER the fill has been applied
          pushHistory();
        };

        fc.on("mouse:down", fillHandler);
        cleanups.push(() => fc.off("mouse:down", fillHandler));

        // ── 6. Undo: snapshot AFTER the stroke is committed
        // Push a history snapshot when a path is created (end of stroke).
        const pathCreatedHandler = () => {
          pushHistory();
        };
        fc.on("path:created", pathCreatedHandler);
        cleanups.push(() => fc.off("path:created", pathCreatedHandler));

        // ── 7. Sync store state → Fabric ──────────────────────────────────
        const unsubStore = useCanvasStore.subscribe((state, prev) => {
          if (disposed || !fcRef.current) return;
          const fc_ = fcRef.current;

          if (
            state.tool !== prev.tool ||
            state.currentColor !== prev.currentColor
          ) {
            if (state.tool === "fill") {
              fc_.isDrawingMode = false;
            } else if (state.tool === "eraser") {
              fc_.isDrawingMode = true;
              if (fc_.freeDrawingBrush) fc_.freeDrawingBrush.color = BG_COLOR;
            } else {
              fc_.isDrawingMode = true;
              if (fc_.freeDrawingBrush)
                fc_.freeDrawingBrush.color = state.currentColor;
            }
          }

          if (state.brushSize !== prev.brushSize && fc_.freeDrawingBrush) {
            fc_.freeDrawingBrush.width = state.brushSize;
          }
        });
        cleanups.push(unsubStore);

        // ── 8. Register canvas actions in store ───────────────────────────
        const myActions = {
          undo: () => {
            // We maintain history where the last element is the CURRENT state.
            // Undo should discard the current state and restore the previous one.
            if (history.length <= 1) return;
            // discard current
            history.pop();
            const snap = history[history.length - 1];
            restoreSnapshot(snap);
          },

          clear: () => {
            const objs = fc.getObjects();
            if (objs.length > 0) fc.remove(...objs);
            fc.backgroundColor = BG_COLOR;
            fc.requestRenderAll();
            pushHistory();
          },

          async applyTemplate(id: string) {
            const fc_ = fcRef.current;
            if (!fc_) return;

            const tpl = TEMPLATES.find((t) => t.id === id);
            if (!tpl) return;

            // draw template, then snapshot
            const savedClip = fc_.clipPath;

            tpl.draw(
              {
                clear: () => fc_.clear(),
                add: (o) => fc_.add(o),
                requestRenderAll: () => fc_.requestRenderAll(),
                get backgroundColor() {
                  return fc_.backgroundColor;
                },
                set backgroundColor(v) {
                  fc_.backgroundColor = v;
                },
                get clipPath() {
                  return fc_.clipPath;
                },
                set clipPath(v) {
                  fc_.clipPath = v;
                },
              },
              {
                Circle: Circle as never,
                Rect: Rect as never,
                Line: Line as never,
                Path: Path as never,
              },
            );

            if (!fc_.clipPath && savedClip) {
              fc_.clipPath = savedClip;
            }
            fc_.requestRenderAll();
            pushHistory();
          },

          exportCanvas() {
            const fc_ = fcRef.current;
            if (!fc_) return null;
            try {
              const json = fc_.toJSON();

              // Protect against cases where the canvas zoom is 0 or invalid
              // (which can happen if the container has zero width for any reason).
              const rawZoom = fc_.getZoom();
              const zoom =
                typeof rawZoom === "number" && rawZoom > 0 ? rawZoom : 1;

              const target = 256;
              const multiplier = target / (CANVAS_SIZE * zoom);
              const safeMultiplier =
                Number.isFinite(multiplier) && multiplier > 0
                  ? multiplier
                  : target / CANVAS_SIZE;

              let dataUrl = fc_.toDataURL({
                format: "webp",
                quality: 0.82,
                multiplier: safeMultiplier,
              });
              if (!dataUrl.startsWith("data:image/webp")) {
                dataUrl = fc_.toDataURL({
                  format: "jpeg",
                  quality: 0.82,
                  multiplier: safeMultiplier,
                });
              }

              return {
                canvas_data: {
                  version: 1,
                  width: CANVAS_SIZE,
                  height: CANVAS_SIZE,
                  ...json,
                },
                texture_data_url: dataUrl,
              };
            } catch (err) {
              console.error("[exportCanvas] failed:", err);

              // Last-resort fallback: try exporting using a neutral multiplier
              // to avoid drawImage errors when some internal canvas has 0 size.
              try {
                const json = fc_.toJSON();
                const altMultiplier = 256 / CANVAS_SIZE;
                let dataUrl = fc_.toDataURL({
                  format: "webp",
                  quality: 0.82,
                  multiplier: altMultiplier,
                });
                if (!dataUrl.startsWith("data:image/webp")) {
                  dataUrl = fc_.toDataURL({
                    format: "jpeg",
                    quality: 0.82,
                    multiplier: altMultiplier,
                  });
                }
                return {
                  canvas_data: {
                    version: 1,
                    width: CANVAS_SIZE,
                    height: CANVAS_SIZE,
                    ...json,
                  },
                  texture_data_url: dataUrl,
                };
              } catch (err2) {
                console.error("[exportCanvas] fallback failed:", err2);
                return null;
              }
            }
          },
        } as const;

        useCanvasStore.getState().registerActions(myActions as any);

        fc.requestRenderAll();

        // snapshot initial state (current) so undo has a baseline
        pushHistory();
      },
    );

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
              ? {
                  border: "3px solid rgba(194,239,78,0.6)",
                  animation: "premium-pulse 2.5s ease-in-out infinite",
                }
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
