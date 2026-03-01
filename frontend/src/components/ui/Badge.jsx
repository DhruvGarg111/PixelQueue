import * as React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = {
    default: "border-transparent bg-primary/20 text-primary",
    secondary: "border-transparent bg-[rgba(255,255,255,0.1)] text-ink",
    destructive: "border-transparent bg-danger/20 text-danger",
    outline: "text-ink border-[rgba(255,255,255,0.1)]",
    success: "border-transparent bg-success/20 text-success",
    warning: "border-transparent bg-warning/20 text-warning",
    brand: "border-transparent bg-brand/20 text-brand",
}

function Badge({ className, variant = "default", ...props }) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-semibold font-mono tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
