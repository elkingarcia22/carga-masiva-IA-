import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { TrendMetricLineChart } from "./TrendMetricLineChart"
import { DeltaPill } from "./DeltaPill"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { ParticipationTrendCardProps } from "./surveyAnalyticsTypes"

/**
 * ParticipationTrendCard
 * 
 * A high-level analytic card to display a temporal trend (participation or metrics)
 * with an optional main value highlight (KPI style) and full ECharts line chart.
 */
export function ParticipationTrendCard({
  title,
  description,
  series,
  value,
  subtitle,
  delta,
  deltaLabel,
  deltaTone,
  showComparison = true,
  actions,
  footer,
  loading = false,
  empty = false,
  error,
  className,
}: ParticipationTrendCardProps) {

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-32 w-full" />
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

  const hasData = series.length > 0 && !empty

  return (
    <Card className={cn("h-full flex flex-col overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-sm font-bold leading-snug">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-xs line-clamp-1">
                {description}
              </CardDescription>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pt-2">
        {/* Metric Highlight (KPI style) */}
        {value !== undefined && (
          <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            {subtitle && (
              <span className="text-xs font-medium text-muted-foreground">
                {subtitle}
              </span>
            )}
            {(delta !== undefined || deltaLabel) && (
              <DeltaPill 
                value={delta} 
                label={deltaLabel} 
                tone={deltaTone} 
                size="md"
              />
            )}
          </div>
        )}

        {/* Trend Chart */}
        <div className="h-40 -mx-2">
          <TrendMetricLineChart 
            series={series}
            height={160}
            showLegend={series.length > 1}
            showComparison={showComparison}
            empty={!hasData}
            className="border-0 shadow-none bg-transparent"
          />
        </div>
      </CardContent>

      {footer && (
        <CardFooter className="bg-muted/5 border-t border-border/5 text-[11px] text-muted-foreground py-3">
          {footer}
        </CardFooter>
      )}
    </Card>
  )
}
