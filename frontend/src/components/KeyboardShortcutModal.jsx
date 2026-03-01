import { Keyboard, X } from "lucide-react";
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
                className="text-ink-faint hover:text-ink w-8 h-8"
                title="Keyboard Shortcuts (?)"
            >
                <Keyboard className="w-4 h-4" />
            </Button>

            {open && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-[#111827] border border-[rgba(255,255,255,0.06)] rounded-[8px] p-6 w-80 max-h-[80vh] overflow-y-auto shadow-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-ink font-mono flex items-center gap-2 uppercase tracking-wider">
                                <Keyboard className="w-4 h-4 text-primary" />
                                Shortcuts
                            </h3>
                            <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink transition-colors duration-150">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            {SHORTCUT_LIST.map((s) => (
                                <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                                    <span className="text-xs text-ink-muted">{s.label}</span>
                                    <kbd className="px-2 py-0.5 rounded-[4px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-ink">
                                        {s.ctrl ? "Ctrl+" : ""}{s.shift ? "Shift+" : ""}{s.key.toUpperCase()}
                                    </kbd>
                                </div>
                            ))}

                            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] space-y-1">
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-ink-muted">Zoom in</span>
                                    <kbd className="px-2 py-0.5 rounded-[4px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-ink">Ctrl++</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-ink-muted">Zoom out</span>
                                    <kbd className="px-2 py-0.5 rounded-[4px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-ink">Ctrl+-</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-ink-muted">Reset zoom</span>
                                    <kbd className="px-2 py-0.5 rounded-[4px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-ink">Ctrl+0</kbd>
                                </div>
                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-ink-muted">Zoom (scroll)</span>
                                    <kbd className="px-2 py-0.5 rounded-[4px] bg-[#020617] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-ink">Scroll</kbd>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
