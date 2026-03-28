import * as React from "react"
import { cn } from "../../lib/utils"

interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  background?: "white" | "tropical-bg" | "tropical-card" | "tropical-primary" | "tropical-secondary"
  padding?: "none" | "sm" | "default" | "lg" | "xl"
}

const bgClasses = {
  "white": "bg-white",
  "tropical-bg": "bg-tropical-bg",
  "tropical-card": "bg-tropical-card",
  "tropical-primary": "bg-tropical-primary",
  "tropical-secondary": "bg-tropical-secondary"
}

const paddingClasses = {
  "none": "",
  "sm": "py-6 sm:py-8",
  "default": "py-10 sm:py-12 lg:py-16",
  "lg": "py-12 sm:py-16 lg:py-20",
  "xl": "py-16 sm:py-20 lg:py-24"
}

export const SectionContainer = React.forwardRef<HTMLDivElement, SectionContainerProps>(
  ({ className, background = "white", padding = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          bgClasses[background],
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    )
  }
)
SectionContainer.displayName = "SectionContainer"
