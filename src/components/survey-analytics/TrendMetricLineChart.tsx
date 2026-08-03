import * as React from "react"
import { ChartCard } from "../charts/ChartCard"
import { ChartShell } from "../charts/ChartShell"
import type { EChartsOption } from "../charts/types"
import type { TrendMetricLineChartProps } from "./surveyAnalyticsTypes"
import { getUbitsChartTheme } from "../charts/theme"

/**
 * TrendMetricLineChart
 * 
 * Specialized component for visualizing temporal trends of survey metrics.
 * Built on top of the ECharts infrastructure.
 */
export function TrendMetricLineChart({
  title,
  description,
  series,
  height = 300,
  showLegend = true,
  showComparison = true,
  loading = false,
  empty = false,
  error,
  actions,
  footer,
  ariaLabel,
  summary,
  variant,
  className,
  standalone = false,
  showLabels = false,
  disableHover = false,
}: TrendMetricLineChartProps & { showLabels?: boolean, disableHover?: boolean }) {

  // Build ECharts option
  const option: EChartsOption = React.useMemo(() => {
    if (!series || series.length === 0) return {}

    // Resolve theme for colors
    const theme = getUbitsChartTheme()
    const brandColor = theme.color[0] // Primary brand color from theme

    // Extract all unique labels (X axis) preserving the original order from the first series
    const labels = series.length > 0 
      ? Array.from(new Set(series[0].data.map(p => p.label)))
      : Array.from(new Set(series.flatMap(s => s.data.map(p => p.label))));

    interface EChartsSeriesOption {
      name: string
      type: "line"
      data: (number | null | any)[]
      smooth: boolean
      symbol: string
      symbolSize: number
      showSymbol?: boolean
      label?: any
      lineStyle?: {
        width: number
        type?: "solid" | "dashed" | "dotted"
        opacity?: number
      }
      areaStyle?: {
        opacity: number
        color?: any
      }
      itemStyle?: {
        opacity: number
      }
    }

    const isSparkline = variant === 'sparkline'
    const echartsSeries: EChartsSeriesOption[] = []

    series.forEach(s => {
      // Main series
      const dataValues = labels.map(label => {
        const point = s.data.find(p => p.label === label)
        if (!point) return null
        return {
          value: point.value ?? 0,
          total: point.total,
          label: point.label,
          noData: point.value === null || point.value === undefined
        }
      })

      echartsSeries.push({
        name: s.label,
        type: "line",
        data: dataValues as any,
        smooth: true,
        symbol: "circle",
        symbolSize: isSparkline ? 0 : 8, // Slightly larger for PDF visibility
        showSymbol: true, // Always show symbols if not sparkline
        label: showLabels ? {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const val = params.data.value;
            return s.label.toLowerCase().includes('nps') ? val : `${val}%`;
          },
          fontSize: 10,
          fontWeight: 'bold',
          color: '#1e293b'
        } : undefined,
        lineStyle: {
          width: isSparkline ? 2 : 3,
        },
        areaStyle: {
          opacity: isSparkline ? 0.3 : 0.05,
          color: isSparkline ? {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: brandColor + '66' }, // ~40% opacity
              { offset: 1, color: brandColor + '00' }  // 0% opacity
            ]
          } : undefined
        },
      })

      // Comparison series (if enabled and data exists)
      if (showComparison && !isSparkline) { // Disable comparison in sparkline
        const comparisonValues = labels.map(label => {
          const point = s.data.find(p => p.label === label)
          return point && point.comparisonValue !== undefined ? point.comparisonValue : null
        })

        // Only add if there's at least one comparison value
        if (comparisonValues.some(v => v !== null)) {
          echartsSeries.push({
            name: `${s.label} (Comparativo)`,
            type: "line",
            data: comparisonValues,
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: {
              width: 2,
              type: "dashed",
              opacity: 0.5,
            },
            itemStyle: {
              opacity: 0.5,
            },
            areaStyle: {
              opacity: 0,
            }
          })
        }
      }
    })

    return {
      legend: {
        show: !isSparkline && showLegend,
        bottom: 0,
        icon: "circle",
      },
      grid: {
        top: isSparkline ? 5 : (showLabels ? 30 : (standalone ? 5 : (title ? 60 : 15))),
        bottom: isSparkline ? 5 : (showLegend ? 40 : (standalone ? 25 : 25)),
        left: isSparkline ? 0 : (standalone ? 15 : 40),
        right: isSparkline ? 0 : (standalone ? 5 : 20), // More space for labels
        containLabel: !isSparkline,
      },
      xAxis: {
        show: !isSparkline,
        type: "category",
        data: labels,
        boundaryGap: true, // Better for point labels
      },
      yAxis: {
        show: !isSparkline,
        type: "value",
        splitLine: {
          show: !isSparkline,
          lineStyle: {
            type: "dashed",
          },
        },
      },
      series: echartsSeries,
      tooltip: {
        show: !isSparkline && !disableHover,
        trigger: "axis",
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1,
        padding: [0, 0],
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10,
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';

          let html = `<div style="padding: 12px; min-width: 160px; border-radius: 8px;">`;
          html += `<div style="font-size: 10px; font-weight: 700; color: rgba(0,0,0,0.4); margin-bottom: 8px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 4px;">${params[0].axisValue}</div>`;

          params.forEach((param: any) => {
            const data = param.data;
            const isObject = data && typeof data === 'object';
            const val = isObject ? data.value : data;
            const total = isObject ? data.total : undefined;
            const noData = isObject ? data.noData : false;
            const color = param.color;
            const seriesName = param.seriesName;

            if (noData) {
              html += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; opacity: 0.3;"></div>
                    <span style="font-size: 12px; color: #374151; font-weight: 500;">${seriesName}</span>
                  </div>
                  <span style="font-size: 11px; font-weight: 500; color: #9CA3AF; font-style: italic;">Sin respuestas</span>
                </div>
              `;
            } else {
              html += `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; last-child: margin-bottom: 0;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></div>
                    <span style="font-size: 12px; color: #374151; font-weight: 500;">${seriesName}</span>
                  </div>
                  <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <span style="font-size: 12px; font-weight: 700; color: #111827;">${val}${seriesName.toLowerCase().includes('nps') ? '' : '%'}</span>
                    ${total !== undefined ? `<span style="font-size: 10px; color: #6B7280;">${total} respuestas</span>` : ''}
                  </div>
                </div>
              `;
            }
          });

          html += `</div>`;
          return html;
        }
      }
    }
  }, [series, showLegend, showComparison, title, variant, standalone, showLabels, disableHover]);


  if (standalone) {
    return (
      <ChartShell
        option={option}
        height={height}
        loading={loading}
        empty={empty || series.length === 0}
        error={error}
        ariaLabel={ariaLabel ?? title}
        summary={summary}
        footer={footer}
        className={className}
      />
    )
  }

  return (
    <ChartCard
      title={title ?? ""}
      description={description}
      option={option}
      height={height}
      loading={loading}
      empty={empty || series.length === 0}
      error={error}
      ariaLabel={ariaLabel ?? title}
      summary={summary}
      actions={actions}
      footer={footer}
      className={className}
    />
  )
}
