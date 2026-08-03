import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SelectionOption } from './selectionTypes'

export interface SelectableCardProps {
  /** The option data to display */
  option: SelectionOption
  /** Whether the card is currently selected */
  selected?: boolean
  /** Whether the card is disabled */
  disabled?: boolean
  /** Callback when the card is clicked */
  onSelect?: (value: string) => void
  /** Selection mode for visual indicator */
  mode?: 'single' | 'multiple'
  /** Additional CSS classes */
  className?: string
}

/**
 * SelectableCard - A reusable, low-level selectable card component.
 */
export function SelectableCard({
  option,
  selected = false,
  disabled = false,
  onSelect,
  mode = 'single',
  className,
}: SelectableCardProps) {
  const Icon = option.icon
  const isDisabled = disabled || option.disabled

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelect?.(option.value)}
      className={cn(
        'group relative flex flex-col text-left p-0 rounded-xl outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isDisabled && 'cursor-not-allowed',
        className
      )}
      aria-checked={selected}
      role={mode === 'single' ? 'radio' : 'checkbox'}
    >
      <Card className={cn(
        'flex flex-col w-full h-full p-5 border-2 transition-all duration-200',
        selected 
          ? 'border-primary bg-primary/[0.02] ring-1 ring-primary/20' 
          : 'border-border/50 bg-card hover:border-primary/30',
        isDisabled && 'opacity-50 grayscale-[0.5] hover:border-border/50'
      )}>
        {/* Header: Icon + Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className={cn(
            'p-2.5 rounded-xl border transition-colors',
            selected 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'bg-muted/50 text-muted-foreground border-border/50 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/20'
          )}>
            {Icon ? <Icon className="h-5 w-5" /> : <CheckCircle2 className={cn('h-5 w-5', selected ? 'opacity-100' : 'opacity-20')} />}
          </div>
          {option.badge && (
            <Badge variant={selected ? "default" : "outline"} className="font-bold   text-[9px]">
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

        {/* Indicator */}
        <div className={cn(
          "absolute top-2 right-2 flex items-center justify-center h-5 w-5 rounded-full shadow-sm transition-all duration-200",
          selected ? "bg-primary text-primary-foreground scale-100" : "bg-muted border border-border/50 text-transparent scale-90 opacity-0 group-hover:opacity-100"
        )}>
          {mode === 'single' ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            selected ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />
          )}
        </div>
      </Card>
    </button>
  )
}
