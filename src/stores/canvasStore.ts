import { create } from "zustand";
import type { PlanetType } from "@/types/tier";

export type DrawTool = "brush" | "fill" | "eraser";

interface CanvasState {
  // Fabric instance ref (set by PlanetCanvas component)
  fabricRef: React.RefObject<unknown> | null;
  setFabricRef: (ref: React.RefObject<unknown>) => void;

  // Direct DOM ref to the actual <canvas> element Fabric renders on
  canvasEl: React.RefObject<HTMLCanvasElement | null> | null;
  setCanvasEl: (ref: React.RefObject<HTMLCanvasElement | null>) => void;

  // Drawing
  tool: DrawTool;
  setTool: (tool: DrawTool) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;

  // Planet metadata
  planetName: string;
  setPlanetName: (name: string) => void;
  planetType: PlanetType;
  setPlanetType: (type: PlanetType) => void;
  selectedSystemId: string;
  setSelectedSystemId: (id: string) => void;

  // UI state
  isPublishing: boolean;
  setIsPublishing: (val: boolean) => void;
  publishError: string | null;
  setPublishError: (msg: string | null) => void;
  publishedPlanetId: string | null;
  setPublishedPlanetId: (id: string | null) => void;

  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  fabricRef: null,
  setFabricRef: (ref) => set({ fabricRef: ref }),

  canvasEl: null,
  setCanvasEl: (ref) => set({ canvasEl: ref }),

  tool: "brush",
  setTool: (tool) => set({ tool }),
  currentColor: "#c2543a",
  setCurrentColor: (currentColor) => set({ currentColor }),
  brushSize: 12,
  setBrushSize: (brushSize) => set({ brushSize }),

  planetName: "",
  setPlanetName: (planetName) => set({ planetName }),
  planetType: "rocky",
  setPlanetType: (planetType) => set({ planetType }),
  selectedSystemId: "",
  setSelectedSystemId: (selectedSystemId) => set({ selectedSystemId }),

  isPublishing: false,
  setIsPublishing: (isPublishing) => set({ isPublishing }),
  publishError: null,
  setPublishError: (publishError) => set({ publishError }),
  publishedPlanetId: null,
  setPublishedPlanetId: (publishedPlanetId) => set({ publishedPlanetId }),

  reset: () =>
    set({
      tool: "brush",
      currentColor: "#c2543a",
      brushSize: 12,
      planetName: "",
      planetType: "rocky",
      isPublishing: false,
      publishError: null,
      publishedPlanetId: null,
    }),
}));
