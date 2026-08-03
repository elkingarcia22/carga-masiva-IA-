import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        positive: "border-transparent bg-status-positive/10 text-status-positive hover:bg-status-positive/20 dark:bg-status-positive/20 dark:text-status-positive",
        negative: "border-transparent bg-status-negative/10 text-status-negative hover:bg-status-negative/20 dark:bg-status-negative/20 dark:text-status-negative",
        warning: "border-transparent bg-status-warning/10 text-status-warning hover:bg-status-warning/20 dark:bg-status-warning/20 dark:text-status-warning",
        info: "border-transparent bg-status-info/10 text-status-info hover:bg-status-info/20 dark:bg-status-info/20 dark:text-status-info",
        neutral: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
