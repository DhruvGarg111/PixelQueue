import { useEffect } from "react";
import { useAnnotationStore } from "../store/annotationStore";

/**
 * Keyboard shortcut definitions.
 * Each entry maps a key combo to an action on the annotation store or a custom handler.
 */
const SHORTCUTS = [
    { key: "b", label: "Bounding Box tool", action: (store) => store.setTool("bbox") },
    { key: "p", label: "Polygon tool", action: (store) => store.setTool("polygon") },
    { key: "v", label: "Select tool", action: (store) => store.setTool("select") },
    { key: "Escape", label: "Deselect", action: (store) => { store.selectAnnotation(null); store.setTool("select"); } },
    {
        key: "Delete",
        label: "Delete selected",
        action: (store) => {
            const id = store.selectedId;
            if (id) store.removeAnnotation(id);
        },
    },
    {
        key: "Backspace",
        label: "Delete selected",
        action: (store) => {
            const id = store.selectedId;
            if (id) store.removeAnnotation(id);
        },
    },
    { key: "z", ctrl: true, label: "Undo", action: (store) => store.undo() },
    { key: "z", ctrl: true, shift: true, label: "Redo", action: (store) => store.redo() },
    { key: "y", ctrl: true, label: "Redo", action: (store) => store.redo() },
];

/**
 * Returns the full shortcut list (for display in the cheat sheet).
 */
export const SHORTCUT_LIST = SHORTCUTS.filter(
    (s, i, arr) => arr.findIndex((x) => x.label === s.label) === i,
);

/**
 * Hook that binds keyboard shortcuts for the annotation canvas.
 * Attach to any page or component that uses the annotation workflow.
 *
 * @param {{ onZoomIn?: () => void, onZoomOut?: () => void, onZoomReset?: () => void }} opts
 */
export function useKeyboardShortcuts({ onZoomIn, onZoomOut, onZoomReset } = {}) {
    useEffect(() => {
        const handler = (e) => {
            // Don't intercept when user is typing in an input
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;

            // Zoom shortcuts
            if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
                e.preventDefault();
                onZoomIn?.();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "-") {
                e.preventDefault();
                onZoomOut?.();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "0") {
                e.preventDefault();
                onZoomReset?.();
                return;
            }

            for (const shortcut of SHORTCUTS) {
                const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

                if (e.key === shortcut.key && ctrlMatch && shiftMatch) {
                    e.preventDefault();
                    shortcut.action(useAnnotationStore.getState());
                    return;
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onZoomIn, onZoomOut, onZoomReset]);
}
