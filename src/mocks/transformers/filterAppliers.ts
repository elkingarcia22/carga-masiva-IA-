/**
 * Mock Data Transformers & Filter Appliers
 * Simulates API filtering, pagination, and transformation behavior
 */

import type { MetricData, ResponseSegment, DashboardData, FilterCriteria, MockApiResponse } from '../types';

/**
 * Apply date range filter to metrics
 */
export function applyDateRangeFilter<T extends { id: string }>(data: T[], filters: FilterCriteria): T[] {
  if (!filters.dateRange) return data;

  // Simulate filtering by checking if timestamp falls within range
  return data.filter((_item) => {
    // For mock data without explicit timestamps, accept all
    // In real scenario, would check item.timestamp
    return true;
  });
}

/**
 * Apply segment/category filter to data
 */
export function applySegmentFilter(segments: ResponseSegment[], segment?: string): ResponseSegment[] {
  if (!segment || segment === 'all') return segments;

  // Filter to single segment or related segments
  return segments.filter((s) => s.id === segment || s.label.toLowerCase().includes(segment.toLowerCase()));
}

/**
 * Apply sorting to metrics
 */
export function applySortToMetrics(
  metrics: MetricData[],
  sortBy: string = 'value',
  sortOrder: 'asc' | 'desc' = 'desc',
): MetricData[] {
  const sorted = [...metrics].sort((a, b) => {
    const aRaw: unknown = a[sortBy as keyof MetricData];
    const bRaw: unknown = b[sortBy as keyof MetricData];

    let aVal: string | number | boolean = aRaw as string | number | boolean;
    let bVal: string | number | boolean = bRaw as string | number | boolean;

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Apply pagination to data array
 */
export function applyPagination<T>(data: T[], limit: number = 10, offset: number = 0): T[] {
  return data.slice(offset, offset + limit);
}

/**
 * Apply search/text filter to metrics
 */
export function applySearchFilter(metrics: MetricData[], searchQuery?: string): MetricData[] {
  if (!searchQuery) return metrics;

  const query = searchQuery.toLowerCase();
  return metrics.filter((m) => m.label.toLowerCase().includes(query) || m.description?.toLowerCase().includes(query));
}

/**
 * Apply multiple filters to dashboard data
 */
export function applyFiltersToMetrics(data: MetricData[], filters: FilterCriteria): MetricData[] {
  let filtered = [...data];

  // Apply date range
  filtered = applyDateRangeFilter(filtered, filters);

  // Apply search
  if (filters.search) {
    filtered = applySearchFilter(filtered, filters.search);
  }

  // Apply sorting
  filtered = applySortToMetrics(filtered, filters.sortBy, filters.sortOrder);

  // Apply pagination
  filtered = applyPagination(filtered, filters.limit, filters.offset);

  return filtered;
}

/**
 * Apply filters to dashboard data object
 */
export function applyFiltersToDashboard(data: DashboardData, filters: FilterCriteria): DashboardData {
  return {
    ...data,
    metrics: applyFiltersToMetrics(data.metrics, filters),
    distribution: {
      ...data.distribution,
      segments: filters.segment ? applySegmentFilter(data.distribution.segments, filters.segment) : data.distribution.segments,
    },
  };
}

/**
 * Transform API response to mock response envelope
 */
export function transformApiResponse<T>(data: T, success: boolean = true, error?: { code: string; message: string }): MockApiResponse<T> {
  return {
    success,
    data: success ? data : null,
    error,
    metadata: {
      total: Array.isArray(data) ? (data as unknown[]).length : 1,
      page: 1,
      limit: 100,
      timestamp: Date.now(),
    },
  };
}

/**
 * Simulate API error with random chance
 */
export function applyErrorSimulator<T>(data: T, errorChance: number = 0): MockApiResponse<T> {
  const shouldError = Math.random() < errorChance;

  if (shouldError) {
    return {
      success: false,
      data: null,
      error: {
        code: 'MOCK_ERROR',
        message: 'Simulated API error (mock error simulator)',
      },
    };
  }

  return transformApiResponse(data, true);
}

/**
 * Add artificial delay to simulate network latency
 */
export async function addLatencySimulation<T>(data: T, delayMs: number = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}

/**
 * Denormalize/flatten nested API response
 */
export function flattenApiResponse<T extends Record<string, unknown>>(data: T, key?: keyof T): unknown[] {
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data[key])) return data[key] as unknown[];
  return Object.values(data);
}

/**
 * Filter metrics by value range
 */
export function filterMetricsByValueRange(metrics: MetricData[], min: number = 0, max: number = 100): MetricData[] {
  return metrics.filter((m) => m.value >= min && m.value <= max);
}

/**
 * Filter segments by percentage threshold
 */
export function filterSegmentsByPercentage(segments: ResponseSegment[], minPercentage: number = 5): ResponseSegment[] {
  return segments.filter((s) => s.percentage >= minPercentage);
}

/**
 * Group metrics by semantic intent (positive/negative/neutral)
 */
export function groupMetricsByIntent(
  metrics: MetricData[],
): { positive: MetricData[]; negative: MetricData[]; neutral: MetricData[] } {
  return {
    positive: metrics.filter((m) => m.trend === 'up'),
    negative: metrics.filter((m) => m.trend === 'down'),
    neutral: metrics.filter((m) => m.trend === 'neutral'),
  };
}

/**
 * Transform metrics for export (CSV-friendly format)
 */
export function transformMetricsForExport(
  metrics: MetricData[],
): Record<string, string | number>[] {
  return metrics.map((m) => ({
    ID: m.id,
    Label: m.label,
    Value: m.value,
    Previous: m.previousValue,
    Delta: m.delta,
    'Delta %': m.deltaPercentage,
    Trend: m.trend,
    Unit: m.unit || '-',
  }));
}

/**
 * Aggregate segments into summary
 */
export function aggregateSegments(
  segments: ResponseSegment[],
): { total: number; weighted: number; dominantSegment: ResponseSegment | null } {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const weighted = segments.reduce((sum, s) => sum + s.value * s.percentage, 0);
  const dominantSegment = segments.reduce((max, s) => (s.value > max.value ? s : max), segments[0] || null);

  return { total, weighted, dominantSegment };
}
