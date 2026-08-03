# Mock Data Layer

**Purpose:** Provides a complete data generation and transformation layer for dashboard prototyping without requiring real APIs.

## Structure

```
src/mocks/
├── types.ts                    # TypeScript interfaces for all data shapes
├── generators/
│   ├── surveyGenerators.ts     # Survey metric and distribution generators
│   └── chartGenerators.ts      # Chart data generators (bar, line, area, heatmap, etc.)
├── transformers/
│   └── filterAppliers.ts       # Filter, sort, paginate, and transform data
├── fixtures/                   # (Future) Static test data
└── index.ts                    # Central export with dashboard query functions
```

## Core Concepts

### 1. Generators
Factory functions that create realistic mock data:

```typescript
import { generateMetricsForSection, generateParticipationTrend } from '@/mocks'

const metrics = generateMetricsForSection(4) // 4 KPI cards
const trend = generateParticipationTrend(12) // 12 months of data
```

**Available Generators:**
- `generateMetric()` — Single KPI with delta
- `generateSegments(count)` — Response distribution (Likert scale)
- `generateMetricsForSection(count)` — Multiple metrics for dashboard section
- `generateParticipationTrend(months)` — Time series data
- `generateComparisonTrend(months)` — Period-over-period comparison
- `generateBarChartData(categories)` — Bar chart data
- `generateDistributionData(segments)` — Pie/donut chart data
- `generateTimeSeriesData(monthCount)` — Line/area chart data
- `generateHeatmapData(rows, cols)` — Heatmap data

### 2. Transformers
Filter, sort, and transform data to simulate API behavior:

```typescript
import { applyFiltersToDashboard, applySearchFilter } from '@/mocks'

const filtered = applyFiltersToDashboard(data, {
  dateRange: { start, end },
  segment: 'positive',
  sortBy: 'value',
  limit: 10
})
```

**Available Transformers:**
- `applyFiltersToMetrics()` — Apply all filters to metrics array
- `applyFiltersToDashboard()` — Apply filters to complete dashboard
- `applySortToMetrics()` — Sort by field and order
- `applyPagination()` — Limit and offset
- `applySearchFilter()` — Text search
- `applySegmentFilter()` — Filter by segment/category
- `filterMetricsByValueRange()` — Filter by min/max value
- `groupMetricsByIntent()` — Group positive/negative/neutral

### 3. Central Queries
Dashboard-level functions providing API-like interface:

```typescript
import { 
  getMockSurveyDashboardData, 
  getMockResponseDistribution,
  getMockTrendData,
  getMockMetricsOnly 
} from '@/mocks'

// Get complete dashboard
const dashboard = await getMockSurveyDashboardData({
  dateRange: { start, end },
  segment: 'nps'
})

// Get single section
const distribution = await getMockResponseDistribution()
const trend = await getMockTrendData(undefined, 12)
const metrics = await getMockMetricsOnly()
```

## Usage Pattern

### In Dashboard Components

```typescript
import { getMockSurveyDashboardData } from '@/mocks'

export function SurveyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const result = await getMockSurveyDashboardData({
          dateRange: { start, end },
          segment: segment
        })
        setData(result)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [dateRange, segment])

  return (
    <DashboardShell>
      {isLoading && <Skeleton />}
      {error && <Alert variant="destructive">{error}</Alert>}
      {data && <MetricSection metrics={data.metrics} />}
    </DashboardShell>
  )
}
```

### Independent Section Queries

```typescript
// Metric Section
const metrics = await getMockMetricsOnly(filters)

// Distribution Section
const distribution = await getMockResponseDistribution(filters)

// Timeline Section
const trend = await getMockTrendData(filters, 12)

// Comparison View
const comparison = await getMockComparisonData(filters)
```

## Migration to Real APIs

### Before (Mock Layer)
```typescript
const data = await getMockSurveyDashboardData(filters)
```

### After (Real API)
```typescript
// Simply replace with your API call
const data = await fetch('/api/dashboard/survey', {
  method: 'POST',
  body: JSON.stringify(filters)
}).then(r => r.json())
```

**Key:** Both return the same data shape (`DashboardData`), so no component changes needed.

## Data Shapes

All data returned by generators follows TypeScript types defined in `src/mocks/types.ts`:

- `MetricData` — Single KPI (value, delta, trend)
- `ResponseSegment` — Distribution segment (label, value, percentage)
- `ChartDataPoint` — Chart point (label, value)
- `TimeSeriesData` — Time series (id, label, data array)
- `DashboardData` — Complete dashboard (metrics, distribution, timeSeries)
- `FilterCriteria` — Filter options (dateRange, segment, search, etc.)
- `MockApiResponse<T>` — Standard response envelope (success, data, error, metadata)

## Adding New Generators

1. **Create generator function** in appropriate file:

```typescript
// src/mocks/generators/surveyGenerators.ts
export function generateMyData(count: number = 10): MyDataType[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `item-${idx}`,
    value: Math.random() * 100,
  }))
}
```

2. **Export from central index**:

```typescript
// src/mocks/index.ts
export { generateMyData } from './generators/surveyGenerators'
```

3. **Use in dashboard**:

```typescript
import { generateMyData } from '@/mocks'

const data = generateMyData(20)
```

## Simulating Real-World Scenarios

### Network Latency
All central query functions include `addLatencySimulation()` to simulate realistic network delays.

```typescript
await addLatencySimulation(data, 300) // 300ms delay
```

### Error States
Test error UI with simulated failures:

```typescript
const error = await getMockErrorResponse('Network timeout')

// Returns: { success: false, data: null, error: {...} }
```

### Empty States
Test empty data handling:

```typescript
const empty = await getMockEmptyDashboardData()

// Returns: { metrics: [], distribution: { segments: [], total: 0 }, ... }
```

## Phase 8.1 → Phase 9 Transition

**Phase 8.1 (Current):** Complete mock layer with generators, transformers, and queries.

**Phase 8.4:** Dashboards use mock layer exclusively. No hardcoded data.

**Phase 9:** Replace mock queries with real API calls. Data shapes remain identical.

## Guidelines

1. **Never hardcode data in components** — Use mock layer or real API
2. **All data flows via props** — Components are presentation-only
3. **Filters live in URL** — State is shareable
4. **Error/loading/empty states required** — For each section
5. **No business logic in generators** — Factories only, pure data

---

**Next Steps:**
- Phase 8.2: Document dashboard composition patterns
- Phase 8.3: Component decision gate for first screen
- Phase 8.4: Build first dashboard using this mock layer
- Phase 9: Replace mock layer with real APIs (non-breaking swap)
