import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/forms/Field'
import type { SelectionOption, SelectionColumns } from './selectionTypes'

export interface CardSelectionProps {
  /** Array of selectable options */
  options: SelectionOption[]
  /** Current selected value */
  value?: string
  /** Callback when selection changes */
  onChange?: (value: string) => void
  /** Number of columns in the grid */
  columns?: SelectionColumns
  /** Whether the entire control is disabled */
  disabled?: boolean
  /** Label for the control group */
  label?: string
  /** Description for the control group */
  description?: string
  /** Error message to display */
  error?: string
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * CardSelection - UBITS component for choosing one option from a set of cards.
 * Uses semantic button elements for accessibility.
 */
export function CardSelection({
  options,
  value,
  onChange,
  columns = 3,
  disabled = false,
  label,
  description,
  error,
  className,
}: CardSelectionProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <Field
      label={label}
      description={description}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={cn('grid gap-4 mt-2', gridCols)}>
        {options.map((option) => {
          const isSelected = value === option.value
          const isDisabled = disabled || option.disabled
          const Icon = option.icon

          return (
            <button
              key={option.value}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange?.(option.value)}
              className={cn(
                'group relative flex flex-col text-left p-0 rounded-xl outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isDisabled && 'cursor-not-allowed'
              )}
              aria-checked={isSelected}
              role="radio"
            >
              <Card className={cn(
                'flex flex-col w-full h-full p-5 border-2 transition-all duration-200',
                isSelected 
                  ? 'border-primary bg-primary/[0.02] ring-1 ring-primary/20' 
                  : 'border-border/50 bg-card hover:border-primary/30',
                isDisabled && 'opacity-50 grayscale-[0.5] hover:border-border/50'
              )}>
                {/* Header: Icon + Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={cn(
                    'p-2.5 rounded-xl border transition-colors',
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-muted/50 text-muted-foreground border-border/50 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20'
                  )}>
                    {Icon ? <Icon className="h-5 w-5" /> : <CheckCircle2 className={cn('h-5 w-5', isSelected ? 'opacity-100' : 'opacity-20')} />}
                  </div>
                  {option.badge && (
                    <Badge variant={isSelected ? "default" : "outline"} className="font-bold   text-[9px]">
                      {option.badge}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0 flex-1">
                  {option.eyebrow && (
                    <span className="text-[10px] font-bold text-primary/70   mb-1">
                      {option.eyebrow}
                    </span>
                  )}
                  <h4 className="text-sm font-bold truncate leading-snug">
                    {option.label}
                  </h4>
                  {option.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Selected Indicator (Sutil) */}
                {isSelected && (
                  <div className="absolute top-2 right-2 flex items-center justify-center h-5 w-5 bg-primary rounded-full text-primary-foreground shadow-sm">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
              </Card>
            </button>
          )
        })}
      </div>
    </Field>
  )
}
