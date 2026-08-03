import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

type ProgressColor = "primary" | "success" | "warning" | "destructive"

const colorMap: Record<ProgressColor, string> = {
  primary: "bg-primary",
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  destructive: "bg-destructive",
}

function Progress({
  className,
  value,
  color = "primary",
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  color?: ProgressColor
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-muted dark:bg-white/10",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("size-full flex-1 rounded-full transition-all", colorMap[color])}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
