import { cn } from '@/lib/utils'
import { DatePicker } from './DatePicker'
import { DateRangePicker } from './DateRangePicker'
import { PeriodSelector } from './PeriodSelector'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type DateFilterMode = 'period' | 'date' | 'range'

export interface DateFilterBarProps {
  /** Selected period value */
  period?: string
  /** Callback when period changes */
  onPeriodChange?: (value: string) => void
  /** Selected single date */
  date?: Date
  /** Callback when single date changes */
  onDateChange?: (date?: Date) => void
  /** Selected date range */
  range?: { from?: Date; to?: Date }
  /** Callback when date range changes */
  onRangeChange?: (range?: { from?: Date; to?: Date }) => void
  /** Current active mode */
  mode?: DateFilterMode
  /** Callback when mode changes */
  onModeChange?: (mode: DateFilterMode) => void
  /** Whether the entire bar is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * DateFilterBar - UBITS component that composes multiple date selection modes.
 * Desktop-first, horizontal layout, B2B enterprise style.
 */
export function DateFilterBar({
  period,
  onPeriodChange,
  date,
  onDateChange,
  range,
  onRangeChange,
  mode = 'period',
  onModeChange,
  disabled = false,
  className,
}: DateFilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex flex-col gap-1">
        <label className={cn('text-[10px] font-bold uppercase tracking-wider text-muted-foreground', disabled && 'opacity-50')}>
          Filter Mode
        </label>
        <Select
          value={mode}
          onValueChange={(val) => onModeChange?.(val as DateFilterMode)}
          disabled={disabled}
        >
          <SelectTrigger className="h-10 w-32 px-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">Period</SelectItem>
            <SelectItem value="date">Specific Date</SelectItem>
            <SelectItem value="range">Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[180px]">
        <label className={cn('text-[10px] font-bold uppercase tracking-wider text-muted-foreground', disabled && 'opacity-50')}>
          {mode === 'period' ? 'Select Period' : mode === 'date' ? 'Select Date' : 'Select Range'}
        </label>
        
        {mode === 'period' && (
          <PeriodSelector
            value={period}
            onChange={onPeriodChange}
            disabled={disabled}
            className="w-full"
          />
        )}

        {mode === 'date' && (
          <DatePicker
            value={date}
            onChange={onDateChange}
            disabled={disabled}
            placeholder="Pick a date"
            className="w-full"
          />
        )}

        {mode === 'range' && (
          <DateRangePicker
            value={range}
            onChange={onRangeChange}
            disabled={disabled}
            placeholder="Pick a range"
            className="w-full"
          />
        )}
      </div>
    </div>
  )
}
