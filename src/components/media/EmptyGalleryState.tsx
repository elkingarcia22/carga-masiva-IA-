import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Image as ImageIcon } from 'lucide-react'
import type { EmptyGalleryStateProps } from './mediaTypes'

/**
 * EmptyGalleryState - Specialized empty state for media collections.
 */
export function EmptyGalleryState({
  title = "Sin elementos multimedia",
  description = "No se han encontrado recursos en esta colección. Sube archivos o ajusta los filtros.",
  action,
  className,
}: EmptyGalleryStateProps) {
  return (
    <EmptyState 
      icon={ImageIcon}
      title={title}
      description={description}
      action={action}
      className={cn("bg-muted/10 border-dashed border-2 min-h-[300px]", className)}
    />
  )
}
