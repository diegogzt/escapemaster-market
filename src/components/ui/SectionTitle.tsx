import * as React from "react"
import { cn } from "../../lib/utils"

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  align?: "left" | "center" | "right"
}

export const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  ({ className, title, subtitle, align = "center", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mb-8 sm:mb-12",
          align === "left" && "text-left",
          align === "center" && "text-center",
          align === "right" && "text-right",
          className
        )}
        {...props}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-tropical-primary tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-lg sm:text-xl text-tropical-text/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    )
  }
)
SectionTitle.displayName = "SectionTitle"
