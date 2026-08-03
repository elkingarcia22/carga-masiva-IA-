import * as React from "react"
import { cn } from "@/lib/utils"

export interface Tab {
  id: string
  label: string
}

interface TabsNavProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[]
  activeTabId: string
  onTabChange: (id: string) => void
}

const TabsNav = React.forwardRef<HTMLDivElement, TabsNavProps>(
  ({ tabs, activeTabId, onTabChange, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2 w-full bg-card px-8 py-3",
          className
        )}
        {...props}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all focus:outline-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-muted hover:bg-accent hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    )
  }
)

TabsNav.displayName = "TabsNav"

export { TabsNav }
