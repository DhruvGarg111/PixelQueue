import { create } from "zustand";

export const useAnnotationStore = create((set) => ({
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
