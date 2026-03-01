import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"

const buttonVariants = {
    default: "bg-[#2563EB] text-white border border-[rgba(255,255,255,0.08)] hover:bg-[#3B82F6]",
    destructive: "bg-danger text-white border border-[rgba(255,255,255,0.08)] hover:bg-danger/80",
    outline: "bg-transparent text-ink border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)]",
    secondary: "bg-transparent text-ink border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.05)]",
    ghost: "bg-transparent text-ink border border-transparent hover:bg-[rgba(255,255,255,0.05)] text-ink font-medium hover:border-[rgba(255,255,255,0.05)]",
    link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline font-medium",
    brand: "bg-[#2563EB] text-white border border-[rgba(255,255,255,0.08)] hover:bg-[#3B82F6]",
}

const buttonSizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-8 text-base",
    icon: "h-9 w-9",
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            className={cn(
                "inline-flex w-full items-center justify-center rounded-[8px] font-medium transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50",
                buttonVariants[variant],
                buttonSizes[size],
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
