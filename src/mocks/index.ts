/**
 * Mock Data Layer - Central Export
 * Dashboard-level query functions providing API-like interface
 */

import { generateSurveyDashboardData, generateParticipationTrend, generateMetricsByCategory } from './generators/surveyGenerators';
import { generateTimeSeriesData, generateBarChartData, generateDistributionData } from './generators/chartGenerators';
import { applyFiltersToDashboard, applyFiltersToMetrics, addLatencySimulation } from './transformers/filterAppliers';

import type { DashboardData, MetricData, ResponseSegment, TimeSeriesData, FilterCriteria, MockApiResponse } from './types';

/**
 * Get complete survey dashboard data with applied filters
 * @param filters Optional filter criteria (date range, segment, etc.)
 * @returns Complete dashboard data with all sections
 */
export async function getMockSurveyDashboardData(filters?: FilterCriteria): Promise<DashboardData> {
  const data = generateSurveyDashboardData(filters);
  const filtered = applyFiltersToDashboard(data, filters || {});
  await addLatencySimulation(filtered, 300); // Simulate network latency
  return filtered;
}

/**
 * Get response distribution data only (for Distribution Section)
 * @param filters Optional filter criteria
 * @returns Distribution data with segments
 */
export async function getMockResponseDistribution(
  filters?: FilterCriteria,
): Promise<MockApiResponse<{ segments: ResponseSegment[]; total: number }>> {
  const data = generateSurveyDashboardData(filters);
  const distribution = {
    segments: data.distribution.segments,
    total: data.distribution.total,
  };
  await addLatencySimulation(distribution, 200);
  return {
    success: true,
    data: distribution,
    metadata: {
      total: distribution.segments.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get trend/time series data only (for Timeline Section)
 * @param filters Optional filter criteria
 * @param months Number of months to retrieve
 * @returns Time series data with trend
 */
export async function getMockTrendData(_filters?: FilterCriteria, months: number = 12): Promise<MockApiResponse<TimeSeriesData>> {
  const trend = generateParticipationTrend(months);
  await addLatencySimulation(trend, 250);
  return {
    success: true,
    data: trend,
    metadata: {
      total: trend.data.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get metrics only (for Metric Section)
 * @param filters Optional filter criteria
 * @returns Array of metrics
 */
export async function getMockMetricsOnly(filters?: FilterCriteria): Promise<MockApiResponse<MetricData[]>> {
  const data = generateSurveyDashboardData(filters);
  const metrics = applyFiltersToMetrics(data.metrics, filters || {});
  await addLatencySimulation(metrics, 200);
  return {
    success: true,
    data: metrics,
    metadata: {
      total: metrics.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get metrics by category (regional breakdown)
 * @param categories Array of category names
 * @param filters Optional filter criteria
 * @returns Metrics grouped by category
 */
export async function getMockMetricsByCategory(
  categories: string[],
  _filters?: FilterCriteria,
): Promise<MockApiResponse<Record<string, MetricData[]>>> {
  const data = generateMetricsByCategory(categories, 2);
  await addLatencySimulation(data, 250);
  return {
    success: true,
    data,
    metadata: {
      total: Object.values(data).flat().length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get comparison data (current vs previous period)
 * @param filters Optional filter criteria
 * @returns Dashboard data with comparison metrics
 */
export async function getMockComparisonData(filters?: FilterCriteria): Promise<MockApiResponse<DashboardData>> {
  const currentData = generateSurveyDashboardData(filters);
  const comparison: DashboardData = {
    ...currentData,
    metrics: currentData.metrics.map((m) => ({
      ...m,
      previousValue: m.value - Math.floor(Math.random() * 20),
      delta: Math.floor(Math.random() * 40) - 20,
    })),
  };
  await addLatencySimulation(comparison, 300);
  return {
    success: true,
    data: comparison,
    metadata: {
      total: comparison.metrics.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get chart data for bar chart
 * @param categories Optional category names
 * @returns Bar chart data
 */
export async function getMockBarChartData(categories?: string[]): Promise<MockApiResponse<unknown[]>> {
  const data = generateBarChartData(categories || ['Q1', 'Q2', 'Q3', 'Q4']);
  await addLatencySimulation(data, 200);
  return {
    success: true,
    data,
    metadata: {
      total: data.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get chart data for distribution/donut chart
 * @param segments Optional segment names
 * @returns Distribution data
 */
export async function getMockDistributionChartData(segments?: string[]): Promise<MockApiResponse<unknown[]>> {
  const data = generateDistributionData(segments || ['A', 'B', 'C', 'D', 'E']);
  await addLatencySimulation(data, 200);
  return {
    success: true,
    data,
    metadata: {
      total: data.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get time series chart data
 * @param monthCount Number of months
 * @returns Time series data
 */
export async function getMockTimeSeriesChartData(monthCount: number = 12): Promise<MockApiResponse<unknown[]>> {
  const data = generateTimeSeriesData(monthCount);
  await addLatencySimulation(data, 250);
  return {
    success: true,
    data,
    metadata: {
      total: data.length,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Simulate error scenario (for error state testing)
 * @param errorMessage Custom error message
 * @returns Error response
 */
export async function getMockErrorResponse(
  errorMessage: string = 'Failed to fetch data',
): Promise<MockApiResponse<null>> {
  await addLatencySimulation(null, 100);
  return {
    success: false,
    data: null,
    error: {
      code: 'MOCK_ERROR',
      message: errorMessage,
    },
  };
}

/**
 * Simulate empty state
 * @returns Empty dashboard data
 */
export async function getMockEmptyDashboardData(): Promise<DashboardData> {
  await addLatencySimulation(null, 200);
  return {
    metrics: [],
    distribution: {
      label: 'Response Distribution',
      segments: [],
      total: 0,
    },
    timeSeries: [],
    metadata: {
      lastUpdated: new Date(),
      source: 'mock',
    },
  };
}

/**
 * Export type for use in components
 */
export type { DashboardData, MetricData, ResponseSegment, TimeSeriesData, FilterCriteria, MockApiResponse };

/**
 * Export generators for advanced use cases
 */
export * from './generators/surveyGenerators';
export * from './generators/chartGenerators';

/**
 * Export transformers for data manipulation
 */
export * from './transformers/filterAppliers';

/**
 * Export types
 */
export * from './types';

/**
 * Export comparative mocks
 */
export * from './comparativeMocks';

/**
 * Export heatmap dimensions mocks
 */
export * from './heatmapDimensions';
