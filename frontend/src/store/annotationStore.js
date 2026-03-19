import { create } from "zustand";

const MAX_HISTORY = 50;

/**
 * Push the current annotations snapshot into the undo stack.
 * Clears the redo stack (new edits invalidate forward history).
 */
function pushHistory(state) {
    const snapshot = JSON.parse(JSON.stringify(state.annotations));
    const past = state._past.length >= MAX_HISTORY
        ? state._past.slice(1)
        : state._past;
    return { _past: [...past, snapshot], _future: [] };
}

export const useAnnotationStore = create((set, get) => ({
    tool: "select",
    annotations: [],
    selectedId: null,

    // --- Undo/Redo History ---
    _past: [],
    _future: [],

    undo: () => {
        const { _past, annotations, _future } = get();
        if (_past.length === 0) return;
        const previous = _past[_past.length - 1];
        set({
            _past: _past.slice(0, -1),
            _future: [JSON.parse(JSON.stringify(annotations)), ..._future],
            annotations: previous,
            selectedId: null,
        });
    },

    redo: () => {
        const { _past, annotations, _future } = get();
        if (_future.length === 0) return;
        const next = _future[0];
        set({
            _past: [..._past, JSON.parse(JSON.stringify(annotations))],
            _future: _future.slice(1),
            annotations: next,
            selectedId: null,
        });
    },

    // --- Tool ---
    setTool: (tool) => set({ tool }),

    // --- Server Data (no history — external source of truth) ---
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
            _past: [],
            _future: [],
        }),

    // --- Mutations (each pushes undo history) ---
    addAnnotation: (item) =>
        set((state) => ({
            ...pushHistory(state),
            annotations: [...state.annotations, item],
            selectedId: item.id,
        })),

    updateAnnotation: (id, patch) =>
        set((state) => ({
            ...pushHistory(state),
            annotations: state.annotations.map((it) =>
                it.id === id ? { ...it, ...patch } : it,
            ),
        })),

    removeAnnotation: (id) =>
        set((state) => ({
            ...pushHistory(state),
            annotations: state.annotations.filter((it) => it.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
        })),

    selectAnnotation: (id) => set({ selectedId: id }),

    reset: () =>
        set({
            tool: "select",
            annotations: [],
            selectedId: null,
            _past: [],
            _future: [],
        }),
}));
