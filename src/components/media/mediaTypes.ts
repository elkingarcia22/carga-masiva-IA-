import type { ReactNode } from 'react'

export type CarouselOrientation = 'horizontal' | 'vertical'

export interface UbitsCarouselProps {
  /** The content items to display in the carousel */
  children: ReactNode
  /** Optional title for the carousel section */
  title?: string
  /** Optional description for the carousel section */
  description?: string
  /** Optional actions (e.g., buttons) to display next to the title */
  actions?: ReactNode
  /** Whether to show previous/next control buttons */
  showControls?: boolean
  /** Whether to show pagination dots */
  showDots?: boolean
  /** Whether the carousel should loop infinitely */
  loop?: boolean
  /** Orientation of the carousel */
  orientation?: CarouselOrientation
  /** Additional CSS classes for the main container */
  className?: string
  /** Additional CSS classes for the content wrapper */
  contentClassName?: string
  /** Additional CSS classes for each carousel item */
  itemClassName?: string
  /** Accessible label for the carousel */
  ariaLabel?: string
}

export type MediaItemKind = 'image' | 'video' | 'document' | 'other'

export interface MediaItem {
  /** Unique identifier */
  id: string
  /** Main display title */
  title: string
  /** Optional secondary description */
  description?: string
  /** Optional source URL (can be placeholder) */
  src?: string
  /** Optional alt text for images */
  alt?: string
  /** Type of media */
  kind?: MediaItemKind
  /** Optional badge text */
  badge?: string
  /** Optional metadata text (e.g., "1.2 MB", "12 slides") */
  metadata?: string
  /** Whether the specific item is disabled */
  disabled?: boolean
  /** Whether the item spans multiple columns in bento layout */
  colSpan?: 1 | 2
  /** Whether the item spans multiple rows in bento layout */
  rowSpan?: 1 | 2
}

export type ImageGridColumns = 2 | 3 | 4
export type ImageGridVariant = 'cards' | 'compact' | 'bento'

export interface ImageGridProps {
  /** Array of media items to display */
  items: MediaItem[]
  /** Number of grid columns (default: 3) */
  columns?: ImageGridColumns
  /** Visual style of the items */
  variant?: ImageGridVariant
  /** Whether items can be selected */
  selectable?: boolean
  /** IDs of currently selected items */
  selectedIds?: string[]
  /** Callback when an item selection state changes */
  onSelect?: (id: string) => void
  /** Whether the entire grid is disabled */
  disabled?: boolean
  /** Additional CSS classes for the grid container */
  className?: string
}

export interface GalleryProps extends Omit<ImageGridProps, 'className'> {
  /** Optional title for the gallery section */
  title?: string
  /** Optional description for the gallery section */
  description?: string
  /** Optional actions to display next to the title */
  actions?: ReactNode
  /** Custom empty state to display when there are no items */
  emptyState?: ReactNode
  /** Additional CSS classes for the gallery wrapper */
  className?: string
}

export interface PreviewCardProps {
  /** The media item to display */
  item: MediaItem
  /** Whether the card is selected */
  selected?: boolean
  /** Whether the card is disabled */
  disabled?: boolean
  /** Callback when the card is clicked/selected */
  onSelect?: (id: string) => void
  /** Optional actions to display in the card */
  actions?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export interface MediaPreviewProps {
  /** The media item to preview */
  item?: MediaItem
  /** Optional title to override item title */
  title?: string
  /** Optional description to override item description */
  description?: string
  /** Optional actions (e.g., download button) */
  actions?: ReactNode
  /** Optional metadata to display (can override item metadata) */
  metadata?: ReactNode
  /** Custom empty state when no item is provided */
  emptyState?: ReactNode
  /** Additional CSS classes */
  className?: string
}

export interface EmptyGalleryStateProps {
  /** Title for the empty state */
  title?: string
  /** Description for the empty state */
  description?: string
  /** Optional action (e.g., "Upload") */
  action?: ReactNode
  /** Additional CSS classes */
  className?: string
}
