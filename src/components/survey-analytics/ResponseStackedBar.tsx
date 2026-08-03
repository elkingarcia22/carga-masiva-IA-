import * as React from 'react'
import { cn } from '@/lib/utils'
import { InlineLegend } from './InlineLegend'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger, 
  TooltipProvider 
} from "@/components/ui/tooltip"
import { DeltaPill } from './DeltaPill'
import type { ResponseStackedBarProps, LegendTone } from './surveyAnalyticsTypes'

/**
 * ResponseStackedBar - Visual distribution of survey responses using a 100% stacked bar.
 * Uses HTML/CSS for high control and accessibility.
 * Now includes ECharts-style rich tooltips on hover.
 */
export function ResponseStackedBar({
  segments = [],
  distribution,
  label,
  value,
  description,
  total,
  delta,
  deltaLabel,
  deltaTone,
  showLabels = false,
  showPercentages = true,
  showLegend = false,
  size = "md",
  isBase = false,
  emptyMessage,
  className,
}: ResponseStackedBarProps) {
  
  // Normalize segments from either segments or distribution prop
  const normalizedSegments = React.useMemo(() => {
    if (distribution) {
      return distribution.map((d, idx) => ({
        id: `dist-${idx}`,
        label: d.label,
        value: d.value,
        tone: d.tone,
        color: d.color // We'll handle this in the style
      }))
    }
    return segments
  }, [segments, distribution])

  // Calculate total if not provided
  const resolvedTotal = total || normalizedSegments.reduce((sum, s) => sum + s.value, 0)
  
  // Prepare segments with calculated percentages
  const processedSegments = normalizedSegments.map(s => ({
    ...s,
    resolvedPercentage: s.percentage !== undefined 
      ? s.percentage 
      : (resolvedTotal > 0 ? (s.value / resolvedTotal) * 100 : 0)
  })).filter(s => s.resolvedPercentage > 0)

  const barSizeClasses = {
    sm: "h-2",
    md: "h-4",
    lg: "h-8",
  }[size]


  const toneToBg = (tone?: LegendTone) => {
    switch (tone) {
      case "primary": return "bg-primary"
      case "positive": return "bg-success"
      case "negative": return "bg-destructive"
      case "warning": return "bg-warning"
      case "info": return "bg-info"
      case "neutral": return "bg-muted-foreground/60"
      default: return "bg-muted-foreground/40"
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("space-y-3", className)}>
        {/* Header */}
        <div className="flex items-end justify-between">
          {(label || description) && (
            <div className="flex items-end gap-3">
              <div className="space-y-0.5 pb-0.5">
                {label && (
                  <div className="flex items-center gap-2">
                    <h4 className="text-[10px] font-bold leading-tight text-text-brand/80">{label}</h4>
                    {isBase && (
                      <span className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-bold rounded">BASE</span>
                    )}
                  </div>
                )}
                {description && <p className="text-[10px] text-muted-foreground font-medium">{description}</p>}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 pb-0.5">
            {processedSegments.length === 0 ? (
              <span className="text-[10px] text-muted-foreground font-medium italic">
                {emptyMessage || "Sin respuestas"}
              </span>
            ) : (
              <>
                {value !== undefined && value !== null && (
                  <span className="text-[11px] font-bold text-text-brand tabular-nums">
                    {typeof value === 'number' && showPercentages ? `${value}%` : value}
                  </span>
                )}
                {total !== undefined && total > 0 && (
                  <span className="text-[10px] font-bold text-text-muted/30">
                    n={total}
                  </span>
                )}
                {delta !== undefined && (
                  <DeltaPill 
                    value={delta} 
                    label={deltaLabel} 
                    tone={deltaTone} 
                    size="sm" 
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Bar Container */}
        <div className={cn(
          "w-full rounded-full overflow-hidden flex bg-muted/30 border border-border/40",
          barSizeClasses
        )}>
          {processedSegments.length > 0 ? (
            processedSegments.map((segment) => (
              <Tooltip key={segment.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full relative group cursor-default outline-none",
                      !segment.color && toneToBg(segment.tone)
                    )}
                    style={{ 
                      width: `${segment.resolvedPercentage}%`,
                      backgroundColor: segment.color 
                    }}
                    role="img"
                    aria-label={`${segment.label}: ${segment.percentage ?? Math.round(segment.resolvedPercentage)}%`}
                  >
                    {/* Inline label (optional) */}
                    {showLabels && segment.resolvedPercentage > 8 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground truncate px-1 pointer-events-none">
                        {showPercentages ? `${Math.round(segment.resolvedPercentage)}%` : segment.value}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="bg-background/95 text-foreground border border-border/80 shadow-md p-2.5 min-w-[140px] rounded-sm pointer-events-none z-[100]"
                >
                  <div className="flex flex-col gap-2">
                    {label && (
                      <div className="text-[11px] font-bold text-muted-foreground border-b border-border/40 pb-1.5 mb-0.5">
                        {label}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn("h-2.5 w-2.5 rounded-full ring-1 ring-black/5", !segment.color && toneToBg(segment.tone))} 
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-[12px] font-medium text-foreground/90">{segment.label}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[12px] font-bold text-foreground font-mono">
                          {showPercentages ? `${Math.round(segment.resolvedPercentage)}%` : segment.value}
                        </span>
                        {resolvedTotal > 0 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {Math.round((segment.resolvedPercentage / 100) * resolvedTotal)} respuestas
                          </span>
                        )}
                      </div>
                    </div>
                    {segment.description && (
                      <div className="text-[10px] text-muted-foreground/80 leading-snug border-t border-border/30 pt-1.5 mt-0.5 max-w-[200px]">
                        {segment.description}
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-full cursor-default" />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="bg-background/95 text-foreground border border-border/80 shadow-md p-2.5 max-w-[250px] rounded-sm pointer-events-none z-[100]"
              >
                <div className="text-[12px] font-medium text-foreground/90 leading-snug">
                  {emptyMessage ? (
                    emptyMessage === "Sin Dimensión" 
                      ? "Esta dimensión no fue evaluada en esta encuesta, por lo que no existen datos."
                      : "Esta encuesta no tiene respuestas por los filtros que está aplicando"
                  ) : "Esta encuesta no tiene respuestas por los filtros que está aplicando"}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Legend */}
        {showLegend && processedSegments.length > 0 && (
          <InlineLegend 
            size="sm"
            items={processedSegments.map(s => ({
              label: s.label,
              value: showPercentages ? `${Math.round(s.resolvedPercentage)}%` : s.value,
              tone: s.tone,
              description: s.description
            }))}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
