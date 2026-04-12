"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "@/stores/canvasStore";

const CANVAS_SIZE = 512;

export function PlanetCanvas() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const store = useCanvasStore();

  useEffect(() => {
    if (!canvasEl.current) return;

    // `disposed` is set to true by the cleanup function before React re-mounts
    // (StrictMode double-invoke). The .then() checks it so a stale import
    // callback never initializes a canvas that was already torn down.
    let disposed = false;
    let fc: { dispose: () => void } | null = null;

    // Dynamic import to avoid SSR issues
    import("fabric").then(({ Canvas, PencilBrush, Circle }) => {
      // Bail if cleanup already ran (StrictMode unmount or real unmount).
      if (disposed || !canvasEl.current) return;

      // Extra safety: check if canvas already has a fabric instance
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

      // Mark canvas as having a fabric instance
      canvas._fabricjs = true;

      // Circular clip path — planets are round
      const clipCircle = new Circle({
        radius: CANVAS_SIZE / 2,
        left: 0,
        top: 0,
        originX: "left",
        originY: "top",
      });
      (fc as unknown as Record<string, unknown>).clipPath = clipCircle;

      // Default brush
      const brush = new PencilBrush(fc as never);
      (brush as unknown as Record<string, unknown>).color = store.currentColor;
      (brush as unknown as Record<string, unknown>).width = store.brushSize;
      (fc as unknown as Record<string, unknown>).freeDrawingBrush = brush;

      fabricRef.current = fc;
      store.setFabricRef(fabricRef);
      store.setCanvasEl(canvasEl);
    });

    // Cleanup runs synchronously on unmount (StrictMode teardown included).
    // Setting `disposed = true` before the import resolves prevents the stale
    // .then() callback from creating a second canvas on the same element.
    return () => {
      disposed = true;
      fc?.dispose();
      // Clear the fabric marker on the canvas element
      if (canvasEl.current) {
        (canvasEl.current as HTMLCanvasElement & { _fabricjs?: unknown })._fabricjs = undefined;
      }
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync tool changes
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

  // Sync brush size
  useEffect(() => {
    if (!fabricRef.current) return;
    const fc = fabricRef.current as Record<string, unknown>;
    const brush = fc.freeDrawingBrush as Record<string, unknown> | null;
    if (brush) brush.width = store.brushSize;
  }, [store.brushSize]);

  // Fill tool — flood fill approximation using background color
  const handleClick = useCallback(() => {
    if (store.tool !== "fill" || !fabricRef.current) return;
    const fc = fabricRef.current as Record<string, unknown>;
    (fc as { backgroundColor: string }).backgroundColor = store.currentColor;
    (fc as { requestRenderAll: () => void }).requestRenderAll();
  }, [store.tool, store.currentColor]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative ring around the planet */}
      <div
        className="absolute rounded-full border-2 border-border-purple/40 pointer-events-none"
        style={{ width: CANVAS_SIZE + 16, height: CANVAS_SIZE + 16 }}
      />
      <canvas
        ref={canvasEl}
        onClick={handleClick}
        className="rounded-full cursor-crosshair touch-none"
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      />
    </div>
  );
}
