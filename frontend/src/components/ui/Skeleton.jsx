import { cn } from "../../lib/utils";

/**
 * Skeleton loader with a subtle shimmer animation.
 * Use to indicate loading states across cards, lists, and text blocks.
 *
 * @example
 *   <Skeleton className="h-8 w-48" />
 *   <Skeleton variant="circle" className="h-12 w-12" />
 *   <Skeleton variant="text" count={3} />
 */
export function Skeleton({ className, variant = "rect", count = 1 }) {
    if (variant === "text") {
        return (
            <div className="space-y-2">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-3 rounded-[4px] bg-[rgba(255,255,255,0.06)] animate-pulse",
                            i === count - 1 ? "w-3/4" : "w-full",
                            className,
                        )}
                    />
                ))}
            </div>
        );
    }

    if (variant === "circle") {
        return (
            <div
                className={cn(
                    "rounded-full bg-[rgba(255,255,255,0.06)] animate-pulse",
                    className,
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                "rounded-[8px] bg-[rgba(255,255,255,0.06)] animate-pulse",
                className,
            )}
        />
    );
}

/**
 * Pre-built skeleton for a project card.
 */
export function ProjectCardSkeleton() {
    return (
        <div className="rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#111827] p-5 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-[8px]" />
            </div>
            <Skeleton variant="text" count={2} />
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
            </div>
        </div>
    );
}

/**
 * Pre-built skeleton for a metric card.
 */
export function MetricCardSkeleton() {
    return (
        <div className="rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#111827] p-5 space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-[8px] bg-[#020617] flex flex-col items-center gap-2">
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-2 w-16" />
                </div>
                <div className="p-4 rounded-[8px] bg-[#020617] flex flex-col items-center gap-2">
                    <Skeleton className="h-8 w-10" />
                    <Skeleton className="h-2 w-16" />
                </div>
            </div>
        </div>
    );
}
