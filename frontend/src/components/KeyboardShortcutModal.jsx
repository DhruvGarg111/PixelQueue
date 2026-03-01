import { motion, AnimatePresence } from "framer-motion";
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
                className="text-gray-600 hover:text-ink w-8 h-8"
                title="Keyboard Shortcuts (?)"
            >
                <Keyboard className="w-4 h-4" />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-white/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-surface border border-border rounded-xl shadow-glass p-6 w-80 max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-ink font-mono flex items-center gap-2">
                                    <Keyboard className="w-5 h-5 text-primary" />
                                    Shortcuts
                                </h3>
                                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-ink">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {SHORTCUT_LIST.map((s) => (
                                    <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-border/5 last:border-0">
                                        <span className="text-xs text-gray-600">{s.label}</span>
                                        <kbd className="px-2 py-0.5 rounded bg-white/30 border border-border/10 text-xs font-mono text-ink">
                                            {s.ctrl ? "Ctrl+" : ""}{s.shift ? "Shift+" : ""}{s.key.toUpperCase()}
                                        </kbd>
                                    </div>
                                ))}

                                <div className="pt-2 border-t border-border/10 space-y-2">
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-xs text-gray-600">Zoom in</span>
                                        <kbd className="px-2 py-0.5 rounded bg-white/30 border border-border/10 text-xs font-mono text-ink">Ctrl++</kbd>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-xs text-gray-600">Zoom out</span>
                                        <kbd className="px-2 py-0.5 rounded bg-white/30 border border-border/10 text-xs font-mono text-ink">Ctrl+-</kbd>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-xs text-gray-600">Reset zoom</span>
                                        <kbd className="px-2 py-0.5 rounded bg-white/30 border border-border/10 text-xs font-mono text-ink">Ctrl+0</kbd>
                                    </div>
                                    <div className="flex justify-between items-center py-1.5">
                                        <span className="text-xs text-gray-600">Zoom (scroll)</span>
                                        <kbd className="px-2 py-0.5 rounded bg-white/30 border border-border/10 text-xs font-mono text-ink">Scroll</kbd>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
