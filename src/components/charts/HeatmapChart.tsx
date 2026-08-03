import * as React from "react"
import { ChartCard } from "./ChartCard"
import type { EChartsOption, EChartsInstance } from "./types"

export interface HeatmapDatum {
  /** X-axis label */
  x: string
  /** Y-axis label */
  y: string
  /** Numeric value for intensity */
  value: number
}

export interface HeatmapChartProps {
  /** Chart title — required for accessible header */
  title: string
  /** Optional subtitle */
  description?: string
  /** X-axis labels */
  xLabels: string[]
  /** Y-axis labels */
  yLabels: string[]
  /** Data array: { x, y, value } */
  data: HeatmapDatum[]
  /** Series name for the chart */
  seriesName?: string
  /** Minimum value for the scale. Auto-detected if omitted. */
  min?: number
  /** Maximum value for the scale. Auto-detected if omitted. */
  max?: number
  /** Chart height in px or CSS string. Defaults to 300. */
  height?: number | string
  /** Loading state */
  loading?: boolean
  /** Empty state */
  empty?: boolean
  /** Error message string */
  error?: string | null
  /** Accessible label for the chart region */
  ariaLabel?: string
  /** Screen-reader-only data summary */
  summary?: React.ReactNode
  /** Right-aligned header actions */
  actions?: React.ReactNode
  /** Filter controls slot */
  filters?: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
  /** Optional CSS classes */
  className?: string
  /** Callback when chart instance is ready */
  onChartReady?: (instance: EChartsInstance) => void
}

/**
 * HeatmapChart
 *
 * Preset for Apache ECharts heatmap visualizations.
 * Used for density analysis, pattern detection, and two-dimensional correlations.
 *
 * Renders a heatmap with discrete color scale (5 intensity levels).
 * Uses ChartCard for structural layout (header, meta, actions, filters).
 * Delegates ECharts rendering to the ChartCard → ChartShell → EChart pipeline.
 *
 * Color scale is automatically resolved from UBITS theme tokens at runtime,
 * ensuring proper light/dark mode support without hardcoded HEX values.
 *
 * @example
 * <HeatmapChart
 *   title="Actividad por Zona Horaria"
 *   xLabels={["Lunes", "Martes", "Miércoles"]}
 *   yLabels={["00:00-06:00", "06:00-12:00", "12:00-18:00", "18:00-24:00"]}
 *   data={[
 *     { x: "Lunes", y: "00:00-06:00", value: 23 },
 *     { x: "Lunes", y: "06:00-12:00", value: 45 },
 *     ...
 *   ]}
 *   min={0}
 *   max={100}
 *   height={300}
 * />
 */
export function HeatmapChart({
  title,
  description,
  xLabels,
  yLabels,
  data,
  seriesName = "Value",
  min,
  max,
  height = 300,
  loading = false,
  empty = false,
  error = null,
  ariaLabel,
  summary,
  actions,
  filters,
  footer,
  className,
  onChartReady,
}: HeatmapChartProps) {
  // Build ECharts option
  const option: EChartsOption = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {}
    }

    // Auto-detect min/max if not provided
    const values = data.map((d) => d.value)
    const calculatedMin = min ?? Math.min(...values)
    const calculatedMax = max ?? Math.max(...values)

    // Transform data to ECharts heatmap format: [x, y, value]
    const heatmapData = data.map((d) => {
      const xIndex = xLabels.indexOf(d.x)
      const yIndex = yLabels.indexOf(d.y)
      return [xIndex, yIndex, d.value]
    })

    // Resolve semantic status colors from theme for 5-level intensity scale
    // Uses dynamic getComputedStyle to avoid HEX hardcoding
    const getThemeColor = (cssVar: string): string => {
      try {
        const computed = getComputedStyle(document.documentElement)
        const value = computed.getPropertyValue(cssVar).trim()
        return value || "rgba(100, 100, 100, 0.5)"
      } catch (_) {
        return "rgba(100, 100, 100, 0.5)"
      }
    }

    const positiveColor = getThemeColor("--color-positive") // Green
    const warningColor = getThemeColor("--color-warning") // Orange/Yellow
    const negativeColor = getThemeColor("--color-negative") // Red
    const textSecondary = getThemeColor("--color-text-secondary")
    const textPrimary = getThemeColor("--color-text-primary")
    const borderColor = getThemeColor("--color-border")
    const surfaceColor = getThemeColor("--color-surface")

    // Create 5-level semantic color scale: green → yellow → orange → red
    // Uses resolved theme colors with gradient progression
    const colorScale = [
      positiveColor, // Low: Green
      warningColor, // Low-Mid: Yellow/Orange (blend via visual position)
      warningColor, // Mid: Yellow/Orange
      negativeColor, // Mid-High: Red (blend via visual position)
      negativeColor, // High: Red
    ]

    return {
      tooltip: {
        trigger: "item",
        confine: true,
        textStyle: {
          color: textPrimary,
          fontSize: 12,
        },
        backgroundColor: surfaceColor,
        borderColor: borderColor,
        borderWidth: 1,
        formatter: (params: any) => {
          if (params.value === undefined) return ""
          const [xIdx, yIdx, value] = params.value
          const xLabel = xLabels[xIdx] || ""
          const yLabel = yLabels[yIdx] || ""
          return `${xLabel} × ${yLabel}<br/>${seriesName}: <strong>${value}</strong>`
        },
      },
      grid: {
        top: 40,
        right: 100,
        bottom: 80,
        left: 100,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: xLabels,
        boundaryGap: true,
        axisLabel: {
          interval: 0,
          rotate: 0,
          color: textSecondary,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: borderColor,
          },
        },
      },
      yAxis: {
        type: "category",
        data: yLabels,
        boundaryGap: true,
        axisLabel: {
          interval: 0,
          color: textSecondary,
          fontSize: 12,
        },
        axisLine: {
          lineStyle: {
            color: borderColor,
          },
        },
      },
      visualMap: {
        min: calculatedMin,
        max: calculatedMax,
        inRange: {
          color: colorScale,
        },
        text: ["Alto", "Bajo"],
        textStyle: {
          color: textSecondary,
          fontSize: 12,
        },
        dimension: 2,
        seriesIndex: 0,
        orient: "vertical",
        right: 10,
        top: "center",
      },
      series: [
        {
          name: seriesName,
          type: "heatmap",
          data: heatmapData,
          label: {
            show: false,
          },
          itemStyle: {
            borderColor: borderColor,
            borderWidth: 0.5,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.2)",
              borderWidth: 1,
              borderColor: textPrimary,
            },
          },
        },
      ],
    }
  }, [data, xLabels, yLabels, seriesName, min, max])

  return (
    <ChartCard
      title={title}
      description={description}
      option={option}
      height={height}
      loading={loading}
      empty={empty}
      error={error}
      ariaLabel={ariaLabel ?? title}
      summary={summary}
      actions={actions}
      filters={filters}
      footer={footer}
      className={className}
      onChartReady={onChartReady}
    />
  )
}
