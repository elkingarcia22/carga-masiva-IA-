import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  active?: boolean
}

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: string[]
}

const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(
  ({ items, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-1 text-xs", className)}
        {...props}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <React.Fragment key={index}>
              <span
                className={cn(
                  "transition-colors",
                  isLast ? "text-text-primary font-medium" : "text-text-muted hover:text-text-secondary cursor-default"
                )}
              >
                {item}
              </span>
              {!isLast && (
                <ChevronRight className="h-3 w-3 text-text-muted shrink-0" />
              )}
            </React.Fragment>
          )
        })}
      </nav>
    )
  }
)

Breadcrumbs.displayName = "Breadcrumbs"

export { Breadcrumbs }
