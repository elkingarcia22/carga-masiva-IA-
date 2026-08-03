import * as React from "react";
import { cn } from "@/lib/utils";
import { UbitsIcon } from "@/icons";
import type { NavigationComponentProps, NavigationItem } from "./navigationTypes";

export const UbitsMobileTabBar: React.FC<NavigationComponentProps<NavigationItem>> = ({
  items,
  activeItemId,
  onItemSelect,
  className,
}) => {
  // Limited to max 5 items as per best practices
  const visibleItems = items.slice(0, 5);

  return (
    <nav
      className={cn(
        "flex items-center justify-around w-full h-16 bg-surface border-t border-border px-2 pb-safe",
        className
      )}
      aria-label="Mobile navigation"
    >
      {visibleItems.map((item) => {
        const isActive = activeItemId === item.id;
        const isDisabled = item.disabled;

        return (
          <button
            key={item.id}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onItemSelect?.(item.id)}
            className={cn(
              "relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg",
              isActive ? "text-brand" : "text-text-muted hover:text-text-primary",
              isDisabled && "opacity-40 cursor-not-allowed"
            )}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative">
              {item.icon && (
                <UbitsIcon
                  name={item.icon}
                  size="md"
                  tone={isActive ? "primary" : "default"}
                  className={cn(isActive ? "opacity-100" : "opacity-60")}
                />
              )}
              {item.badge && (
                <span className={cn(
                  "absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[8px] font-bold rounded-full bg-destructive text-text-inverse border-2 border-surface",
                  item.badge.dot && "w-2 h-2 p-0 -top-0.5 -right-0.5"
                )}>
                  {!item.badge.dot && item.badge.count}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
