import { useState } from "react";
import { SHORTCUT_LIST } from "../hooks/useKeyboardShortcuts";
import { Button } from "./ui/Button";

/**
 * A keyboard shortcut cheat sheet modal, toggled via the `?` key
 * or a button in the toolbar.
 */
export function KeyboardShortcutModal() {
    const [open, setOpen] = useState(false);

    // Listen for `?` key to toggle
    if (typeof window !== "undefined") {
        window.__shortcutModalToggle = () => setOpen((v) => !v);
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                className="text-primary/70 hover:text-primary w-8 h-8"
                title="Keyboard Shortcuts (?)"
            >
                <span className="material-symbols-outlined text-[16px]">keyboard</span>
            </Button>

            {open && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center bg-background-dark/80 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-background-dark border border-primary/20 rounded-lg p-6 w-80 max-h-[80vh] overflow-y-auto shadow-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[16px] text-primary">keyboard</span>
                                Shortcuts
                            </h3>
                            <button onClick={() => setOpen(false)} className="text-primary/50 hover:text-primary transition-colors duration-150">
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>

                        <div className="space-y-1">
                            {SHORTCUT_LIST.map((s) => (
                                <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-primary/10 last:border-0 font-bold">
                                    <span className="text-xs text-slate-400">{s.label}</span>
                                    <kbd className="px-2 py-0.5 rounded bg-background-dark border border-primary/30 text-[10px] font-mono text-primary/80">
                                        {s.ctrl ? "Ctrl+" : ""}{s.shift ? "Shift+" : ""}{s.key.toUpperCase()}
                                    </kbd>
                                </div>
                            ))}

                            <div className="pt-2 border-t border-primary/20 space-y-1 font-bold">
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-slate-400">Zoom in</span>
                                    <kbd className="px-2 py-0.5 rounded bg-background-dark border border-primary/30 text-[10px] font-mono text-primary/80">Ctrl++</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-slate-400">Zoom out</span>
                                    <kbd className="px-2 py-0.5 rounded bg-background-dark border border-primary/30 text-[10px] font-mono text-primary/80">Ctrl+-</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-slate-400">Reset zoom</span>
                                    <kbd className="px-2 py-0.5 rounded bg-background-dark border border-primary/30 text-[10px] font-mono text-primary/80">Ctrl+0</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-slate-400">Zoom (scroll)</span>
                                    <kbd className="px-2 py-0.5 rounded bg-background-dark border border-primary/30 text-[10px] font-mono text-primary/80">Scroll</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
