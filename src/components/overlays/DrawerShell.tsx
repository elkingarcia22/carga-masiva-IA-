import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export interface DrawerShellProps {
  /** Controlled open state */
  open?: boolean
  /** Event handler for open state changes */
  onOpenChange?: (open: boolean) => void
  /** The element that triggers the drawer */
  trigger?: React.ReactNode
  /** Main title of the drawer */
  title?: string
  /** Brief description or subtitle */
  description?: string
  /** Drawer body content */
  children?: React.ReactNode
  /** Custom footer content (replaces actions) */
  footer?: React.ReactNode
  /** Action buttons (usually Primary and Cancel) */
  actions?: React.ReactNode
  /** Side from which the drawer appears */
  side?: "left" | "right" | "top" | "bottom"
  /** Enterprise size variants */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
  /** Custom classes for the sheet content */
  className?: string
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean
  /** Whether to disable default padding in the content area (default: false) */
  disablePadding?: boolean
}

const sideSizeClasses = {
  right: {
    sm: "sm:max-w-sm", // 384px
    md: "sm:max-w-md", // 448px
    lg: "sm:max-w-lg", // 512px
    xl: "sm:max-w-xl", // 576px
    "2xl": "sm:max-w-2xl", // 672px
    "3xl": "sm:max-w-3xl", // 768px
    "4xl": "sm:max-w-4xl", // 896px
    "5xl": "sm:max-w-5xl", // 1024px
    "6xl": "sm:max-w-6xl", // 1152px
    "7xl": "sm:max-w-7xl", // 1280px
    "full": "sm:max-w-full",
  },
  left: {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    "6xl": "sm:max-w-6xl",
    "7xl": "sm:max-w-7xl",
    "full": "sm:max-w-full",
  },
  top: {
    sm: "h-[30vh]",
    md: "h-[50vh]",
    lg: "h-[70vh]",
    xl: "h-[90vh]",
    "2xl": "h-[90vh]",
    "3xl": "h-[90vh]",
    "4xl": "h-[90vh]",
    "5xl": "h-[90vh]",
    "6xl": "h-[90vh]",
    "7xl": "h-[90vh]",
    "full": "h-full",
  },
  bottom: {
    sm: "h-[30vh]",
    md: "h-[50vh]",
    lg: "h-[70vh]",
    xl: "h-[90vh]",
    "2xl": "h-[90vh]",
    "3xl": "h-[90vh]",
    "4xl": "h-[90vh]",
    "5xl": "h-[90vh]",
    "6xl": "h-[90vh]",
    "7xl": "h-[90vh]",
    "full": "h-full",
  },
}

export function DrawerShell({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  actions,
  side = "right",
  size = "md",
  className,
  showCloseButton = true,
  disablePadding = false,
}: DrawerShellProps) {
  const sizeClass = sideSizeClasses[side][size]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent 
        side={side} 
        className={cn(sizeClass, className)}
        showCloseButton={showCloseButton}
        aria-describedby={undefined}
      >
        {(title || description) && (
          <SheetHeader className="border-b bg-background">
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}

        {/* Positioned wrapper for body + footer only, so an `absolute inset-0`
            overlay passed via `footer` covers just this area — never the header. */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className={cn("flex-1 overflow-y-auto flex flex-col bg-background", !disablePadding && "p-4")}>
            {children}
          </div>

          {footer ? (
            footer
          ) : actions ? (
            <SheetFooter className="border-t bg-background">
              {actions}
            </SheetFooter>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
