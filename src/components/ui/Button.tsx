import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] touch-manipulation select-none",
  {
    variants: {
      variant: {
        default: "bg-tropical-primary text-white hover:bg-tropical-primary/90 shadow-lg hover:shadow-xl",
        secondary: "bg-tropical-secondary text-white hover:bg-tropical-secondary/90 shadow-md",
        outline: "border-2 border-tropical-primary text-tropical-primary bg-transparent hover:bg-tropical-primary/10",
        ghost: "hover:bg-tropical-primary/10 text-tropical-text",
        cta: "bg-tropical-accent text-white hover:bg-tropical-accent/90 shadow-lg hover:shadow-orange-500/20",
        link: "text-tropical-primary underline-offset-4 hover:underline",
        tropical: "bg-tropical-primary text-white hover:bg-tropical-primary/90 shadow-lg",
      },
      size: {
        default: "h-11 sm:h-10 px-5 py-2 min-w-[44px]",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 sm:h-12 rounded-xl px-8 text-base min-w-[48px]",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
