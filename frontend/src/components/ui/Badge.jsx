import * as React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = {
    default: "border-transparent bg-primary/20 text-primary hover:bg-primary/30",
    secondary: "border-transparent bg-secondary/20 text-secondary hover:bg-secondary/30",
    destructive: "border-transparent bg-danger/20 text-danger hover:bg-danger/30",
    outline: "text-foreground",
    success: "border-transparent bg-success/20 text-success hover:bg-success/30",
    warning: "border-transparent bg-warning/20 text-warning hover:bg-warning/30",
}

function Badge({ className, variant = "default", ...props }) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
