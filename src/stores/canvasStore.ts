import { create } from "zustand";
import type { PlanetType } from "@/types/tier";

export type DrawTool = "brush" | "fill" | "eraser";

// Actions registered by PlanetCanvas once Fabric is ready
interface CanvasActions {
  undo: () => void;
  clear: () => void;
  applyTemplate: (id: string) => Promise<void>;
  exportCanvas: () => { canvas_data: object; texture_data_url: string } | null;
}

interface CanvasState {
  // Drawing tool state
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

  // Canvas actions — registered by PlanetCanvas after Fabric is ready
  actions: CanvasActions | null;
  registerActions: (actions: CanvasActions) => void;
  clearActions: () => void;

  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
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

  actions: null,
  registerActions: (actions) => set({ actions }),
  clearActions: () => set({ actions: null }),

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
