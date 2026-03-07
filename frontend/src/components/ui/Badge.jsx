import * as React from "react"
import { cn } from "../../lib/utils"

const badgeVariants = {
    default: "border-transparent bg-primary/20 text-primary",
    secondary: "border-transparent bg-primary/10 text-primary/80",
    destructive: "border-transparent bg-red-500/20 text-red-500",
    outline: "text-slate-300 border-primary/20",
    success: "border-transparent bg-[#10B981]/20 text-[#10B981]",
    warning: "border-transparent bg-[#F59E0B]/20 text-[#F59E0B]",
    brand: "border-transparent bg-primary/20 text-primary",
}

function Badge({ className, variant = "default", ...props }) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold font-mono tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                badgeVariants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
