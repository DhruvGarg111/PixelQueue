import { create } from "zustand";
import type { AnnotationItem, Geometry } from "../types/domain";

export type ToolType = "select" | "bbox" | "polygon";

export interface LocalAnnotation {
  id: string;
  label: string;
  geometry: Geometry;
  source: "manual" | "auto";
  status: "draft" | "approved" | "rejected";
  confidence?: number | null;
}

type AnnotationState = {
  tool: ToolType;
  annotations: LocalAnnotation[];
  selectedId: string | null;
  setTool: (tool: ToolType) => void;
  setAnnotationsFromServer: (items: AnnotationItem[]) => void;
  replaceAnnotations: (items: LocalAnnotation[]) => void;
  addAnnotation: (item: LocalAnnotation) => void;
  updateAnnotation: (id: string, patch: Partial<LocalAnnotation>) => void;
  removeAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  reset: () => void;
};

export const useAnnotationStore = create<AnnotationState>((set) => ({
  tool: "select",
  annotations: [],
  selectedId: null,
  setTool: (tool) => set({ tool }),
  setAnnotationsFromServer: (items) =>
    set({
      annotations: items.map((it) => ({
        id: it.id,
        label: it.label,
        geometry: it.geometry,
        source: it.source,
        status: it.status,
        confidence: it.confidence,
      })),
      selectedId: null,
    }),
  replaceAnnotations: (items) => set({ annotations: items }),
  addAnnotation: (item) => set((state) => ({ annotations: [...state.annotations, item], selectedId: item.id })),
  updateAnnotation: (id, patch) =>
    set((state) => ({
      annotations: state.annotations.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((it) => it.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  selectAnnotation: (id) => set({ selectedId: id }),
  reset: () => set({ tool: "select", annotations: [], selectedId: null }),
}));

