import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, FileText, Video, MoreHorizontal } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { MediaPreviewProps } from './mediaTypes'

/**
 * MediaPreview - Structured inline preview for a single media item.
 * Flexible enough to be used in drawers, modales or detail sections.
 */
export function MediaPreview({
  item,
  title,
  description,
  actions,
  metadata,
  emptyState,
  className,
}: MediaPreviewProps) {
  
  if (!item) {
    return emptyState || (
      <EmptyState 
        icon={ImageIcon}
        title="No hay elemento seleccionado"
        description="Selecciona un recurso multimedia para ver su previsualización técnica."
        className={cn("border-dashed", className)}
      />
    )
  }

  const Icon = {
    image: ImageIcon,
    video: Video,
    document: FileText,
    other: MoreHorizontal,
  }[item.kind || 'image']

  const displayTitle = title || item.title
  const displayDescription = description || item.description
  const displayMetadata = metadata || item.metadata

  return (
    <div className={cn('space-y-6', className)}>
      {/* Visual Container */}
      <div className="relative rounded-lg border border-border/50 bg-muted/30 overflow-hidden min-h-[240px] flex items-center justify-center">
        {item.src ? (
          <img 
            src={item.src} 
            alt={item.alt || displayTitle} 
            className="w-full h-auto max-h-[600px] object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground/30">
            <Icon className="h-20 w-20" />
            <span className="text-sm font-medium">Sin vista previa disponible</span>
          </div>
        )}

        {item.badge && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-none font-bold">
            {item.badge}
          </Badge>
        )}
      </div>

      {/* Info Container */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="space-y-1">
            <h3 className="text-lg font-bold leading-tight">{displayTitle}</h3>
            {displayMetadata && (
              <div className="text-xs font-medium text-muted-foreground  ">
                {displayMetadata}
              </div>
            )}
          </div>
          
          {displayDescription && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {displayDescription}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
