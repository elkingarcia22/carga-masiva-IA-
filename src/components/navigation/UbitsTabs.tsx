import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
}

interface UbitsTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

/**
 * UBITS PREMIUM DUAL TABS
 * Minimalist, enterprise-grade navigation component.
 * Strictly uses Inter typography and UBITS design tokens.
 */
export const UbitsTabs: React.FC<UbitsTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn("inline-flex items-center p-1 bg-surface-muted/40 rounded-full border border-border/30 mb-8 backdrop-blur-md", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative px-7 py-2.5 transition-all duration-500 outline-none rounded-full text-xs font-bold tracking-tight",
              isActive 
                ? "bg-primary text-text-inverse shadow-lg shadow-primary/20" 
                : "text-text-secondary/50 hover:text-text-primary hover:bg-surface/60"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
