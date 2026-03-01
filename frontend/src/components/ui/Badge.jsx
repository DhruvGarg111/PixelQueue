import * as React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = {
    default: "border-transparent bg-primary text-primary-foreground shadow-sm",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-danger text-danger-foreground shadow-sm",
    outline: "text-ink border-border shadow-sm",
    success: "border-transparent bg-success/10 text-success border border-success/20",
    warning: "border-transparent bg-warning/10 text-warning border border-warning/20",
    brand: "border-transparent bg-brand/10 text-brand border border-brand/20",
}

function Badge({ className, variant = "default", ...props }) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
