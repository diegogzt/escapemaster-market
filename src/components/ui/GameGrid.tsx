import * as React from "react"
import { cn } from "../../lib/utils"

interface GameGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4
  lang?: string
}

const gridClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
}

export const GameGrid = React.forwardRef<HTMLDivElement, GameGridProps>(
  ({ className, columns = 3, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-4 sm:gap-6",
          gridClasses[columns],
          className
        )}
        {...props}
      />
    )
  }
)
GameGrid.displayName = "GameGrid"
