import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  tone?: "neutral" | "info" | "success" | "warning" | "danger"
  removable?: boolean
  onRemove?: () => void
}

/**
 * Tag
 * 
 * Standalone compact label for metadata, visual filtering or light categorization.
 * Distinct from StatusBadge as it's not strictly tied to entity states.
 */
export function Tag({
  label,
  tone = "neutral",
  removable = false,
  onRemove,
  className,
  ...props
}: TagProps) {
  const toneClasses = {
    neutral: "bg-secondary text-secondary-foreground border-transparent",
    info: "bg-status-info/10 text-status-info border-status-info/20",
    success: "bg-status-positive/10 text-status-positive border-status-positive/20",
    warning: "bg-status-warning/10 text-status-warning border-status-warning/20",
    danger: "bg-status-negative/10 text-status-negative border-status-negative/20",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      <span>{label}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Eliminar ${label}`}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
