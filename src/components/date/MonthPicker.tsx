import * as React from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatMonthYear } from './dateUtils'

export interface MonthPickerProps {
  /** Selected value { year, month (0-11) } */
  value?: { year: number; month: number }
  /** Callback when month changes */
  onChange?: (value: { year: number; month: number }) => void
  /** Minimum selectable year */
  minYear?: number
  /** Maximum selectable year */
  maxYear?: number
  /** Whether the picker is disabled */
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

/**
 * MonthPicker - UBITS component for selecting a specific month and year.
 * Desktop-first, B2B enterprise style.
 */
export function MonthPicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = 2100,
  disabled = false,
  label,
  description,
  error,
  placeholder = 'Select month',
  className,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(value?.year || new Date().getFullYear())

  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2000, i, 1)
      return {
        index: i,
        name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
      }
    })
  }, [])

  const handleMonthSelect = (monthIndex: number) => {
    onChange?.({ year: viewYear, month: monthIndex })
    setIsOpen(false)
  }

  const handleYearChange = (delta: number) => {
    const nextYear = viewYear + delta
    if (nextYear >= minYear && nextYear <= maxYear) {
      setViewYear(nextYear)
    }
  }

  const hasError = !!error
  const displayText = value ? formatMonthYear(value.year, value.month) : ''

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className={cn('text-sm font-medium text-foreground', disabled && 'opacity-50')}>
          {label}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10 px-3',
              !value && 'text-muted-foreground',
              hasError && 'border-destructive ring-destructive/20',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {displayText || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleYearChange(-1)}
              disabled={viewYear <= minYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold">{viewYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleYearChange(1)}
              disabled={viewYear >= maxYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month) => {
              const isSelected = value?.year === viewYear && value?.month === month.index
              return (
                <Button
                  key={month.index}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-9 w-full text-xs font-medium',
                    isSelected && 'hover:bg-primary/90'
                  )}
                  onClick={() => handleMonthSelect(month.index)}
                >
                  {month.name}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}
