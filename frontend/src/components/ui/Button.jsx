import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"
import { motion } from "framer-motion"

const buttonVariants = {
    default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-button",
    destructive: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-button",
    outline: "border border-border bg-surface hover:bg-gray-50 hover:text-ink shadow-sm text-ink",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-gray-100/50 hover:text-ink text-ink font-medium",
    link: "text-brand hover:text-brand-hover underline-offset-4 hover:underline font-medium",
    brand: "bg-brand text-white hover:bg-brand-hover shadow-button shadow-brand/20",
}

const buttonSizes = {
    default: "h-9 px-4 py-2 text-sm",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8 text-base",
    icon: "h-9 w-9",
}

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
        >
            <Comp
                className={cn(
                    "inline-flex w-full items-center justify-center rounded-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    buttonVariants[variant],
                    buttonSizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        </motion.div>
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
