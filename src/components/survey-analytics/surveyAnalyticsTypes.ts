export type DeltaTone = "positive" | "negative" | "neutral"
export type DeltaDirection = "up" | "down" | "flat"

export interface ComparisonItem {
  /** Label for the comparison (e.g. "VS Q1") */
  label: string
  /** The value being compared */
  value: string | number
  /** Optional delta value */
  delta?: number
  /** Optional custom delta label (e.g. "+5%") */
  deltaLabel?: string
  /** Tone of the comparison */
  tone?: DeltaTone
}

export type LegendTone = "primary" | "positive" | "negative" | "warning" | "neutral" | "info"

export interface LegendItem {
  /** Label for the legend item */
  label: string
  /** Optional value to display */
  value?: string | number
  /** Tone for the visual indicator */
  tone?: LegendTone
  /** Optional secondary description */
  description?: string
}

export interface DeltaPillProps {
  /** Numeric value for the delta */
  value?: number
  /** Custom label to display instead of value */
  label?: string
  /** Explicit direction icon */
  direction?: DeltaDirection
  /** Tone of the pill */
  tone?: DeltaTone
  /** Whether to show the direction icon (default: true) */
  showIcon?: boolean
  /** Size of the pill */
  size?: "xs" | "sm" | "md"
  /** Additional CSS classes */
  className?: string
}

export interface InlineLegendProps {
  /** Items to display in the legend */
  items: LegendItem[]
  /** Layout orientation */
  orientation?: "horizontal" | "vertical"
  /** Visual size */
  size?: "sm" | "md"
  /** Additional CSS classes */
  className?: string
}

export interface MetricComparisonFooterProps {
  /** Comparison items to display */
  items: ComparisonItem[]
  /** Grid columns for distribution */
  columns?: 2 | 3 | 4
  /** Additional CSS classes */
  className?: string
}

export interface ResponseSegment {
  /** Unique identifier for the segment */
  id: string
  /** Label for the segment (e.g. "Satisfied") */
  label: string
  /** Raw numeric value (count) */
  value: number
  /** Calculated or explicit percentage (0-100) */
  percentage?: number
  /** Tone for color mapping */
  tone?: LegendTone
  /** Optional description for tooltips or detailed legends */
  description?: string
}

export interface ResponseStackedBarItem {
  /** Unique identifier for the bar/question */
  id: string
  /** Label for the bar (e.g. "How satisfied are you?") */
  label: string
  /** The primary metric value to display (e.g. favorability %) */
  value?: string | number
  /** Segments distribution */
  segments: ResponseSegment[]
  /** Total count (optional, can be calculated) */
  total?: number
  /** Optional delta value for comparison */
  delta?: number
  /** Custom label for the delta (e.g. "+5%") */
  deltaLabel?: string
  /** Tone for the delta pill */
  deltaTone?: DeltaTone
  /** Secondary description */
  description?: string
  /** Additional metadata (e.g. "N=450") */
  metadata?: string
  /** Whether this is the base item for comparison */
  isBase?: boolean
  /** Custom message to show when there are no responses */
  emptyMessage?: string
}

export interface ResponseStackedBarProps {
  /** Segments to display in the bar */
  segments?: ResponseSegment[]
  /** Alternative format for distribution (convenience) */
  distribution?: { label: string; value: number; color?: string; tone?: LegendTone }[]
  /** Main label for the bar */
  label?: string
  /** The primary metric value to display (e.g. favorability %) */
  value?: string | number
  /** Secondary description */
  description?: string
  /** Total count (used to calculate percentages if not provided) */
  total?: number
  /** Optional delta value for comparison */
  delta?: number
  /** Custom label for the delta (e.g. "+5%") */
  deltaLabel?: string
  /** Tone for the delta pill */
  deltaTone?: DeltaTone
  /** Whether to show segment labels inside or near the bar */
  showLabels?: boolean
  /** Whether to show percentage values */
  showPercentages?: boolean
  /** Whether to render a legend for this bar */
  showLegend?: boolean
  /** Visual height/thickness of the bar */
  size?: "sm" | "md"
  /** Whether this is the base item for comparison */
  isBase?: boolean
  /** Custom message to show when there are no responses */
  emptyMessage?: string
  /** Additional CSS classes */
  className?: string
}


