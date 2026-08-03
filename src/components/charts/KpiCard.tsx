import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SparklineChart } from "./SparklineChart"
import { cn } from "@/lib/utils"
import type { SparklineDatum } from "./SparklineChart"

export interface KpiCardProps {
  /** Card title — required */
  title: string
  /** Primary value (text or number) — must be visible, not chart-dependent */
  value: string | number
  /** Optional description below the value */
  description?: string
  /** Optional delta (e.g., "+5%" or "-2") */
  delta?: string
  /** Trend direction for visual context */
  trend?: "positive" | "negative" | "neutral"
  /** Optional sparkline data for inline visualization */
  sparklineData?: SparklineDatum[]
  /** Right-aligned header actions */
  actions?: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
  /** Optional CSS classes */
  className?: string
  /** Accessible label */
  ariaLabel?: string
}

/**
 * KpiCard
 *
 * Enterprise card for displaying key performance indicators.
 * Designed for dashboards, but this is a technical demo component.
 *
 * Structure:
 *   [title]        [actions]
 *   [value]
 *   [description]
 *   [delta]        [sparkline]
 *   [footer]
 *
 * The value is ALWAYS text/number — never chart-only.
 * Sparkline is optional visual context, not the primary information source.
 *
 * Trend prop applies subtle styling hints (color context).
 *
 * @example
 * <KpiCard
 *   title="Ingresos Mensuales"
 *   value="$12,450"
 *   delta="+8.5%"
 *   trend="positive"
 *   description="Comparado al mes anterior"
 *   sparklineData={[
 *     { label: "Week 1", value: 3000 },
 *     { label: "Week 2", value: 3500 },
 *     { label: "Week 3", value: 4000 },
 *     { label: "Week 4", value: 4950 },
 *   ]}
 * />
 */
export function KpiCard({
  title,
  value,
  description,
  delta,
  trend = "neutral",
  sparklineData,
  actions,
  footer,
  className,
  ariaLabel = title,
}: KpiCardProps) {
  // Color hints based on trend (for styling context only)
  const trendColorClass = {
    positive: "text-green-600 dark:text-green-500",
    negative: "text-red-600 dark:text-red-500",
    neutral: "text-muted-foreground",
  }[trend]

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Header: Title + Actions */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Main Value (text-based, never chart-dependent) */}
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-3xl font-bold text-foreground"
            aria-label={ariaLabel}
          >
            {value}
          </span>
          {delta && (
            <span className={cn("text-sm font-medium", trendColorClass)}>
              {delta}
            </span>
          )}
        </div>

        {/* Optional Description */}
        {description && (
          <p className="text-xs text-muted-foreground mb-4">{description}</p>
        )}

        {/* Optional Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-12 -mx-6 px-6">
            <SparklineChart
              data={sparklineData}
              height={40}
              trend={trend}
              showTooltip={true}
              ariaLabel={`${title} trend`}
            />
          </div>
        )}

        {/* Optional Footer */}
        {footer && (
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
