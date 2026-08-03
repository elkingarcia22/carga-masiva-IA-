import { cn } from '@/lib/utils'
import { DeltaPill } from './DeltaPill'
import type { MetricComparisonFooterProps } from './surveyAnalyticsTypes'

/**
 * MetricComparisonFooter - High-density comparison section for analytic cards.
 * Updated to be responsive with flex-wrap.
 */
export function MetricComparisonFooter({
  items,
  columns = 3,
  className,
}: MetricComparisonFooterProps) {
  
  return (
    <div className={cn(
      "flex flex-wrap gap-x-6 gap-y-4 py-4 border-t border-border/40",
      className
    )}>
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-1.5 min-w-[100px] flex-1 sm:flex-none">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground whitespace-nowrap">
            {item.label}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">
              {item.value}
            </span>
            {(item.delta !== undefined || item.deltaLabel) && (
              <DeltaPill 
                value={item.delta} 
                label={item.deltaLabel} 
                tone={item.tone}
                size="sm" 
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
