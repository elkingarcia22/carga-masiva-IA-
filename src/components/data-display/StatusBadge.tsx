import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = 
  | "active" 
  | "inactive" 
  | "pending" 
  | "completed" 
  | "warning" 
  | "error" 
  | "info" 
  | "neutral"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType
  label?: string
}

const statusMap: Record<StatusType, { variant: any; defaultLabel: string }> = {
  active: { variant: "positive", defaultLabel: "Activo" },
  inactive: { variant: "neutral", defaultLabel: "Inactivo" },
  pending: { variant: "warning", defaultLabel: "Pendiente" },
  completed: { variant: "positive", defaultLabel: "Completado" },
  warning: { variant: "warning", defaultLabel: "Advertencia" },
  error: { variant: "negative", defaultLabel: "Error" },
  info: { variant: "info", defaultLabel: "Información" },
  neutral: { variant: "neutral", defaultLabel: "Neutral" },
}

export function StatusBadge({ 
  status, 
  label, 
  className, 
  ...props 
}: StatusBadgeProps) {
  const config = statusMap[status] || statusMap.neutral
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn("font-medium", className)}
      {...props}
    >
      {label || config.defaultLabel}
    </Badge>
  )
}
