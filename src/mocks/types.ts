/**
 * Mock Data Layer Types
 * Aligned with component props and UBITS design system
 */

/**
 * Core metric data shape for KPI cards
 */
export interface MetricData {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  delta: number;
  deltaPercentage: number;
  trend: 'up' | 'down' | 'neutral';
  unit?: string;
  description?: string;
}

/**
 * Response segment for stacked bar distribution
 */
export interface ResponseSegment {
  id: string;
  label: string;
  value: number;
  percentage: number;
  tone?: 'positive' | 'neutral' | 'negative' | 'warning' | 'primary' | 'info';
}

/**
 * Single data point for charts (bar, line, area)
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number; // For comparison charts
  category?: string;
  timestamp?: number;
}

/**
 * Time series data for trend charts
 */
export interface TimeSeriesData {
  id: string;
  label: string;
  data: ChartDataPoint[];
  unit?: string;
  color?: string;
  comparison?: {
    label: string;
    data: ChartDataPoint[];
  };
}

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
  intensity: number; // 0-1 for color scaling
}

/**
 * Complete dashboard-level data structure
 */
export interface DashboardData {
  metrics: MetricData[];
  distribution: {
    label: string;
    segments: ResponseSegment[];
    total: number;
  };
  timeSeries: TimeSeriesData[];
  heatmapData?: HeatmapCell[];
  metadata: {
    lastUpdated: Date;
    source: string;
    period?: {
      start: Date;
      end: Date;
    };
  };
}

/**
 * Filter criteria for querying mock data
 */
export interface FilterCriteria {
  dateRange?: {
    start: Date;
    end: Date;
  };
  segment?: string;
  region?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * API-like response envelope
 */
export interface MockApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    total: number;
    page: number;
    limit: number;
    timestamp: number;
  };
}

/**
 * Survey metric card data
 */
export interface SurveyMetricCardData {
  id: string;
  title: string;
  metric: MetricData;
  comparisonMetrics?: MetricData[];
  description?: string;
  loading?: boolean;
  error?: string;
}

/**
 * Favorability distribution card data
 */
export interface FavorabilityDistributionData {
  id: string;
  title: string;
  segments: ResponseSegment[];
  total: number;
  loading?: boolean;
  error?: string;
}

/**
 * Participation trend card data
 */
export interface ParticipationTrendData {
  id: string;
  title: string;
  timeSeries: TimeSeriesData;
  currentMetric: MetricData;
  loading?: boolean;
  error?: string;
}

/**
 * Section-level data for dashboard composition
 */
export interface SectionData<T = unknown> {
  title: string;
  description?: string;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  data: T;
}

export interface SurveyListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  statusVariant: 'positive' | 'negative' | 'warning' | 'info' | 'neutral';
  startDate: string;
  endDate: string;
  participants: string;
  progress: number;
  /** Whether the survey was loaded from an external file or created inside UBITS. */
  origin: 'externa' | 'interna';
  /** Links this row to an in-progress upload task so its status/progress stay live. */
  uploadTaskId?: number;
}

/** Cadence a cycle runs on. "Personalizado" means arbitrary start/end dates. */
export type ObjectiveCyclePeriod =
  | 'Anual'
  | 'Semestre'
  | 'Trimestre'
  | 'Bimestre'
  | 'Mes'
  | 'Personalizado';

/** Lifecycle of a cycle, derived from its dates on the backend. */
export type ObjectiveCycleStatus = 'En progreso' | 'Finalizado' | 'Programado';

/** One row of the "Ciclos de objetivos" list. */
export interface ObjectiveCycleItem {
  id: string;
  name: string;
  period: ObjectiveCyclePeriod;
  /** Long-form date, e.g. "06 abril 2026". */
  startDate: string;
  endDate: string;
  status: ObjectiveCycleStatus;
  /** Objectives assigned inside the cycle — 0 means nobody has created any yet. */
  objectivesCount: number;
  /** Weighted completion. Can exceed 100 when objectives are over-achieved. */
  progress: number;
}

/** One row of the "Usuarios sin objetivos" list. */
export interface UserWithoutObjectives {
  id: string;
  username: string;
  name: string;
  email: string;
  area: string;
  /** Direct leader, absent when the user sits at the top of their branch. */
  leader?: string;
}

