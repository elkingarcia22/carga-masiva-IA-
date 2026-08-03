import { cn } from '@/lib/utils'
import { ResponseStackedBar } from './ResponseStackedBar'
import { InlineLegend } from './InlineLegend'
import type { ResponseStackedBarGroupProps, LegendItem, LegendTone } from './surveyAnalyticsTypes'

/**
 * ResponseStackedBarGroup - Renders a collection of distribution bars.
 * Ideal for comparing multiple questions or segments.
 */
export function ResponseStackedBarGroup({
  items,
  title,
  description,
  showLegend = true,
  showPercentages = true,
  showIndividualLegends = false,
  size = "md",
  className,
  standalone = false,
  hideHeader = false,
  compact = false,
}: ResponseStackedBarGroupProps & { showIndividualLegends?: boolean }) {
  
  // Extract shared legend if requested
  const sharedLegendItems: LegendItem[] = []
  if (showLegend && items.length > 0 && !showIndividualLegends) {
    // Collect all unique tones/labels from segments (assuming they follow a consistent scale)
    const uniqueSegments = new Map<string, { label: string, tone?: LegendTone }>()
    items.forEach(item => {
      item.segments.forEach(segment => {
        if (!uniqueSegments.has(segment.label)) {
          uniqueSegments.set(segment.label, { label: segment.label, tone: segment.tone })
        }
      })
    })
    
    uniqueSegments.forEach(s => {
      sharedLegendItems.push({ label: s.label, tone: s.tone })
    })
  }

  return (
    <div className={cn(compact ? "space-y-4" : "space-y-6", className)}>
      {/* Group Header */}
      {!hideHeader && (title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-base font-bold leading-tight">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Shared Legend (Top) - Only if not showing individual ones */}
      {showLegend && sharedLegendItems.length > 0 && !showIndividualLegends && (
        <div className="pb-2 border-b border-border/40">
          <InlineLegend items={sharedLegendItems} size="sm" />
        </div>
      )}

      {/* Bars List */}
      <div className={cn(compact ? "space-y-4" : "space-y-8")}>
        {items.length > 0 ? (
          items.map((item) => (
            <ResponseStackedBar
              key={item.id}
              segments={item.segments}
              label={item.label}
              value={item.value}
              description={item.description}
              total={item.total}
              delta={item.delta}
              deltaLabel={item.deltaLabel}
              deltaTone={item.deltaTone}
              showPercentages={showPercentages}
              size={compact ? "sm" : size}
              isBase={item.isBase}
              emptyMessage={item.emptyMessage}
              showLegend={showIndividualLegends} // Enabled per bar if requested
            />
          ))
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-border/40 rounded-lg text-sm text-muted-foreground italic">
            No hay datos comparativos disponibles
          </div>
        )}
      </div>
    </div>
  )
}
