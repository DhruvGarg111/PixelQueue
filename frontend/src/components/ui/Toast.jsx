import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

const ToastContext = createContext(null);

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const VARIANT_STYLES = {
    success: "border-l-4 border-l-success bg-surface/95 text-ink",
    error: "border-l-4 border-l-danger bg-surface/95 text-ink",
    warning: "border-l-4 border-l-warning bg-surface/95 text-ink",
    info: "border-l-4 border-l-primary bg-surface/95 text-ink",
};

const ICON_COLORS = {
    success: "text-success",
    error: "text-danger",
    warning: "text-warning",
    info: "text-primary",
};

let toastId = 0;

/**
 * Provider that manages toast state.
 * Wrap your app root with <ToastProvider> and use the useToast() hook.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ title, description, variant = "info", duration = 4000 }) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastViewport toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

/**
 * Hook to show toasts from any component.
 * @returns {{ toast: (opts) => number, dismiss: (id) => void }}
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
    return { toast: ctx.addToast, dismiss: ctx.removeToast };
}

function ToastViewport({ toasts, onRemove }) {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onRemove={onRemove} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    const Icon = ICONS[toast.variant] || Info;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn(
                "pointer-events-auto rounded-lg border border-border shadow-glass px-4 py-3 backdrop-blur-md flex items-start gap-3",
                VARIANT_STYLES[toast.variant],
            )}
        >
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", ICON_COLORS[toast.variant])} />
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold font-mono tracking-wide">{toast.title}</p>
                )}
                {toast.description && (
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{toast.description}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-gray-500 hover:text-ink transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
