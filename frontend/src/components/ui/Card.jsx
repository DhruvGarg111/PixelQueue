import * as React from "react"
import { cn } from "../../lib/utils"

const Card = React.forwardRef(({ className, disableAnimation = true, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "rounded-lg border border-primary/20 bg-background-dark/80 text-slate-100 transition-colors duration-150 hover:border-primary/50 shadow-none backdrop-blur",
                className
            )}
            {...props}
        />
    )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-5 pb-4", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-bold leading-none tracking-tight font-display text-slate-100",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-slate-400 font-mono tracking-wider", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-5 pt-0 border-t border-primary/20 bg-primary/5 mt-4 rounded-b-lg", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
