import { cn } from "../../lib/utils";

/**
 * Reusable empty state component with consistent styling.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-10 border border-dashed border-primary/20 rounded bg-primary/5",
                className,
            )}
        >
            {typeof Icon === "string" ? (
                <span className="material-symbols-outlined text-[48px] text-primary/50 mb-4">{Icon}</span>
            ) : Icon ? (
                <Icon className="w-12 h-12 text-primary/50 mb-4" />
            ) : null}
            {title && (
                <h3 className="text-base font-bold text-slate-100 mb-1 font-mono uppercase tracking-widest">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-slate-400 text-center max-w-sm text-sm font-bold">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
