import { cn } from '@/lib/utils'
import type { InlineLegendProps } from './surveyAnalyticsTypes'

/**
 * InlineLegend - Compact legend for charts and data visualization.
 */
export function InlineLegend({
  items,
  orientation = "horizontal",
  size = "md",
  className,
}: InlineLegendProps) {
  
  return (
    <div className={cn(
      "flex flex-wrap gap-x-6 gap-y-2",
      orientation === "vertical" && "flex-col",
      className
    )}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 group">
          {/* Visual Indicator */}
          <div className={cn(
            "rounded-sm shrink-0",
            size === "sm" ? "h-2 w-2 mt-1" : "h-2.5 w-2.5 mt-1.5",
            {
              "bg-primary": item.tone === "primary",
              "bg-success": item.tone === "positive",
              "bg-destructive": item.tone === "negative",
              "bg-warning": item.tone === "warning",
              "bg-info": item.tone === "info",
              "bg-muted-foreground": item.tone === "neutral" || !item.tone,
            }
          )} />
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium leading-none truncate",
                size === "sm" ? "text-[11px]" : "text-xs"
              )}>
                {item.label}
              </span>
              {item.value !== undefined && (
                <span className={cn(
                  "font-bold text-text-primary",
                  size === "sm" ? "text-[11px]" : "text-xs"
                )}>
                  {item.value}
                </span>
              )}
            </div>
            {item.description && (
              <span className={cn(
                "text-muted-foreground line-clamp-1",
                size === "sm" ? "text-[10px]" : "text-[11px]"
              )}>
                {item.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
