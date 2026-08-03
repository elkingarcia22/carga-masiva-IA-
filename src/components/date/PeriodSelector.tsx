import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface PeriodSelectorOption {
  label: string
  value: string
  description?: string
}

export interface PeriodSelectorProps {
  /** Selected period value */
  value?: string
  /** Callback when period changes */
  onChange?: (value: string) => void
  /** Predefined period options */
  options?: PeriodSelectorOption[]
  /** Whether the selector is disabled */
  disabled?: boolean
  /** Label for accessibility and UI */
  label?: string
  /** Helper text below the input */
  description?: string
  /** Error message - shows error state if present */
  error?: string
  /** Placeholder text when no value is selected */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
}

const DEFAULT_OPTIONS: PeriodSelectorOption[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last 30 days', value: 'last_30_days' },
  { label: 'This month', value: 'this_month' },
  { label: 'Last month', value: 'last_month' },
  { label: 'This quarter', value: 'this_quarter' },
  { label: 'This year', value: 'this_year' },
  { label: 'Custom range', value: 'custom' },
]

/**
 * PeriodSelector - UBITS component for selecting predefined time periods.
 * Uses a Select component for B2B enterprise style.
 */
export function PeriodSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  disabled = false,
  label,
  description,
  error,
  placeholder = 'Select period',
  className,
}: PeriodSelectorProps) {
  const hasError = !!error

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-foreground', disabled && 'opacity-50')}>
          {label}
        </label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'h-10 px-3 w-full',
            hasError && 'border-destructive ring-destructive/20',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col gap-0.5">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {option.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}
