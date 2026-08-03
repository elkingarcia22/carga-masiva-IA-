import * as React from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatQuarter } from './dateUtils'

export interface QuarterSelectorProps {
  /** Selected value { year, quarter (1-4) } */
  value?: { year: number; quarter: 1 | 2 | 3 | 4 }
  /** Callback when quarter changes */
  onChange?: (value: { year: number; quarter: 1 | 2 | 3 | 4 }) => void
  /** Minimum selectable year */
  minYear?: number
  /** Maximum selectable year */
  maxYear?: number
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

/**
 * QuarterSelector - UBITS component for selecting a fiscal quarter and year.
 * Desktop-first, B2B enterprise style.
 */
export function QuarterSelector({
  value,
  onChange,
  minYear = 1900,
  maxYear = 2100,
  disabled = false,
  label,
  description,
  error,
  placeholder = 'Select quarter',
  className,
}: QuarterSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [viewYear, setViewYear] = React.useState(value?.year || new Date().getFullYear())

  const quarters: Array<{ index: 1 | 2 | 3 | 4; name: string }> = [
    { index: 1, name: 'Q1' },
    { index: 2, name: 'Q2' },
    { index: 3, name: 'Q3' },
    { index: 4, name: 'Q4' },
  ]

  const handleQuarterSelect = (quarterIndex: 1 | 2 | 3 | 4) => {
    onChange?.({ year: viewYear, quarter: quarterIndex })
    setIsOpen(false)
  }

  const handleYearChange = (delta: number) => {
    const nextYear = viewYear + delta
    if (nextYear >= minYear && nextYear <= maxYear) {
      setViewYear(nextYear)
    }
  }

  const hasError = !!error
  const displayText = value ? formatQuarter(value.year, value.quarter) : ''

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
        <PopoverContent className="w-56 p-3" align="start">
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
          <div className="grid grid-cols-2 gap-2">
            {quarters.map((q) => {
              const isSelected = value?.year === viewYear && value?.quarter === q.index
              return (
                <Button
                  key={q.index}
                  variant={isSelected ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-10 w-full text-xs font-medium',
                    isSelected && 'hover:bg-primary/90'
                  )}
                  onClick={() => handleQuarterSelect(q.index)}
                >
                  {q.name}
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
