import { cn } from '@/lib/utils'
import { SectionHeader } from '@/components/utility/SectionHeader'
import { ImageGrid } from './ImageGrid'
import { EmptyGalleryState } from './EmptyGalleryState'
import type { GalleryProps } from './mediaTypes'

/**
 * Gallery - Enterprise container for media collections.
 * Composes SectionHeader and ImageGrid with empty state management.
 */
export function Gallery({
  items,
  title,
  description,
  actions,
  columns = 3,
  variant = 'cards',
  selectable = false,
  selectedIds = [],
  onSelect,
  emptyState,
  disabled = false,
  className,
}: GalleryProps) {
  
  const hasItems = items && items.length > 0

  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <SectionHeader 
          title={title} 
          description={description} 
          actions={actions} 
        />
      )}

      {hasItems ? (
        <ImageGrid 
          items={items}
          columns={columns}
          variant={variant}
          selectable={selectable}
          selectedIds={selectedIds}
          onSelect={onSelect}
          disabled={disabled}
        />
      ) : (
        emptyState || <EmptyGalleryState />
      )}
    </div>
  )
}
