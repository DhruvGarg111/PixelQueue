import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-9 w-full rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#020617] px-3 py-1 text-sm text-ink outline-none transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-faint focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Input.displayName = "Input"

export { Input }
