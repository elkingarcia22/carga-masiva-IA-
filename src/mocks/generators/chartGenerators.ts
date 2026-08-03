/**
 * Chart Data Generators
 * Factory functions for generating data for ECharts visualizations
 */

import type { ChartDataPoint, TimeSeriesData, HeatmapCell } from '../types';

/**
 * Generate time series data for line/area charts
 */
export function generateTimeSeriesData(monthCount: number = 12): ChartDataPoint[] {
  const now = new Date();
  const data: ChartDataPoint[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    const baseValue = 100 + Math.random() * 200;
    const trend = Math.sin((monthCount - i) / 3) * 50; // Smooth oscillation

    data.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.floor(baseValue + trend),
      timestamp: date.getTime(),
    });
  }

  return data;
}

/**
 * Generate bar chart data with categories
 */
export function generateBarChartData(
  categories: string[] = ['Q1', 'Q2', 'Q3', 'Q4'],
  valueRange: [number, number] = [100, 500],
): ChartDataPoint[] {
  return categories.map((category) => ({
    label: category,
    value: Math.floor(Math.random() * (valueRange[1] - valueRange[0])) + valueRange[0],
  }));
}

/**
 * Generate distribution/pie chart data
 */
export function generateDistributionData(
  segments: string[] = ['A', 'B', 'C', 'D', 'E'],
): ChartDataPoint[] {
  const values = segments.map(() => Math.floor(Math.random() * 1000) + 100);
  const total = values.reduce((a, b) => a + b, 0);

  return segments.map((segment, idx) => ({
    label: segment,
    value: Math.round(((values[idx] / total) * 100 + Number.EPSILON) * 100) / 100,
  }));
}

/**
 * Generate heatmap data
 */
export function generateHeatmapData(
  rows: number = 10,
  columns: number = 24,
): HeatmapCell[] {
  const data: HeatmapCell[] = [];
  const rowLabels = Array.from({ length: rows }, (_, i) => `Category ${i + 1}`);
  const colLabels = Array.from({ length: columns }, (_, i) => `${i}:00`);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const value = Math.floor(Math.random() * 100);

      data.push({
        row: rowLabels[r],
        column: colLabels[c],
        value,
        intensity: value / 100,
      });
    }
  }

  return data;
}

/**
 * Generate comparison data (two series)
 */
export function generateComparisonChartData(
  categories: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
): {
  current: ChartDataPoint[];
  previous: ChartDataPoint[];
} {
  return {
    current: categories.map((cat) => ({
      label: cat,
      value: Math.floor(Math.random() * 500) + 200,
    })),
    previous: categories.map((cat) => ({
      label: cat,
      value: Math.floor(Math.random() * 500) + 150,
    })),
  };
}

/**
 * Generate sparkline data (compact time series)
 */
export function generateSparklineData(pointCount: number = 12): ChartDataPoint[] {
  const now = Date.now();
  return Array.from({ length: pointCount }, (_, idx) => ({
    label: `${idx}`,
    value: Math.floor(Math.random() * 100) + 50,
    timestamp: now - (pointCount - idx - 1) * 86400000, // Daily intervals
  }));
}

/**
 * Generate stacked bar data (for segmented distributions)
 */
export function generateStackedBarData(
  categories: string[] = ['Jan', 'Feb', 'Mar', 'Apr'],
  stackNames: string[] = ['Positive', 'Neutral', 'Negative'],
): Record<string, ChartDataPoint[]> {
  const result: Record<string, ChartDataPoint[]> = {};

  for (const stackName of stackNames) {
    result[stackName] = categories.map((cat) => ({
      label: cat,
      value: Math.floor(Math.random() * 300) + 50,
    }));
  }

  return result;
}

/**
 * Generate time series with multiple series (for dashboard comparison)
 */
export function generateMultiSeriesTimeSeries(
  seriesNames: string[] = ['Series A', 'Series B'],
  monthCount: number = 6,
): Record<string, TimeSeriesData> {
  return seriesNames.reduce((acc, name, idx) => {
    const baseOffset = idx * 100;
    acc[name] = {
      id: `series-${idx}`,
      label: name,
      data: Array.from({ length: monthCount }, (_, m) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (monthCount - m - 1));

        return {
          label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: Math.floor(Math.random() * 200) + 100 + baseOffset,
          timestamp: date.getTime(),
        };
      }),
    };
    return acc;
  }, {} as Record<string, TimeSeriesData>);
}

/**
 * Generate funnel data (declining values)
 */
export function generateFunnelData(
  stages: string[] = ['Awareness', 'Consideration', 'Decision', 'Purchase'],
): ChartDataPoint[] {
  let value = 1000;
  return stages.map((stage) => {
    const currentValue = Math.floor(value * (0.6 + Math.random() * 0.3)); // 60-90% retention
    value = currentValue;
    return {
      label: stage,
      value: currentValue,
    };
  });
}

/**
 * Generate scatter plot data
 */
export function generateScatterData(
  pointCount: number = 50,
): ChartDataPoint[] {
  return Array.from({ length: pointCount }, (_, idx) => ({
    label: `Point ${idx + 1}`,
    value: Math.floor(Math.random() * 1000),
    secondaryValue: Math.floor(Math.random() * 1000), // X,Y for scatter
  }));
}

/**
 * Generate gauge data (0-100)
 */
export function generateGaugeData(): ChartDataPoint {
  return {
    label: 'Progress',
    value: Math.floor(Math.random() * 100),
  };
}
