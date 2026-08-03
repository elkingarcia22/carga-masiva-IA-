import { cn } from "@/lib/utils";
import { UbitsIcon } from "@/icons/UbitsIcon";
import type { IconName } from "@/icons/iconTypes";
import type { SaveIndicatorProps } from "./aiInteractionTypes";

export function SaveIndicator({
  status,
  label,
  timestamp,
  compact = false,
  className,
}: SaveIndicatorProps) {
  const config: Record<string, { icon: IconName; color: string; label: string }> = {
    idle: {
      icon: "layers",
      color: "text-muted-foreground",
      label: "En la nube",
    },
    saving: {
      icon: "bolt",
      color: "text-primary",
      label: "Guardando...",
    },
    saved: {
      icon: "success",
      color: "text-status-positive",
      label: "Guardado",
    },
    error: {
      icon: "error",
      color: "text-status-negative",
      label: "Error al guardar",
    },
    offline: {
      icon: "warning",
      color: "text-muted-foreground",
      label: "Sin conexión",
    },
  };

  const { icon, color, label: defaultLabel } = config[status];
  const displayLabel = label || defaultLabel;

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 transition-all duration-300", 
        color,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <UbitsIcon 
        name={icon} 
        size="xs" 
        className={cn(status === "saving" && "animate-spin")} 
      />
      {!compact && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium leading-none">{displayLabel}</span>
          {timestamp && status === "saved" && (
            <span className="text-[10px] opacity-60 leading-none">
              {timestamp}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
