import { cn } from "../../lib/utils";

/**
 * Reusable empty state component with consistent styling.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-10 border border-dashed border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]",
                className,
            )}
        >
            {Icon && <Icon className="w-12 h-12 text-ink-faint mb-4" />}
            {title && (
                <h3 className="text-base font-semibold text-ink mb-1 font-mono">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-ink-muted text-center max-w-sm text-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
