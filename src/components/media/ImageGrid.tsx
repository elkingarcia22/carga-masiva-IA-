import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, FileText, Video, MoreHorizontal, Check } from 'lucide-react'
import type { ImageGridProps, MediaItem } from './mediaTypes'

/**
 * ImageGrid - Technical component for rendering media items in a grid.
 * Supports cards, compact and controlled bento layouts.
 */
export function ImageGrid({
  items,
  columns = 3,
  variant = 'cards',
  selectable = false,
  selectedIds = [],
  onSelect,
  disabled = false,
  className,
}: ImageGridProps) {
  
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  const containerStyles = cn(
    'grid gap-6',
    variant === 'bento' ? 'grid-cols-2 md:grid-cols-4 auto-rows-[200px] grid-flow-dense' : gridCols,
    className
  )

  return (
    <div className={containerStyles}>
      {items.map((item) => (
        <MediaCard 
          key={item.id} 
          item={item} 
          variant={variant}
          selectable={selectable}
          selected={selectedIds.includes(item.id)}
          onSelect={onSelect}
          disabled={disabled || item.disabled}
        />
      ))}
    </div>
  )
}

function MediaCard({ 
  item, 
  variant, 
  selectable, 
  selected, 
  onSelect, 
  disabled 
}: { 
  item: MediaItem
  variant: string
  selectable: boolean
  selected: boolean
  onSelect?: (id: string) => void
  disabled?: boolean
}) {
  const Icon = {
    image: ImageIcon,
    video: Video,
    document: FileText,
    other: MoreHorizontal,
  }[item.kind || 'image']

  const isBento = variant === 'bento'
  const isCompact = variant === 'compact'

  const bentoClasses = cn(
    item.colSpan === 2 && 'md:col-span-2',
    item.rowSpan === 2 && 'md:row-span-2'
  )

  return (
    <div 
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        isBento ? bentoClasses : 'flex flex-col',
        selectable && 'cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed grayscale'
      )}
      onClick={() => !disabled && selectable && onSelect?.(item.id)}
    >
      <Card className={cn(
        'h-full border-border/50 transition-colors',
        selected && 'border-primary ring-1 ring-primary/50 bg-primary/[0.02]',
        !selected && !disabled && 'hover:border-primary/30'
      )}>
        {/* Preview Area */}
        <div className={cn(
          'relative bg-muted/50 flex items-center justify-center overflow-hidden',
          !isBento && (isCompact ? 'aspect-square' : 'aspect-video'),
          isBento && 'absolute inset-0'
        )}>
          {item.src ? (
            <img 
              src={item.src} 
              alt={item.alt || item.title} 
              className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
            />
          ) : (
            <Icon className={cn(
              "text-muted-foreground/30",
              isBento && (item.rowSpan === 2 || item.colSpan === 2) ? "h-16 w-16" : "h-10 w-10"
            )} />
          )}

          {/* Selection Indicator */}
          {selectable && (
            <div className={cn(
              'absolute top-3 right-3 h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center z-10',
              selected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-black/20 border-white/50 opacity-0 group-hover:opacity-100'
            )}>
              {selected && <Check className="h-4 w-4" />}
            </div>
          )}

          {/* Badge */}
          {item.badge && !isCompact && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground border-none text-[10px] uppercase font-bold z-10">
              {item.badge}
            </Badge>
          )}

          {/* Bento Overlay */}
          {isBento && (
            <div className="absolute inset-x-0 bottom-0 p-5 bg-card/95 border-t border-border/50">
              <p className="font-bold text-sm leading-tight text-foreground">{item.title}</p>
              {item.metadata && <p className="text-muted-foreground text-[10px] mt-1 font-medium">{item.metadata}</p>}
            </div>
          )}
        </div>

        {/* Content Area (Not for Bento/Compact with no space) */}
        {!isBento && !isCompact && (
          <CardHeader className="p-4 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm line-clamp-1">{item.title}</CardTitle>
              {item.metadata && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.metadata}</span>}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </CardHeader>
        )}

        {/* Minimal info for compact */}
        {isCompact && (
          <div className="p-2 border-t border-border/50">
            <p className="text-[11px] font-bold truncate text-center">{item.title}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
