import * as React from 'react';
import { cn } from '@/lib/utils';
import { iconRegistry, IconFallback } from './iconRegistry';
import type { UbitsIconProps } from './iconTypes';

/**
 * UbitsIcon Wrapper Component.
 * Standardizes icon rendering across the application.
 *
 * Handles:
 * - Semantic naming (Registry lookup)
 * - T-shirt sizing (xs, sm, md, lg, xl)
 * - Semantic toning (primary, positive, negative, etc.)
 * - Accessibility (decorative vs meaningful)
 * - Token consistency
 */
export const UbitsIcon: React.FC<UbitsIconProps> = ({
  name,
  size = 'md',
  tone = 'default',
  label,
  decorative = true,
  className,
}) => {
  const IconComponent = iconRegistry[name] || IconFallback;

  // Size mapping using Tailwind classes for consistency
  const sizeClasses = {
    xs: 'size-3.5',
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
    xl: 'size-10',
  };

  // Tone mapping using design system semantic tokens
  const toneClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
    positive: 'text-success',
    negative: 'text-destructive',
    warning: 'text-warning',
    info: 'text-info',
    inverse: 'text-primary-foreground',
  };

  // Accessibility requirements
  const a11yProps = decorative
    ? { 'aria-hidden': true }
    : {
        role: 'img',
        'aria-label': label || `${name} icon`,
      };

  return (
    <IconComponent
      className={cn(
        'shrink-0 transition-colors',
        sizeClasses[size],
        toneClasses[tone],
        className
      )}
      {...a11yProps}
    />
  );
};

UbitsIcon.displayName = 'UbitsIcon';
