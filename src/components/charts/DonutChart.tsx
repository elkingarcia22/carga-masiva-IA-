import * as React from "react"
import { ChartCard } from "./ChartCard"
import type { EChartsOption, EChartsInstance } from "./types"

export interface DonutChartData {
  /** Category label */
  label: string
  /** Numeric value */
  value: number
}

export interface DonutChartProps {
  /** Chart title — required for accessible header */
  title: string
  /** Optional subtitle */
  description?: string
  /** Data array: { label, value } */
  data: DonutChartData[]
  /** Series name for the chart */
  seriesName?: string
  /** Chart height in px or CSS string. Defaults to 300. */
  height?: number | string
  /** Variant: donut or pie. Defaults to donut. */
  variant?: "donut" | "pie"
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
 * DonutChart
 *
 * Preset for Apache ECharts pie/donut visualizations.
 * Used for composition analysis (part-to-whole relationships).
 *
 * Renders a pie or donut series with sobria styling.
 * Uses ChartCard for structural layout (header, meta, actions, filters).
 * Delegates ECharts rendering to the ChartCard → ChartShell → EChart pipeline.
 *
 * Note: Pie charts work best with 2-8 categories. For 9+ categories,
 * consider a different visualization (e.g., horizontal bar chart).
 *
 * @example
 * <DonutChart
 *   title="Distribución de Componentes"
 *   data={[
 *     { label: "Categoría A", value: 300 },
 *     { label: "Categoría B", value: 200 },
 *     { label: "Categoría C", value: 150 },
 *   ]}
 *   seriesName="Componentes"
 *   variant="donut"
 *   height={300}
 * />
 */
export function DonutChart({
  title,
  description,
  data,
  seriesName = "Value",
  height = 300,
  variant = "donut",
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
}: DonutChartProps) {
  // Build ECharts option
  const option: EChartsOption = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {}
    }

    const pieData = data.map((d) => ({
      name: d.label,
      value: d.value,
    }))

    const radius = variant === "donut" ? ["40%", "70%"] : ["0%", "70%"]

    return {
      tooltip: {
        trigger: "item",
      },
      legend: {
        orient: "vertical",
        left: "left",
      },
      series: [
        {
          name: seriesName,
          type: "pie",
          radius: radius,
          data: pieData,
          label: {
            show: true,
            formatter: "{b}",
            fontSize: 13,
            fontWeight: 400,
            color: "inherit",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.1)",
            },
          },
        },
      ],
    }
  }, [data, seriesName, variant])

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
