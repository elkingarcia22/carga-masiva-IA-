import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { UbitsIcon } from "@/icons/UbitsIcon";
import type { ChipProps } from "./aiInteractionTypes";

const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        default: "border-border bg-background text-foreground hover:bg-accent",
        muted: "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        primary: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        positive: "border-transparent bg-status-positive/10 text-status-positive hover:bg-status-positive/20",
        negative: "border-transparent bg-status-negative/10 text-status-negative hover:bg-status-negative/20",
        warning: "border-transparent bg-status-warning/10 text-status-warning hover:bg-status-warning/20",
        info: "border-transparent bg-status-info/10 text-status-info hover:bg-status-info/20",
        ai: "border-ai-gradient bg-ai-gradient/5 hover:bg-ai-gradient/10",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        md: "h-8 px-3 text-sm",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        tone: "primary",
        selected: true,
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        tone: "default",
        selected: true,
        className: "border-primary bg-primary/5 text-primary",
      },
      {
        tone: "positive",
        selected: true,
        className: "bg-status-positive text-primary-foreground hover:bg-status-positive/90",
      },
    ],
    defaultVariants: {
      tone: "default",
      size: "md",
      selected: false,
    },
  }
);

export function Chip({
  label,
  selected = false,
  removable = false,
  disabled = false,
  icon,
  count,
  tone = "default",
  size = "md",
  onClick,
  onRemove,
  className,
}: ChipProps) {
  const isClickable = !!onClick && !disabled;
  const isAI = tone === "ai";

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  const Content = (
    <>
      {icon && (
        <UbitsIcon 
          name={icon} 
          size={size === "sm" ? "xs" : "sm"} 
          className={cn(
            "shrink-0", 
            selected ? "opacity-100" : "opacity-70",
            isAI && "text-ai-gradient"
          )}
        />
      )}
      <span className={cn("truncate font-medium", isAI && "text-ai-gradient")}>
        {label}
      </span>
      {typeof count === "number" && (
        <span className={cn(
          "ml-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold",
          selected ? "bg-white/20 text-current" : "bg-muted-foreground/10 text-muted-foreground",
          isAI && !selected && "bg-ai-gradient/10 text-ai-gradient"
        )}>
          {count}
        </span>
      )}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            "ml-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10",
            disabled && "pointer-events-none"
          )}
          aria-label={`Remove ${label}`}
        >
          <UbitsIcon name="close" size="xs" className={cn(isAI && "text-ai-gradient")} />
        </button>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-pressed={selected}
        className={cn(chipVariants({ tone, size, selected, className }), "cursor-pointer")}
      >
        {Content}
      </button>
    );
  }

  return (
    <div className={cn(chipVariants({ tone, size, selected, className }))}>
      {Content}
    </div>
  );
}
