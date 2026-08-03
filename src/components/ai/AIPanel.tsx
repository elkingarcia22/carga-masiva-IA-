import { Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/feedback"

export type AIPanelProps = {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  footer?: React.ReactNode
  loading?: boolean
  empty?: boolean
  emptyState?: React.ReactNode
  className?: string
}

export function AIPanel({
  title = "Insights de IA",
  description,
  children,
  actions,
  footer,
  loading = false,
  empty = false,
  emptyState,
  className,
}: AIPanelProps) {
  return (
    <Card className={cn("border-primary/20 bg-primary/5 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold text-primary">
              {title}
            </CardTitle>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Generando insights estratégicos...</p>
          </div>
        ) : empty ? (
          emptyState || (
            <EmptyState
              title="Sin insights disponibles"
              description="No se han detectado patrones o recomendaciones relevantes en este momento."
              className="bg-transparent border-none shadow-none"
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {children}
          </div>
        )}
      </CardContent>
      {footer && (
        <CardFooter className="border-t border-primary/10 pt-4 mt-2">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
