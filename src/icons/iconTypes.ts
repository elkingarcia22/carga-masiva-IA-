/**
 * Icon system types for UBITS Enterprise Design System.
 * Defines standard sizes, tones, and properties for icons.
 */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type IconTone =
  | 'default'
  | 'muted'
  | 'primary'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info'
  | 'inverse';

/**
 * Semantic icon names for the UBITS system.
 * These are mapped to specific providers (Lucide, Iconly) in the registry.
 */
export type IconName =
  | 'dashboard'
  | 'analytics'
  | 'survey'
  | 'calendar'
  | 'filter'
  | 'upload'
  | 'download'
  | 'users'
  | 'settings'
  | 'warning'
  | 'success'
  | 'error'
  | 'info'
  | 'trendUp'
  | 'trendDown'
  | 'neutral'
  | 'chart'
  | 'file'
  | 'search'
  | 'chevronDown'
  | 'chevronUp'
  | 'chevronLeft'
  | 'chevronRight'
  | 'arrowLeft'
  | 'arrowRight'
  | 'close'
  | 'check'
  | 'notification'
  | 'home'
  | 'building'
  | 'bolt'
  | 'award'
  | 'palette'
  | 'code'
  | 'help'
  | 'graduation'
  | 'sparkles'
  | 'layers'
  | 'sun'
  | 'moon'
  | 'vacancies'
  | 'templates'
  | 'logout';

export interface UbitsIconProps {
  /** The semantic name of the icon from the registry */
  name: IconName;
  /** standard T-shirt sizes */
  size?: IconSize;
  /** Semantic color tone */
  tone?: IconTone;
  /** Accessibility label for non-decorative icons */
  label?: string;
  /** Whether the icon is purely decorative (hides from screen readers) */
  decorative?: boolean;
  /** Additional CSS classes */
  className?: string;
}
