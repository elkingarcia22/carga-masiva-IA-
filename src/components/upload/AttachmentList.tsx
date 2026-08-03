import { cn } from '@/lib/utils'
import type { UploadFileItem } from './uploadTypes'
import { FilePreview } from './FilePreview'
import type { FilePreviewVariant } from './FilePreview'
import { EmptyState } from '@/components/feedback'
import { Inbox } from 'lucide-react'

export interface AttachmentListProps {
  /** List of files to display */
  files: Array<File | UploadFileItem>
  /** Layout variant for the list */
  variant?: 'list' | 'grid' | 'compact'
  /** Whether items can be removed */
  removable?: boolean
  /** Callback when an item is removed */
  onRemove?: (index: number) => void
  /** Custom empty state node */
  emptyState?: React.ReactNode
  /** Whether the list is disabled */
  disabled?: boolean
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * AttachmentList - UBITS component for managing a collection of files.
 * Supports list, grid, and compact layouts.
 */
export function AttachmentList({
  files,
  variant = 'list',
  removable = false,
  onRemove,
  emptyState,
  disabled = false,
  className,
}: AttachmentListProps) {
  if (files.length === 0) {
    return (
      <div className={cn('py-8', className)}>
        {emptyState || (
          <EmptyState
            title="Sin archivos seleccionados"
            description="Los archivos que selecciones aparecerán aquí."
            icon={Inbox}
          />
        )}
      </div>
    )
  }

  const containerClasses = cn(
    'gap-4',
    variant === 'grid' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    variant === 'list' && 'flex flex-col',
    variant === 'compact' && 'flex flex-wrap gap-2',
    className
  )

  const previewVariant: FilePreviewVariant = variant === 'grid' ? 'card' : variant === 'list' ? 'row' : 'compact'

  return (
    <div className={containerClasses}>
      {files.map((file, index) => (
        <FilePreview
          key={`${file.name}-${index}`}
          file={file}
          variant={previewVariant}
          removable={removable}
          onRemove={() => onRemove?.(index)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
