/**
 * Survey Data Generators
 * Factory functions for generating realistic survey metrics and distributions
 */

import type {
  MetricData,
  ResponseSegment,
  DashboardData,
  ChartDataPoint,
  TimeSeriesData,
  FilterCriteria,
} from '../types';

/**
 * Generate a single metric with realistic survey KPI
 */
export function generateMetric(overrides?: Partial<MetricData>): MetricData {
  const baseValue = Math.floor(Math.random() * 100) + 40; // 40-140 range
  const previousValue = Math.floor(Math.random() * 100) + 40;
  const delta = baseValue - previousValue;

  return {
    id: `metric-${Date.now()}-${Math.random()}`,
    label: 'Survey Metric',
    value: baseValue,
    previousValue,
    delta,
    deltaPercentage: Math.round(((delta / previousValue) * 100 + Number.EPSILON) * 100) / 100,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral',
    unit: '%',
    description: 'Key performance indicator',
    ...overrides,
  };
}

/**
 * Generate response distribution segments (Likert scale: 1-5)
 */
export function generateSegments(count: number = 5): ResponseSegment[] {
  const likertLabels = ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'];
  const likertTones = ['negative', 'warning', 'neutral', 'primary', 'positive'] as const;

  const values = Array.from({ length: count }, () => Math.floor(Math.random() * 100));
  const total = values.reduce((a, b) => a + b, 0);

  return values.map((value, idx) => ({
    id: `segment-${idx}`,
    label: likertLabels[idx] || `Option ${idx + 1}`,
    value,
    percentage: total > 0 ? Math.round(((value / total) * 100 + Number.EPSILON) * 100) / 100 : 0,
    tone: likertTones[idx],
  }));
}

/**
 * Generate multiple metrics for a metric section (e.g., 4 KPIs)
 */
export function generateMetricsForSection(count: number = 4): MetricData[] {
  const labels = ['NPS', 'CSAT', 'CES', 'Effort Score'];
  return Array.from({ length: count }, (_, idx) =>
    generateMetric({
      id: `metric-${idx}`,
      label: labels[idx] || `Metric ${idx + 1}`,
      value: Math.floor(Math.random() * 50) + 50,
    }),
  );
}

/**
 * Generate time series data for trend charts (e.g., 12 months)
 */
export function generateParticipationTrend(months: number = 12): TimeSeriesData {
  const now = new Date();
  const data: ChartDataPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const timestamp = date.getTime();
    const baseValue = 400 + Math.random() * 200;
    const variance = Math.sin(i / 3) * 50; // Cyclical pattern

    data.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.floor(baseValue + variance),
      timestamp,
    });
  }

  return {
    id: 'participation-trend',
    label: 'Monthly Participation',
    data,
    unit: 'Responses',
    color: 'text-primary',
  };
}

/**
 * Generate comparison trend data (current vs. previous period)
 */
export function generateComparisonTrend(months: number = 6): TimeSeriesData {
  const currentTrend = generateParticipationTrend(months);
  const now = new Date();

  const comparisonData: ChartDataPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i - months); // Previous period
    const baseValue = 350 + Math.random() * 150;

    comparisonData.push({
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: Math.floor(baseValue),
      timestamp: date.getTime(),
    });
  }

  return {
    ...currentTrend,
    comparison: {
      label: 'Previous Period',
      data: comparisonData,
    },
  };
}

/**
 * Generate complete survey dashboard data with all sections
 */
export function generateSurveyDashboardData(filters?: FilterCriteria): DashboardData {
  const segments = generateSegments(5);
  return {
    metrics: generateMetricsForSection(4),
    distribution: {
      label: 'Response Distribution',
      segments,
      total: segments.reduce((sum, s) => sum + s.value, 0),
    },
    timeSeries: [generateParticipationTrend(12)],
    metadata: {
      lastUpdated: new Date(),
      source: 'mock',
      period: filters?.dateRange || {
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
      },
    },
  };
}

/**
 * Generate metric with semantic mapping (positive/negative intent)
 */
export function generateSemanticMetric(intent: 'positive' | 'negative' | 'neutral' = 'neutral'): MetricData {
  let value: number;
  let previousValue: number;

  switch (intent) {
    case 'positive':
      value = Math.floor(Math.random() * 20) + 80; // 80-100
      previousValue = Math.floor(Math.random() * 20) + 60; // 60-80
      break;
    case 'negative':
      value = Math.floor(Math.random() * 20) + 20; // 20-40
      previousValue = Math.floor(Math.random() * 20) + 40; // 40-60
      break;
    default:
      value = Math.floor(Math.random() * 30) + 40; // 40-70
      previousValue = Math.floor(Math.random() * 30) + 40;
  }

  return generateMetric({ value, previousValue });
}

/**
 * Generate grouped metrics by category (e.g., by region)
 */
export function generateMetricsByCategory(categories: string[], metricsPerCategory: number = 2): Record<string, MetricData[]> {
  return categories.reduce((acc, category) => {
    acc[category] = Array.from({ length: metricsPerCategory }, (_, idx) =>
      generateMetric({
        label: `${category} - Metric ${idx + 1}`,
      }),
    );
    return acc;
  }, {} as Record<string, MetricData[]>);
}
