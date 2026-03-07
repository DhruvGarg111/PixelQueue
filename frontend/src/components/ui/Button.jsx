import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"

const buttonVariants = {
    default: "bg-primary text-background-dark border border-primary/20 hover:bg-primary/80 font-bold",
    destructive: "bg-red-500 text-slate-100 border border-red-500/20 hover:bg-red-500/80 font-bold",
    outline: "bg-transparent text-primary border border-primary/30 hover:bg-primary/10 font-bold",
    secondary: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-bold",
    ghost: "bg-transparent text-slate-300 border border-transparent hover:bg-primary/10 hover:text-primary font-bold",
    link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline font-bold",
    brand: "bg-primary text-background-dark border border-primary/20 hover:bg-primary/80 font-bold",
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