export interface ResponseStackedBarGroupProps {
  /** Items (bars) to display in the group */
  items: ResponseStackedBarItem[]
  /** Title for the group */
  title?: string
  /** Description for the group */
  description?: string
  /** Whether to show a shared legend for the entire group */
  showLegend?: boolean
  /** Whether to show percentages on all bars */
  showPercentages?: boolean
  /** Visual size for all bars */
  size?: "sm" | "md"
  /** Additional CSS classes */
  className?: string
  /** Whether to render without the outer Card component */
  standalone?: boolean
  /** Whether to hide the group header (title/description) */
  hideHeader?: boolean
  /** Whether to use tighter spacing between bars */
  compact?: boolean
}

export interface TrendMetricPoint {
  /** Temporal label (e.g. "Q1", "Ene") */
  label: string
  /** Main value for the point */
  value: number
  /** Optional comparison value for the same point */
  comparisonValue?: number
  /** Metadata/tooltip details */
  metadata?: string
  /** Total responses for this point */
  total?: number
}

export interface TrendMetricSeries {
  /** Unique identifier for the series */
  id: string
  /** Label for the series (e.g. "Satisfacción") */
  label: string
  /** Data points for the trend */
  data: TrendMetricPoint[]
  /** Visual tone for the line */
  tone?: LegendTone
}

export interface TrendMetricLineChartProps {
  /** Main title for the chart area */
  title?: string
  /** Secondary description */
  description?: string
  /** Trend series to display */
  series: TrendMetricSeries[]
  /** Visual height in pixels */
  height?: number
  /** Whether to show the legend */
  showLegend?: boolean
  /** Whether to show comparison markers/lines if available */
  showComparison?: boolean
  /** Loading state */
  loading?: boolean
  /** Empty state override */
  empty?: boolean
  /** Error message */
  error?: string
  /** Custom actions in header */
  actions?: React.ReactNode
  /** Custom footer content */
  footer?: React.ReactNode
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Fallback summary for screen readers */
  summary?: string
  /** Visualization variant */
  variant?: 'standard' | 'sparkline'
  /** Additional CSS classes */
  className?: string
  /** Whether to render without the outer Card component */
  standalone?: boolean
}

export interface SurveyMetricCardProps {
  /** Title for the card */
  title?: string
  /** Secondary description */
  description?: string
  /** Main numeric or text value */
  value: string | number
  /** Subtitle or unit for the value */
  subtitle?: string
  /** Optional delta value for comparison */
  delta?: number
  /** Custom label for the delta (e.g. "+5%") */
  deltaLabel?: string
  /** Tone for the delta pill */
  deltaTone?: DeltaTone
  /** Explicit direction for the delta */
  trendDirection?: DeltaDirection
  /** Comparison items for the footer */
  comparisonItems?: ComparisonItem[]
  /** Custom actions in header */
  actions?: React.ReactNode
  /** Custom footer content */
  footer?: React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Error message */
  error?: string
  /** Additional CSS classes */
  className?: string
}

export interface FavorabilityDistributionCardProps {
  /** Title for the card */
  title?: string
  /** Secondary description */
  description?: string
  /** Response segments to display in the bar */
  segments: ResponseSegment[]
  /** Total count for percentage calculation */
  total?: number
  /** Whether to show the legend (InlineLegend) */
  showLegend?: boolean
  /** Whether to show the comparison footer */
  showComparisonFooter?: boolean
  /** Comparison items for the footer */
  comparisonItems?: ComparisonItem[]
  /** Custom actions in header */
  actions?: React.ReactNode
  /** Custom footer content */
  footer?: React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Empty state */
  empty?: boolean
  /** Error message */
  error?: string
  /** Additional CSS classes */
  className?: string
}

export interface ParticipationTrendCardProps {
  /** Title for the card */
  title?: string
  /** Secondary description */
  description?: string
  /** Trend series for the chart */
  series: TrendMetricSeries[]
  /** Optional main value to highlight (KpiCard style) */
  value?: string | number
  /** Subtitle for the highlighted value */
  subtitle?: string
  /** Optional delta for the highlighted value */
  delta?: number
  /** Custom label for the delta */
  deltaLabel?: string
  /** Tone for the delta pill */
  deltaTone?: DeltaTone
  /** Whether to show comparison markers in chart */
  showComparison?: boolean
  /** Custom actions in header */
  actions?: React.ReactNode
  /** Custom footer content */
  footer?: React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Empty state */
  empty?: boolean
  /** Error message */
  error?: string
  /** Additional CSS classes */
  className?: string
}

export type ResponseDistribution = {
  label: string
  value: number
  color: string
}
