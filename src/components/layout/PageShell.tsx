import * as React from "react"
import { cn } from "@/lib/utils"

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "enterprise" | "full" | "constrained"
}

const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, maxWidth = "enterprise", children, ...props }, ref) => {
    const maxWidthClass = {
      enterprise: "max-w-[1600px]",
      constrained: "max-w-[1200px]",
      full: "max-w-full",
    }[maxWidth]

    return (
      <main
        ref={ref}
        className={cn(
          "flex-1 overflow-y-auto bg-app p-8 transition-all scroll-smooth",
          className
        )}
        {...props}
      >
        <div className={cn("mx-auto flex flex-col space-y-8", maxWidthClass)}>
          {children}
        </div>
      </main>
    )
  }
)
PageShell.displayName = "PageShell"

export { PageShell }