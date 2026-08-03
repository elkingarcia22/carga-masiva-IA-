import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
  meta?: React.ReactNode
}

/**
 * PageHeader
 * 
 * Top-level header for application pages.
 * Organizes titles, navigation context (breadcrumbs), primary actions and metadata in a consistent enterprise layout.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  meta,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6", className)} {...props}>
      {breadcrumbs && <div>{breadcrumbs}</div>}
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>

      {meta && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {meta}
        </div>
      )}
    </div>
  )
}
