import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, FileText, Video, MoreHorizontal, Check } from 'lucide-react'
import type { PreviewCardProps } from './mediaTypes'

/**
 * PreviewCard - Individual card for media item preview.
 * Focused on visual identification and metadata.
 */
export function PreviewCard({
  item,
  selected = false,
  disabled = false,
  onSelect,
  actions,
  className,
}: PreviewCardProps) {
  
  const Icon = {
    image: ImageIcon,
    video: Video,
    document: FileText,
    other: MoreHorizontal,
  }[item.kind || 'image']

  return (
    <Card 
      className={cn(
        'group relative flex flex-col overflow-hidden transition-all duration-300 border-border/50',
        onSelect && !disabled && 'cursor-pointer hover:border-primary/40',
        selected && 'border-primary ring-1 ring-primary/50 bg-primary/[0.02]',
        disabled && 'opacity-50 cursor-not-allowed grayscale',
        className
      )}
      onClick={() => onSelect && !disabled && onSelect(item.id)}
    >
      {/* Visual Area */}
      <div className="relative aspect-video bg-muted/50 flex items-center justify-center overflow-hidden">
        {item.src ? (
          <img 
            src={item.src} 
            alt={item.alt || item.title} 
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        ) : (
          <Icon className="h-10 w-10 text-muted-foreground/30" />
        )}

        {/* Top Indicators */}
        <div className="absolute top-3 inset-x-3 flex items-start justify-between z-10">
          <div>
            {item.badge && (
              <Badge className="bg-primary text-primary-foreground border-none text-[10px]  font-bold px-2 py-0.5">
                {item.badge}
              </Badge>
            )}
          </div>
          
          {onSelect && (
            <div className={cn(
              'h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center',
              selected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-black/20 border-white/50 opacity-0 group-hover:opacity-100'
            )}>
              {selected && <Check className="h-4 w-4" />}
            </div>
          )}
        </div>
      </div>

      {/* Info Area */}
      <CardHeader className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm line-clamp-1 flex-1 font-bold leading-tight">
            {item.title}
          </CardTitle>
          {item.metadata && (
            <span className="text-[10px] text-muted-foreground font-medium   whitespace-nowrap">
              {item.metadata}
            </span>
          )}
        </div>
        
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {actions && (
          <div className="pt-3 flex items-center gap-2 border-t border-border/40 mt-3" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </CardHeader>
    </Card>
  )
}
