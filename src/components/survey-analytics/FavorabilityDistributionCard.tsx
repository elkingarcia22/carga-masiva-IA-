import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { ResponseStackedBar } from "./ResponseStackedBar"
import { MetricComparisonFooter } from "./MetricComparisonFooter"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { FavorabilityDistributionCardProps } from "./surveyAnalyticsTypes"

/**
 * FavorabilityDistributionCard
 * 
 * A specialized card to show the distribution of responses for a question
 * using a stacked bar and optional comparison metrics.
 */
export function FavorabilityDistributionCard({
  title,
  description,
  segments,
  total,
  showLegend = true,
  showComparisonFooter = false,
  comparisonItems,
  actions,
  footer,
  loading = false,
  empty = false,
  error,
  className,
}: FavorabilityDistributionCardProps) {

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-8 w-full rounded-full" />
          <div className="flex justify-between gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          {title && <CardTitle className="text-sm font-bold tracking-wider text-muted-foreground">{title}</CardTitle>}
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[160px]">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const hasData = segments.length > 0 && !empty

  return (
    <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-sm font-bold leading-snug">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center min-h-[120px] text-center border-2 border-dashed border-border/50 rounded-xl bg-muted/5 p-4">
            <span className="text-sm text-muted-foreground italic font-medium">
              No hay datos de distribución disponibles
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            <ResponseStackedBar 
              segments={segments}
              total={total}
              showLegend={showLegend}
              size="md"
              className="py-1"
            />

            {showComparisonFooter && comparisonItems && comparisonItems.length > 0 && (
              <MetricComparisonFooter 
                items={comparisonItems} 
                className="border-t-0 pt-0 pb-0" 
                columns={comparisonItems.length > 3 ? 4 : 3}
              />
            )}
          </div>
        )}
      </CardContent>

      {footer && (
        <CardFooter className="bg-muted/5 border-t border-border/5 text-[11px] text-muted-foreground py-3">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
