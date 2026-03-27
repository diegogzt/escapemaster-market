import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
        {label && (
          <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/40 ml-1">
            {label}
          </label>
        )}
        <div className="relative group flex items-center">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-tropical-primary transition-colors pointer-events-none z-[1]">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 sm:h-12 w-full rounded-xl sm:rounded-2xl border border-input bg-white px-3 py-2 text-base sm:text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tropical-primary/20 focus-visible:border-tropical-primary disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
              icon ? "pl-10" : "",
              error ? "border-destructive focus-visible:ring-destructive/20" : "",
              className
            )}
            style={{ fontSize: '16px' }} // Prevent iOS zoom
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[10px] text-destructive font-bold uppercase tracking-tight ml-1">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
