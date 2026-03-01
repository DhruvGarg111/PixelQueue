import { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
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
    success: "border-l-2 border-l-[#10B981] bg-[#111827] text-ink",
    error: "border-l-2 border-l-[#EF4444] bg-[#111827] text-ink",
    warning: "border-l-2 border-l-[#F59E0B] bg-[#111827] text-ink",
    info: "border-l-2 border-l-[#3B82F6] bg-[#111827] text-ink",
};

const ICON_COLORS = {
    success: "text-[#10B981]",
    error: "text-[#EF4444]",
    warning: "text-[#F59E0B]",
    info: "text-[#3B82F6]",
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
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }) {
    const Icon = ICONS[toast.variant] || Info;
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // trigger CSS enter animation
        requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = "translateX(0)";
        });
    }, []);

    return (
        <div
            ref={ref}
            style={{
                opacity: 0,
                transform: "translateX(80px)",
                transition: "opacity 150ms ease, transform 150ms ease",
            }}
            className={cn(
                "pointer-events-auto rounded-[8px] border border-[rgba(255,255,255,0.06)] px-4 py-3 flex items-start gap-3 shadow-none",
                VARIANT_STYLES[toast.variant],
            )}
        >
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", ICON_COLORS[toast.variant])} />
            <div className="flex-1 min-w-0">
                {toast.title && (
                    <p className="text-sm font-semibold font-mono tracking-wide">{toast.title}</p>
                )}
                {toast.description && (
                    <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{toast.description}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-ink-faint hover:text-ink transition-colors duration-150 flex-shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
