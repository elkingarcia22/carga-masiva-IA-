import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  eyebrow?: string
}

/**
 * SectionHeader
 * 
 * Standard header for internal sections of a page.
 * Provides clear hierarchy with support for titles, descriptions, eyebrows and action slots.
 */
export function SectionHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 pb-4 border-b", className)} {...props}>
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold   text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
