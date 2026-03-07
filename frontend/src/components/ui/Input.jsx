import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-9 w-full rounded border border-primary/20 bg-background-dark/50 px-3 py-1 text-sm text-slate-100 outline-none transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
