import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/feedback"
import { Database } from "lucide-react"

interface TableShellProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  empty?: boolean
  emptyState?: React.ReactNode
  stickyHeader?: boolean
}

export function TableShell({
  title,
  description,
  actions,
  children,
  empty = false,
  emptyState,
  stickyHeader = false,
  className,
  ...props
}: TableShellProps) {
  return (
    <Card className={cn("overflow-hidden border-border bg-card", className)} {...props}>
      {(title || description || actions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && <CardTitle className="text-lg font-bold text-text-primary">{title}</CardTitle>}
            {description && <CardDescription className="text-sm text-text-secondary">{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </CardHeader>
      )}
      
      <CardContent className={cn("p-0", (title || description || actions) ? "pt-0" : "pt-0")}>
        {empty ? (
          <div className="p-8">
            {emptyState || (
              <EmptyState
                icon={Database}
                title="Sin información"
                description="No se encontraron registros para mostrar en esta tabla."
                className="border-none shadow-none bg-transparent"
              />
            )}
          </div>
        ) : (
          <div 
            className={cn(
              "relative overflow-x-auto w-full",
              stickyHeader && "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-card"
            )}
          >
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
